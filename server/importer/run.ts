import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { parseProfile } from "@/server/importer/parsers/profile";
import { parseEducation } from "@/server/importer/parsers/education";
import { parseExperience } from "@/server/importer/parsers/experience";
import { parseSkills } from "@/server/importer/parsers/skills";
import { parseValues } from "@/server/importer/parsers/values";
import {
  parseJobDescription,
  parseTailoringStrategy,
  parseCompanyNotes,
} from "@/server/importer/parsers/applications";

export type ImportReport = {
  result: "success" | "partial" | "failed";
  imported: number;
  updated: number;
  skipped: { file: string; error: string }[];
};

function safe<T>(
  file: string,
  fn: () => T,
  skipped: ImportReport["skipped"]
): T | null {
  try {
    return fn();
  } catch (e) {
    skipped.push({ file, error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

export async function runImport(repoPath: string): Promise<ImportReport> {
  const report: ImportReport = {
    result: "success",
    imported: 0,
    updated: 0,
    skipped: [],
  };

  // Profile
  const profilePath = path.join(repoPath, "profile.md");
  if (existsSync(profilePath)) {
    const parsed = safe(
      profilePath,
      () => parseProfile(readFileSync(profilePath, "utf8")),
      report.skipped
    );
    if (parsed) {
      const existing = await db.profile.findUnique({
        where: { userId: CURRENT_USER_ID },
      });
      const profile = await db.profile.upsert({
        where: { userId: CURRENT_USER_ID },
        create: { ...parsed.profile, userId: CURRENT_USER_ID },
        update: parsed.profile,
      });
      await db.$transaction([
        db.keyQualification.deleteMany({ where: { profileId: profile.id } }),
        db.keyQualification.createMany({
          data: parsed.keyQualifications.map((k) => ({
            ...k,
            profileId: profile.id,
          })),
        }),
        db.language.deleteMany({ where: { profileId: profile.id } }),
        db.language.createMany({
          data: parsed.languages.map((l) => ({ ...l, profileId: profile.id })),
        }),
      ]);
      if (existing) report.updated += 1;
      else report.imported += 1;
    }
  }

  // Education
  const educationPath = path.join(repoPath, "education.md");
  if (existsSync(educationPath)) {
    const entries = safe(
      educationPath,
      () => parseEducation(readFileSync(educationPath, "utf8")),
      report.skipped
    );
    if (entries) {
      await db.educationEntry.deleteMany({ where: { userId: CURRENT_USER_ID } });
      if (entries.length) {
        await db.educationEntry.createMany({
          data: entries.map((e) => ({ ...e, userId: CURRENT_USER_ID })),
        });
        report.imported += entries.length;
      }
    }
  }

  // Experience roles + achievements + highlights
  const expDir = path.join(repoPath, "experience");
  if (existsSync(expDir)) {
    const files = readdirSync(expDir).filter(
      (f) => f.endsWith(".md") && f !== "_template.md"
    );
    for (const file of files) {
      const filePath = path.join(expDir, file);
      const slug = file.replace(/\.md$/, "");
      const parsed = safe(
        filePath,
        () => parseExperience(readFileSync(filePath, "utf8"), slug),
        report.skipped
      );
      if (!parsed) continue;
      const { role, achievements, highlights } = parsed;
      const tagRows = await db.tag.findMany({
        where: { slug: { in: role.tagSlugs } },
      });
      const existing = await db.experienceRole.findFirst({
        where: { userId: CURRENT_USER_ID, slug },
      });
      const { tagSlugs, ...roleData } = role;
      const written = await db.experienceRole.upsert({
        where: { userId_slug: { userId: CURRENT_USER_ID, slug } },
        create: { ...roleData, userId: CURRENT_USER_ID },
        update: roleData,
      });
      await db.$transaction([
        db.roleTag.deleteMany({ where: { roleId: written.id } }),
        db.roleTag.createMany({
          data: tagRows.map((t) => ({ roleId: written.id, tagId: t.id })),
        }),
        db.achievement.deleteMany({ where: { roleId: written.id } }),
        db.highlight.deleteMany({ where: { roleId: written.id } }),
      ]);
      for (const a of achievements) {
        const created = await db.achievement.create({
          data: {
            roleId: written.id,
            title: a.title,
            result: a.result,
            context: a.context,
            action: a.action,
            order: a.order,
          },
        });
        const aTags = await db.tag.findMany({
          where: { slug: { in: a.tagSlugs } },
        });
        if (aTags.length) {
          await db.achievementTag.createMany({
            data: aTags.map((t) => ({
              achievementId: created.id,
              tagId: t.id,
            })),
          });
        }
      }
      if (highlights.length) {
        await db.highlight.createMany({
          data: highlights.map((h) => ({ ...h, roleId: written.id })),
        });
      }
      if (existing) report.updated += 1;
      else report.imported += 1;
    }
  }

  // Skills
  const skillsPath = path.join(repoPath, "skills.md");
  if (existsSync(skillsPath)) {
    const parsed = safe(
      skillsPath,
      () => parseSkills(readFileSync(skillsPath, "utf8")),
      report.skipped
    );
    if (parsed) {
      for (const cat of parsed.categories) {
        const c = await db.skillCategory.upsert({
          where: { userId_name: { userId: CURRENT_USER_ID, name: cat.name } },
          create: { name: cat.name, order: cat.order, userId: CURRENT_USER_ID },
          update: { order: cat.order },
        });
        await db.skill.deleteMany({ where: { categoryId: c.id } });
        for (const s of cat.skills) {
          const skill = await db.skill.create({
            data: {
              name: s.name,
              proficiency: s.proficiency,
              notes: s.notes,
              order: s.order,
              categoryId: c.id,
            },
          });
          const matchingRoles = await db.experienceRole.findMany({
            where: {
              userId: CURRENT_USER_ID,
              company: { in: s.appliedAt },
            },
            select: { id: true },
          });
          if (matchingRoles.length) {
            await db.skillApplication.createMany({
              data: matchingRoles.map((r) => ({
                skillId: skill.id,
                roleId: r.id,
              })),
            });
          }
          report.imported += 1;
        }
      }
    }
  }

  // Values
  const valuesPath = path.join(repoPath, "values.md");
  if (existsSync(valuesPath)) {
    const parsed = safe(
      valuesPath,
      () => parseValues(readFileSync(valuesPath, "utf8")),
      report.skipped
    );
    if (parsed) {
      await db.$transaction([
        db.valuePrinciple.deleteMany({ where: { userId: CURRENT_USER_ID } }),
        db.valueIndustryOpinion.deleteMany({
          where: { userId: CURRENT_USER_ID },
        }),
        db.valueLinkedInTheme.deleteMany({ where: { userId: CURRENT_USER_ID } }),
      ]);
      if (parsed.principles.length) {
        await db.valuePrinciple.createMany({
          data: parsed.principles.map((p) => ({
            ...p,
            userId: CURRENT_USER_ID,
          })),
        });
      }
      if (parsed.narrative) {
        await db.valueCareerNarrative.upsert({
          where: { userId: CURRENT_USER_ID },
          create: { userId: CURRENT_USER_ID, text: parsed.narrative },
          update: { text: parsed.narrative },
        });
      }
      if (parsed.opinions.length) {
        await db.valueIndustryOpinion.createMany({
          data: parsed.opinions.map((o) => ({
            ...o,
            userId: CURRENT_USER_ID,
          })),
        });
      }
      if (parsed.themes.length) {
        await db.valueLinkedInTheme.createMany({
          data: parsed.themes.map((t) => ({ ...t, userId: CURRENT_USER_ID })),
        });
      }
      report.imported +=
        parsed.principles.length +
        parsed.opinions.length +
        parsed.themes.length +
        (parsed.narrative ? 1 : 0);
    }
  }

  // Applications
  const appsDir = path.join(repoPath, "applications");
  if (existsSync(appsDir) && statSync(appsDir).isDirectory()) {
    const folders = readdirSync(appsDir).filter((f) =>
      statSync(path.join(appsDir, f)).isDirectory()
    );
    for (const folder of folders) {
      const appPath = path.join(appsDir, folder);
      const jdPath = path.join(appPath, "job-description.md");
      if (!existsSync(jdPath)) continue;
      const jd = safe(
        jdPath,
        () => parseJobDescription(readFileSync(jdPath, "utf8")),
        report.skipped
      );
      if (!jd) continue;
      const h1 = jd.content.match(/^#\s+(.+?)$/m)?.[1] ?? folder;
      const [company, roleTitleRaw] = h1.split(/\s+[—-]\s+/);
      const roleTitle = roleTitleRaw ?? folder;
      const existing = await db.application.findFirst({
        where: { userId: CURRENT_USER_ID, slug: folder },
      });
      const app = await db.application.upsert({
        where: { userId_slug: { userId: CURRENT_USER_ID, slug: folder } },
        create: {
          userId: CURRENT_USER_ID,
          slug: folder,
          company: (company ?? folder).trim(),
          roleTitle: roleTitle.trim(),
          language: "en",
        },
        update: {
          company: (company ?? folder).trim(),
          roleTitle: roleTitle.trim(),
        },
      });
      await db.jobDescription.upsert({
        where: { applicationId: app.id },
        create: {
          applicationId: app.id,
          sourceType: jd.sourceType,
          sourceValue: jd.sourceValue,
          capturedAt: jd.capturedAt ? new Date(jd.capturedAt) : new Date(),
          content: jd.content,
        },
        update: {
          sourceType: jd.sourceType,
          sourceValue: jd.sourceValue,
          content: jd.content,
        },
      });
      const strategyPath = path.join(appPath, "tailoring-strategy.md");
      if (existsSync(strategyPath)) {
        const strat = safe(
          strategyPath,
          () => parseTailoringStrategy(readFileSync(strategyPath, "utf8")),
          report.skipped
        );
        if (strat) {
          await db.tailoringStrategy.upsert({
            where: { applicationId: app.id },
            create: {
              applicationId: app.id,
              content: strat as Prisma.InputJsonValue,
            },
            update: { content: strat as Prisma.InputJsonValue },
          });
        }
      }
      const notesPath = path.join(appPath, "company-notes.md");
      if (existsSync(notesPath)) {
        const notes = safe(
          notesPath,
          () => parseCompanyNotes(readFileSync(notesPath, "utf8")),
          report.skipped
        );
        if (notes) {
          const now = new Date();
          await db.companyNotes.upsert({
            where: { applicationId: app.id },
            create: {
              applicationId: app.id,
              content: notes as Prisma.InputJsonValue,
              researchedAt: now,
              lastUpdated: now,
            },
            update: {
              content: notes as Prisma.InputJsonValue,
              lastUpdated: now,
            },
          });
        }
      }
      for (const kind of ["cv", "cover-letter"] as const) {
        const pdf = path.join(appPath, `${kind}.pdf`);
        const typ = path.join(appPath, `${kind}.typ`);
        if (existsSync(typ) || existsSync(pdf)) {
          const dbKind = kind === "cv" ? "cv" : "cover_letter";
          const existingArt = await db.artifact.findFirst({
            where: { applicationId: app.id, kind: dbKind },
          });
          if (!existingArt) {
            await db.artifact.create({
              data: {
                applicationId: app.id,
                kind: dbKind,
                typstSource: existsSync(typ) ? readFileSync(typ, "utf8") : "",
                pdfPath: existsSync(pdf) ? pdf : null,
                version: 1,
              },
            });
          }
        }
      }
      if (existing) report.updated += 1;
      else report.imported += 1;
    }
  }

  if (report.skipped.length > 0) {
    report.result =
      report.imported + report.updated > 0 ? "partial" : "failed";
  }
  if (report.imported + report.updated === 0 && report.skipped.length === 0) {
    report.result = "failed";
  }
  return report;
}
