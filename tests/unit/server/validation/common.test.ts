import { describe, it, expect } from "vitest";
import { Slug, YearMonth, TagSlug } from "@/server/validation/common";

describe("validation/common", () => {
  it("Slug accepts lowercase kebab", () => {
    expect(Slug.parse("acme-staff-engineer")).toBe("acme-staff-engineer");
  });
  it("Slug rejects uppercase, spaces, leading hyphen", () => {
    expect(() => Slug.parse("Acme")).toThrow();
    expect(() => Slug.parse("a b")).toThrow();
    expect(() => Slug.parse("-x")).toThrow();
  });
  it("YearMonth accepts YYYY-MM and 'present'", () => {
    expect(YearMonth.parse("2021-03")).toBe("2021-03");
    expect(YearMonth.parse("present")).toBe("present");
  });
  it("YearMonth rejects invalid format", () => {
    expect(() => YearMonth.parse("2021")).toThrow();
    expect(() => YearMonth.parse("2021/03")).toThrow();
  });
  it("TagSlug accepts lowercase kebab", () => {
    expect(TagSlug.parse("leadership")).toBe("leadership");
    expect(() => TagSlug.parse("Lead-Ership")).toThrow();
  });
});
