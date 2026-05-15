import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToFieldErrors, slugify } from "@/server/actions/helpers";

describe("zodToFieldErrors", () => {
  it("flattens a ZodError into {field: message}", () => {
    const schema = z.object({ name: z.string().min(1), age: z.number().min(0) });
    const result = schema.safeParse({ name: "", age: -1 });
    if (result.success) throw new Error("expected failure");
    const errs = zodToFieldErrors(result.error);
    expect(errs.name).toBeDefined();
    expect(errs.age).toBeDefined();
  });
});

describe("slugify", () => {
  it("converts company + title to a kebab slug", () => {
    expect(slugify("Acme GmbH", "Staff Engineer, Platform")).toBe("acme-staff-engineer-platform");
  });
  it("strips diacritics and non-ascii", () => {
    expect(slugify("Café", "Über Engineer")).toBe("cafe-uber-engineer");
  });
});
