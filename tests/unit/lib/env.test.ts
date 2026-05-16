import { describe, it, expect } from "vitest";
import { parseEnv } from "@/lib/env";

const BASE = {
  DATABASE_URL: "postgres://localhost:5432/kb",
  LLM_PROVIDER: "anthropic" as const,
  ANTHROPIC_API_KEY: "sk-test",
};

describe("parseEnv", () => {
  it("requires DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("accepts a valid env", () => {
    const env = parseEnv({ ...BASE, KB_SOURCE_REPO_PATH: "/tmp/cv" });
    expect(env.DATABASE_URL).toBe("postgres://localhost:5432/kb");
    expect(env.KB_SOURCE_REPO_PATH).toBe("/tmp/cv");
    expect(env.ADMIN_PASSWORD_HASH).toBeUndefined();
  });

  it("returns ADMIN_PASSWORD_HASH when set", () => {
    const env = parseEnv({
      ...BASE,
      ADMIN_PASSWORD_HASH: "$2b$12$abc",
      SESSION_SECRET: "x".repeat(32),
    });
    expect(env.ADMIN_PASSWORD_HASH).toBe("$2b$12$abc");
  });

  it("requires SESSION_SECRET to be at least 32 chars when ADMIN_PASSWORD_HASH is set", () => {
    expect(() =>
      parseEnv({ ...BASE, ADMIN_PASSWORD_HASH: "$2b$12$abc", SESSION_SECRET: "short" }),
    ).toThrow(/SESSION_SECRET/);
  });

  it("requires LLM_PROVIDER", () => {
    expect(() => parseEnv({ DATABASE_URL: "postgres://localhost:5432/kb" })).toThrow(
      /LLM_PROVIDER/,
    );
  });

  it("rejects unknown LLM_PROVIDER", () => {
    expect(() => parseEnv({ ...BASE, LLM_PROVIDER: "unknown" })).toThrow();
  });

  it("requires ANTHROPIC_API_KEY when LLM_PROVIDER=anthropic", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "postgres://localhost:5432/kb", LLM_PROVIDER: "anthropic" }),
    ).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("requires PI_API_KEY when LLM_PROVIDER=pi", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "postgres://localhost:5432/kb", LLM_PROVIDER: "pi" }),
    ).toThrow(/PI_API_KEY/);
  });

  it("accepts pi provider with PI_API_KEY", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://localhost:5432/kb",
      LLM_PROVIDER: "pi",
      PI_API_KEY: "pi-key-123",
    });
    expect(env.LLM_PROVIDER).toBe("pi");
    expect(env.PI_API_KEY).toBe("pi-key-123");
  });
});
