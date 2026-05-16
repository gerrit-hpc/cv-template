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

  it("parses H3-block format with labeled bullets", () => {
    const src = `# Education

## Degrees

### Sample Degree Name (M.Sc. equivalent)

- **Institution**: Example University
- **Field**: Sample Field of Study
- **Start**: 2010-09
- **End**: 2014-06
- **Notes**: Sample notes about the degree

## Certifications

None — placeholder text for empty section.

## Courses & Training

No formal courses — placeholder text.
`;
    const r = parseEducation(src);
    expect(r.length).toBe(1);
    const d = r[0]!;
    expect(d.kind).toBe("degree");
    expect(d.name).toBe("Sample Degree Name (M.Sc. equivalent)");
    expect(d.institution).toBe("Example University");
    expect(d.field).toBe("Sample Field of Study");
    expect(d.startDate).toBe("2010-09");
    expect(d.endDate).toBe("2014-06");
    expect(d.notes).toContain("Sample notes");
  });
});
