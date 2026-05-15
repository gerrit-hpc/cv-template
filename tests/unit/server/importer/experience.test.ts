import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseExperience } from "@/server/importer/parsers/experience";

describe("parseExperience", () => {
  it("parses fixture acme-engineer.md", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/experience/acme-engineer.md", "utf8");
    const r = parseExperience(src, "acme-engineer");
    expect(r.role.company).toBe("Acme");
    expect(r.role.startDate).toBe("2020-01");
    expect(r.role.endDate).toBeNull();
    expect(r.role.employmentType).toBe("full_time");
    expect(r.role.tagSlugs.sort()).toEqual(["leadership", "technical"]);
    expect(r.role.scopeTeamSize).toBe("8");
    expect(r.role.scopeReportingTo).toBe("VP Eng");
    expect(r.role.isHighlightsOnly).toBe(false);
    expect(r.achievements.length).toBe(2);
    expect(r.achievements[0]?.title).toBe("Rebuilt onboarding pipeline");
    expect(r.achievements[0]?.tagSlugs.sort()).toEqual(["delivery", "technical"]);
    expect(r.highlights.length).toBe(0);
  });
});
