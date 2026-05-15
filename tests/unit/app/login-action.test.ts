import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("iron-session", () => {
  return {
    getIronSession: vi.fn(async () => ({ save: vi.fn(), authenticated: false })),
  };
});
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("signIn action", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns error when ADMIN_PASSWORD_HASH not set", async () => {
    process.env.ADMIN_PASSWORD_HASH = "";
    process.env.SESSION_SECRET = "a".repeat(32);
    const { signIn } = await import("@/app/login/actions");
    const fd = new FormData();
    fd.set("password", "x");
    const result = await signIn(fd);
    expect(result.ok).toBe(false);
    expect((result as any).error.code).toBe("INTERNAL");
  });

  it("returns error on wrong password", async () => {
    const hash = await bcrypt.hash("correct", 4);
    process.env.ADMIN_PASSWORD_HASH = hash;
    process.env.SESSION_SECRET = "a".repeat(32);
    const { signIn } = await import("@/app/login/actions");
    const fd = new FormData();
    fd.set("password", "wrong");
    const result = await signIn(fd);
    expect(result.ok).toBe(false);
    expect((result as any).error.fieldErrors?.password).toBeDefined();
  });

  it("calls redirect on correct password", async () => {
    const { redirect } = await import("next/navigation");
    const hash = await bcrypt.hash("correct", 4);
    process.env.ADMIN_PASSWORD_HASH = hash;
    process.env.SESSION_SECRET = "a".repeat(32);
    const { signIn } = await import("@/app/login/actions");
    const fd = new FormData();
    fd.set("password", "correct");
    await signIn(fd);
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
