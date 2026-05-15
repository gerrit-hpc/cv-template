import { describe, it, expect } from "vitest";

describe("db singleton", () => {
  it("exports a Prisma client instance", async () => {
    const { db } = await import("@/server/data/db");
    expect(db).toBeDefined();
    expect(typeof db.user.findFirst).toBe("function");
  });
});
