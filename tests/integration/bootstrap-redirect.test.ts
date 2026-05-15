import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { db } from "@/server/data/db";

describe("/ redirect logic", () => {
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

  it("decideHomeRedirect returns /profile when no Profile exists", async () => {
    const { decideHomeRedirect } = await import("@/server/data/bootstrap");
    expect(await decideHomeRedirect()).toBe("/profile");
  });

  it("decideHomeRedirect returns /applications when Profile exists", async () => {
    await db.profile.create({
      data: {
        userId: 1,
        fullName: "Test",
        headline: "h",
        email: "t@t",
        professionalSummary: "s",
      },
    });
    const { decideHomeRedirect } = await import("@/server/data/bootstrap");
    expect(await decideHomeRedirect()).toBe("/applications");
  });
});
