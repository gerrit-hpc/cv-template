import { describe, it, expect } from "vitest";
import { ok, err, type ActionResult } from "@/server/actions/result";

describe("ActionResult helpers", () => {
  it("ok wraps a value", () => {
    const result: ActionResult<number> = ok(42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("err builds an error", () => {
    const result = err("VALIDATION_FAILED", "bad input", { name: "required" });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "bad input",
        fieldErrors: { name: "required" },
      },
    });
  });

  it("err omits fieldErrors when not provided", () => {
    const result = err("NOT_FOUND", "no such row");
    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "no such row" },
    });
  });
});
