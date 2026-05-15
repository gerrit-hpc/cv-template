import { describe, it, expect } from "vitest";
import { ExperienceRoleSchema, AchievementSchema, HighlightSchema } from "@/server/validation/experience";

describe("ExperienceRoleSchema", () => {
  it("rejects missing required fields", () => {
    const r = ExperienceRoleSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    const fe = r.error.flatten().fieldErrors;
    expect(fe.slug).toBeDefined();
    expect(fe.company).toBeDefined();
    expect(fe.title).toBeDefined();
    expect(fe.startDate).toBeDefined();
    expect(fe.employmentType).toBeDefined();
    expect(fe.overview).toBeDefined();
  });
  it("accepts valid input with present endDate as null", () => {
    expect(
      ExperienceRoleSchema.parse({
        slug: "acme-engineer",
        company: "Acme",
        title: "Engineer",
        startDate: "2020-01",
        endDate: null,
        employmentType: "full_time",
        overview: "did things",
      }),
    ).toMatchObject({ endDate: null });
  });
  it("requires startDate in YYYY-MM", () => {
    expect(() =>
      ExperienceRoleSchema.parse({
        slug: "x",
        company: "X",
        title: "X",
        startDate: "2020/01",
        employmentType: "full_time",
        overview: "x",
      }),
    ).toThrow();
  });
});

describe("AchievementSchema", () => {
  it("requires title + result + context + action", () => {
    const r = AchievementSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    const fe = r.error.flatten().fieldErrors;
    expect(Object.keys(fe).sort()).toEqual(["action", "context", "order", "result", "title"]);
  });
});

describe("HighlightSchema", () => {
  it("requires text", () => {
    expect(() => HighlightSchema.parse({ text: "", order: 0 })).toThrow();
  });
});
