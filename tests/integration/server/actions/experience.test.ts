import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("experience actions", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.achievement.deleteMany();
    await db.highlight.deleteMany();
    await db.experienceRole.deleteMany();
  });

  it("createRole creates a row with tags", async () => {
    const { createRole } = await import("@/server/actions/experience");
    const fd = new FormData();
    fd.set("slug", "acme-engineer");
    fd.set("company", "Acme");
    fd.set("title", "Engineer");
    fd.set("startDate", "2020-01");
    fd.set("employmentType", "full_time");
    fd.set("overview", "did stuff");
    fd.set("tagSlugs", "leadership,technical");
    const r = await createRole(fd);
    expect(r.ok).toBe(true);
    const role = await db.experienceRole.findFirst({ include: { tags: { include: { tag: true } } } });
    expect(role?.slug).toBe("acme-engineer");
    expect(role?.tags.map((t) => t.tag.slug).sort()).toEqual(["leadership", "technical"]);
  });

  it("createRole returns UNIQUE_CONFLICT on duplicate slug", async () => {
    const { createRole } = await import("@/server/actions/experience");
    const make = () => {
      const fd = new FormData();
      fd.set("slug", "dupe");
      fd.set("company", "X"); fd.set("title", "X"); fd.set("startDate", "2020-01");
      fd.set("employmentType", "full_time"); fd.set("overview", "x");
      return fd;
    };
    await createRole(make());
    const r = await createRole(make());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNIQUE_CONFLICT");
  });

  it("updateRole replaces tags", async () => {
    const { createRole, updateRole } = await import("@/server/actions/experience");
    const fd = new FormData();
    fd.set("slug", "x"); fd.set("company", "X"); fd.set("title", "X"); fd.set("startDate", "2020-01");
    fd.set("employmentType", "full_time"); fd.set("overview", "x"); fd.set("tagSlugs", "leadership");
    await createRole(fd);
    const role = await db.experienceRole.findFirstOrThrow();
    const fd2 = new FormData();
    fd2.set("slug", "x"); fd2.set("company", "X"); fd2.set("title", "X"); fd2.set("startDate", "2020-01");
    fd2.set("employmentType", "full_time"); fd2.set("overview", "x"); fd2.set("tagSlugs", "technical,delivery");
    await updateRole(role.id, fd2);
    const updated = await db.experienceRole.findUnique({ where: { id: role.id }, include: { tags: { include: { tag: true } } } });
    expect(updated?.tags.map((t) => t.tag.slug).sort()).toEqual(["delivery", "technical"]);
  });

  it("deleteRole cascades to achievements", async () => {
    const { createRole, createAchievement, deleteRole } = await import("@/server/actions/experience");
    const fd = new FormData();
    fd.set("slug", "x"); fd.set("company", "X"); fd.set("title", "X"); fd.set("startDate", "2020-01");
    fd.set("employmentType", "full_time"); fd.set("overview", "x");
    await createRole(fd);
    const role = await db.experienceRole.findFirstOrThrow();
    const ach = new FormData();
    ach.set("title", "a"); ach.set("result", "r"); ach.set("context", "c"); ach.set("action", "ac"); ach.set("order", "0");
    await createAchievement(role.id, ach);
    expect(await db.achievement.count()).toBe(1);
    await deleteRole(role.id);
    expect(await db.achievement.count()).toBe(0);
    expect(await db.experienceRole.count()).toBe(0);
  });
});
