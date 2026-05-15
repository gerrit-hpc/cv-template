import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseJobDescription, parseTailoringStrategy } from "@/server/importer/parsers/applications";

describe("parseJobDescription", () => {
  it("extracts source + content from fixture", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/applications/acme-engineer/job-description.md", "utf8");
    const r = parseJobDescription(src);
    expect(r.sourceType).toBe("url");
    expect(r.sourceValue).toBe("https://acme.example/jobs/staff-eng");
    expect(r.capturedAt).toBe("2026-03-12");
    expect(r.content).toContain("Staff Engineer");
  });
});

describe("parseTailoringStrategy", () => {
  it("extracts must-haves and gaps", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/applications/acme-engineer/tailoring-strategy.md", "utf8");
    const r = parseTailoringStrategy(src);
    expect(r.jdSummary.mustHaves).toContain('"Kubernetes"');
    expect(r.gaps.length).toBe(1);
    expect(r.gaps[0]?.recommendation).toBe("A");
  });
});
