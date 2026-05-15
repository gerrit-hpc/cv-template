import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/data/db";
import { execSync } from "node:child_process";

describe("seed", () => {
  beforeAll(() => {
    execSync("npx prisma migrate reset --force", {
      stdio: "inherit",
      env: {
        ...process.env,
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION:
          "yes, reset the temp test database kb-pg-tmp running on localhost:5432",
      },
    });
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  }, 60_000);

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates user 1", async () => {
    const user = await db.user.findUnique({ where: { id: 1 } });
    expect(user).not.toBeNull();
  });

  it("creates 7 default tags", async () => {
    const tags = await db.tag.findMany();
    expect(tags.length).toBe(7);
    expect(tags.map((t) => t.slug).sort()).toEqual([
      "culture",
      "delivery",
      "growth",
      "innovation",
      "leadership",
      "strategy",
      "technical",
    ]);
  });

  it("creates 5 default skill categories for user 1", async () => {
    const cats = await db.skillCategory.findMany({ where: { userId: 1 } });
    expect(cats.length).toBe(5);
  });

  it("is idempotent (re-running does not duplicate)", async () => {
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    const tags = await db.tag.findMany();
    const cats = await db.skillCategory.findMany({ where: { userId: 1 } });
    expect(tags.length).toBe(7);
    expect(cats.length).toBe(5);
  }, 30_000);
});
