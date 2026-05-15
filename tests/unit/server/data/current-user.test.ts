import { describe, it, expect } from "vitest";
import { CURRENT_USER_ID, scopeToUser } from "@/server/data/current-user";

describe("current-user", () => {
  it("CURRENT_USER_ID is 1", () => {
    expect(CURRENT_USER_ID).toBe(1);
  });

  it("scopeToUser adds userId to a where clause", () => {
    expect(scopeToUser({})).toEqual({ userId: 1 });
    expect(scopeToUser({ slug: "x" })).toEqual({ slug: "x", userId: 1 });
  });

  it("scopeToUser preserves an existing userId only if it equals CURRENT_USER_ID", () => {
    expect(scopeToUser({ userId: 1 })).toEqual({ userId: 1 });
    expect(() => scopeToUser({ userId: 99 })).toThrow(/userId mismatch/);
  });
});
