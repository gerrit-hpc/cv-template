import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("profile actions", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.keyQualification.deleteMany();
    await db.language.deleteMany();
    await db.profile.deleteMany();
  });

  it("upsertProfile creates a profile if none exists", async () => {
    const { upsertProfile } = await import("@/server/actions/profile");
    const fd = new FormData();
    fd.set("fullName", "Jane Doe");
    fd.set("headline", "Engineer");
    fd.set("email", "j@d.com");
    fd.set("professionalSummary", "summary");
    const r = await upsertProfile(fd);
    expect(r.ok).toBe(true);
    const p = await db.profile.findUnique({ where: { userId: 1 } });
    expect(p?.fullName).toBe("Jane Doe");
  });

  it("upsertProfile returns fieldErrors on invalid input", async () => {
    const { upsertProfile } = await import("@/server/actions/profile");
    const fd = new FormData();
    fd.set("fullName", "");
    fd.set("headline", "");
    fd.set("email", "bad");
    fd.set("professionalSummary", "");
    const r = await upsertProfile(fd);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.fieldErrors?.fullName).toBeDefined();
    expect(r.error.fieldErrors?.email).toBeDefined();
  });

  it("setKeyQualifications replaces the full list", async () => {
    const { upsertProfile, setKeyQualifications } = await import("@/server/actions/profile");
    const fd = new FormData();
    fd.set("fullName", "x"); fd.set("headline", "y"); fd.set("email", "a@b.c"); fd.set("professionalSummary", "s");
    await upsertProfile(fd);
    const r = await setKeyQualifications([
      { text: "one", order: 0 },
      { text: "two", order: 1 },
    ]);
    expect(r.ok).toBe(true);
    const list = await db.keyQualification.findMany({ orderBy: { order: "asc" } });
    expect(list.length).toBe(2);
    expect(list[0]!.text).toBe("one");
  });
});
