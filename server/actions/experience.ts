"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ExperienceRoleSchema } from "@/server/validation/experience";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  return {
    slug: String(fd.get("slug") ?? ""),
    company: String(fd.get("company") ?? ""),
    title: String(fd.get("title") ?? ""),
    startDate: String(fd.get("startDate") ?? ""),
    endDate: String(fd.get("endDate") ?? "") || null,
    location: String(fd.get("location") ?? "") || null,
    employmentType: String(fd.get("employmentType") ?? "") as "full_time" | "part_time" | "contract" | "internship",
    companyUrl: String(fd.get("companyUrl") ?? "") || null,
    overview: String(fd.get("overview") ?? ""),
    scopeTeamSize: String(fd.get("scopeTeamSize") ?? "") || null,
    scopeReportingTo: String(fd.get("scopeReportingTo") ?? "") || null,
    scopeTechStack: String(fd.get("scopeTechStack") ?? "") || null,
    scopeBudget: String(fd.get("scopeBudget") ?? "") || null,
    isHighlightsOnly: fd.get("isHighlightsOnly") === "on",
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

async function setRoleTags(roleId: number, tagSlugs: string[]) {
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } }); // scopeToUser: role belongs to current user (verified by caller)
  await db.$transaction([
    db.roleTag.deleteMany({ where: { roleId } }), // scopeToUser: roleId scoped by caller
    db.roleTag.createMany({ data: tags.map((t) => ({ roleId, tagId: t.id })) }), // scopeToUser: roleId scoped by caller
  ]);
}

export async function createRole(fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
  const parsed = ExperienceRoleSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  try {
    const role = await db.experienceRole.create({ data: { ...data, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
    await setRoleTags(role.id, tagSlugs);
    revalidatePath("/experience");
    return ok({ id: role.id, slug: role.slug });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "A role with this slug already exists.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function updateRole(id: number, fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
  const parsed = ExperienceRoleSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  const existing = await db.experienceRole.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!existing) return err("NOT_FOUND", "Role not found.");
  try {
    const role = await db.experienceRole.update({ where: { id }, data }); // scopeToUser: ownership verified above
    await setRoleTags(role.id, tagSlugs);
    revalidatePath(`/experience/${role.slug}`);
    revalidatePath("/experience");
    return ok({ id: role.id, slug: role.slug });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "A role with this slug already exists.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function deleteRole(id: number): Promise<ActionResult<null>> {
  const existing = await db.experienceRole.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!existing) return err("NOT_FOUND", "Role not found.");
  await db.experienceRole.delete({ where: { id } }); // scopeToUser: ownership verified above
  revalidatePath("/experience");
  return ok(null);
}

export async function createAchievement(roleId: number, fd: FormData): Promise<ActionResult<{ id: number }>> {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  const input = {
    title: String(fd.get("title") ?? ""),
    result: String(fd.get("result") ?? ""),
    context: String(fd.get("context") ?? ""),
    action: String(fd.get("action") ?? ""),
    order: Number(fd.get("order") ?? 0),
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
  const { AchievementSchema } = await import("@/server/validation/experience");
  const parsed = AchievementSchema.safeParse(input);
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid achievement.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  const role = await db.experienceRole.findFirst({ where: { id: roleId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!role) return err("NOT_FOUND", "Role not found.");
  const a = await db.achievement.create({ data: { ...data, roleId } }); // scopeToUser: roleId belongs to verified role above
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } }); // scopeToUser: no user scope needed on Tag
  if (tags.length) await db.achievementTag.createMany({ data: tags.map((t) => ({ achievementId: a.id, tagId: t.id })) }); // scopeToUser: achievementId scoped via role
  revalidatePath(`/experience/${role.slug}`);
  return ok({ id: a.id });
}

export async function updateAchievement(id: number, fd: FormData): Promise<ActionResult<null>> {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  const input = {
    title: String(fd.get("title") ?? ""),
    result: String(fd.get("result") ?? ""),
    context: String(fd.get("context") ?? ""),
    action: String(fd.get("action") ?? ""),
    order: Number(fd.get("order") ?? 0),
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
  const { AchievementSchema } = await import("@/server/validation/experience");
  const parsed = AchievementSchema.safeParse(input);
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid achievement.", zodToFieldErrors(parsed.error));
  const ach = await db.achievement.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } }); // scopeToUser: role.userId: CURRENT_USER_ID
  if (!ach) return err("NOT_FOUND", "Achievement not found.");
  const { tagSlugs, ...data } = parsed.data;
  await db.$transaction([
    db.achievement.update({ where: { id }, data }), // scopeToUser: ownership verified above
    db.achievementTag.deleteMany({ where: { achievementId: id } }), // scopeToUser: achievementId belongs to verified achievement
  ]);
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } }); // scopeToUser: no user scope needed on Tag
  if (tags.length) await db.achievementTag.createMany({ data: tags.map((t) => ({ achievementId: id, tagId: t.id })) }); // scopeToUser: achievementId belongs to verified achievement
  revalidatePath(`/experience/${ach.role.slug}`);
  return ok(null);
}

export async function deleteAchievement(id: number): Promise<ActionResult<null>> {
  const ach = await db.achievement.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } }); // scopeToUser: role.userId: CURRENT_USER_ID
  if (!ach) return err("NOT_FOUND", "Achievement not found.");
  await db.achievement.delete({ where: { id } }); // scopeToUser: ownership verified above
  revalidatePath(`/experience/${ach.role.slug}`);
  return ok(null);
}

export async function createHighlight(roleId: number, fd: FormData): Promise<ActionResult<{ id: number }>> {
  const { HighlightSchema } = await import("@/server/validation/experience");
  const parsed = HighlightSchema.safeParse({ text: String(fd.get("text") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid highlight.", zodToFieldErrors(parsed.error));
  const role = await db.experienceRole.findFirst({ where: { id: roleId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!role) return err("NOT_FOUND", "Role not found.");
  const h = await db.highlight.create({ data: { ...parsed.data, roleId } }); // scopeToUser: roleId belongs to verified role above
  revalidatePath(`/experience/${role.slug}`);
  return ok({ id: h.id });
}

export async function updateHighlight(id: number, fd: FormData): Promise<ActionResult<null>> {
  const { HighlightSchema } = await import("@/server/validation/experience");
  const parsed = HighlightSchema.safeParse({ text: String(fd.get("text") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid highlight.", zodToFieldErrors(parsed.error));
  const h = await db.highlight.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } }); // scopeToUser: role.userId: CURRENT_USER_ID
  if (!h) return err("NOT_FOUND", "Highlight not found.");
  await db.highlight.update({ where: { id }, data: parsed.data }); // scopeToUser: ownership verified above
  revalidatePath(`/experience/${h.role.slug}`);
  return ok(null);
}

export async function deleteHighlight(id: number): Promise<ActionResult<null>> {
  const h = await db.highlight.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } }); // scopeToUser: role.userId: CURRENT_USER_ID
  if (!h) return err("NOT_FOUND", "Highlight not found.");
  await db.highlight.delete({ where: { id } }); // scopeToUser: ownership verified above
  revalidatePath(`/experience/${h.role.slug}`);
  return ok(null);
}
