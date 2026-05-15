import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseProfile } from "@/server/importer/parsers/profile";

describe("parseProfile", () => {
  it("parses fixture profile.md", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/profile.md", "utf8");
    const r = parseProfile(src);
    expect(r.profile.fullName).toBe("Jane Doe");
    expect(r.profile.email).toBe("jane@example.com");
    expect(r.profile.professionalSummary).toContain("10 years");
    expect(r.keyQualifications.length).toBe(3);
    expect(r.keyQualifications[0]).toEqual({ text: "Led a team of 8 engineers at Acme", order: 0 });
    expect(r.languages.length).toBe(2);
    expect(r.languages[0]).toMatchObject({ name: "English", proficiency: "native" });
  });
});
