import { describe, it, expect } from "vitest";
import { sessionOptions } from "@/server/auth/session";

describe("sessionOptions", () => {
  it("has the expected cookie config", () => {
    expect(sessionOptions.cookieName).toBe("kb-session");
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
    expect(sessionOptions.cookieOptions?.sameSite).toBe("lax");
  });
});
