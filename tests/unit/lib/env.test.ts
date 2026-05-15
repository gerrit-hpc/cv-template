import { describe, it, expect } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("requires DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("accepts a valid env", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://localhost:5432/kb",
      KB_SOURCE_REPO_PATH: "/tmp/cv",
    });
    expect(env.DATABASE_URL).toBe("postgres://localhost:5432/kb");
    expect(env.KB_SOURCE_REPO_PATH).toBe("/tmp/cv");
    expect(env.ADMIN_PASSWORD_HASH).toBeUndefined();
  });

  it("returns ADMIN_PASSWORD_HASH when set", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://localhost:5432/kb",
      ADMIN_PASSWORD_HASH: "$2b$12$abc",
    });
    expect(env.ADMIN_PASSWORD_HASH).toBe("$2b$12$abc");
  });

  it("requires SESSION_SECRET to be at least 32 chars when ADMIN_PASSWORD_HASH is set", () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgres://localhost:5432/kb",
        ADMIN_PASSWORD_HASH: "$2b$12$abc",
        SESSION_SECRET: "short",
      }),
    ).toThrow(/SESSION_SECRET/);
  });
});
