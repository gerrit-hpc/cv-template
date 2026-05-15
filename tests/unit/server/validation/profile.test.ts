import { describe, it, expect } from "vitest";
import { ProfileSchema, KeyQualificationSchema, LanguageSchema } from "@/server/validation/profile";

describe("ProfileSchema", () => {
  it("requires fullName, headline, email, professionalSummary", () => {
    const r = ProfileSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    expect(r.error.flatten().fieldErrors).toMatchObject({
      fullName: expect.any(Array),
      headline: expect.any(Array),
      email: expect.any(Array),
      professionalSummary: expect.any(Array),
    });
  });
  it("accepts valid input with optional fields omitted", () => {
    expect(
      ProfileSchema.parse({
        fullName: "Jane Doe",
        headline: "Engineer",
        email: "j@d.com",
        professionalSummary: "summary",
      }),
    ).toMatchObject({ fullName: "Jane Doe" });
  });
  it("rejects invalid email", () => {
    expect(() =>
      ProfileSchema.parse({ fullName: "x", headline: "y", email: "nope", professionalSummary: "s" }),
    ).toThrow();
  });
});

describe("KeyQualificationSchema", () => {
  it("requires text", () => {
    expect(() => KeyQualificationSchema.parse({ text: "", order: 0 })).toThrow();
    expect(KeyQualificationSchema.parse({ text: "ok", order: 0 }).text).toBe("ok");
  });
});

describe("LanguageSchema", () => {
  it("requires name + proficiency", () => {
    expect(() => LanguageSchema.parse({ name: "", proficiency: "", order: 0 })).toThrow();
  });
});
