import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";
import { runImport } from "@/server/importer/run";

describe("runImport", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.application.deleteMany();
    await db.experienceRole.deleteMany();
    await db.skill.deleteMany();
    await db.skillCategory.deleteMany();
    await db.softSkill.deleteMany();
    await db.educationEntry.deleteMany();
    await db.valuePrinciple.deleteMany();
    await db.valueIndustryOpinion.deleteMany();
    await db.valueLinkedInTheme.deleteMany();
    await db.valueCareerNarrative.deleteMany();
    await db.profile.deleteMany();
    // re-seed categories that the importer expects exist or creates
    const seedMod = await import("@/prisma/seed");
    const seed = (seedMod as any).default;
    if (typeof seed === "function") await seed();
  });

  it("imports the fixture cv-template end-to-end", async () => {
    const r = await runImport("test-fixtures/cv-template-minimal");
    expect(r.result).toBe("success");
    const profile = await db.profile.findUnique({ where: { userId: 1 } });
    expect(profile?.fullName).toBe("Jane Doe");
    const roles = await db.experienceRole.findMany();
    expect(roles.length).toBe(1);
    const apps = await db.application.findMany();
    expect(apps.length).toBe(1);
  });

  it("is idempotent (re-running does not duplicate)", async () => {
    await runImport("test-fixtures/cv-template-minimal");
    await runImport("test-fixtures/cv-template-minimal");
    expect(await db.experienceRole.count()).toBe(1);
    expect(await db.application.count()).toBe(1);
  });
});
