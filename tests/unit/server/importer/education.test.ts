import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseEducation } from "@/server/importer/parsers/education";

describe("parseEducation", () => {
  it("parses degrees, certifications, courses", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/education.md", "utf8");
    const r = parseEducation(src);
    const degree = r.find((e) => e.kind === "degree" && e.name.startsWith("MSc"));
    expect(degree?.institution).toBe("TU Berlin");
    expect(degree?.startDate).toBe("2010-01");
    expect(degree?.endDate).toBe("2012-12");
    expect(degree?.notes).toContain("Distributed systems");
    const cert = r.find((e) => e.kind === "certification");
    expect(cert?.name).toBe("AWS Solutions Architect");
    const course = r.find((e) => e.kind === "course");
    expect(course?.name).toContain("Designing Data-Intensive");
  });
});
