import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("skill actions", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());

  let categoryId: number;
  beforeEach(async () => {
    await db.skillApplication.deleteMany();
    await db.skill.deleteMany();
    await db.softSkill.deleteMany();
    await db.experienceRole.deleteMany();
    const c = await db.skillCategory.findFirstOrThrow({ where: { name: "Languages", userId: 1 } });
    categoryId = c.id;
  });

  it("creates a skill under a category", async () => {
    const { createSkill } = await import("@/server/actions/skill");
    const fd = new FormData();
    fd.set("name", "TypeScript"); fd.set("proficiency", "expert"); fd.set("order", "0");
    const r = await createSkill(categoryId, fd);
    expect(r.ok).toBe(true);
    expect(await db.skill.count()).toBe(1);
  });

  it("rejects duplicate skill name within a category", async () => {
    const { createSkill } = await import("@/server/actions/skill");
    const make = () => {
      const fd = new FormData();
      fd.set("name", "TypeScript"); fd.set("proficiency", "expert"); fd.set("order", "0");
      return fd;
    };
    await createSkill(categoryId, make());
    const r = await createSkill(categoryId, make());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNIQUE_CONFLICT");
  });

  it("setSkillApplications links a skill to roles", async () => {
    const { createSkill } = await import("@/server/actions/skill");
    const { createRole } = await import("@/server/actions/experience");
    const { setSkillApplications } = await import("@/server/actions/skill-application");
    const fd = new FormData();
    fd.set("name", "Rust"); fd.set("proficiency", "familiar"); fd.set("order", "0");
    const s = await createSkill(categoryId, fd);
    expect(s.ok).toBe(true);
    const rfd = new FormData();
    rfd.set("slug", "acme"); rfd.set("company", "Acme"); rfd.set("title", "E"); rfd.set("startDate", "2020-01");
    rfd.set("employmentType", "full_time"); rfd.set("overview", "x");
    const r = await createRole(rfd);
    expect(r.ok).toBe(true);
    if (!s.ok || !r.ok) return;
    const link = await setSkillApplications(s.data.id, [r.data.id]);
    expect(link.ok).toBe(true);
    expect(await db.skillApplication.count()).toBe(1);
  });
});
