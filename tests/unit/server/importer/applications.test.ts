import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseJobDescription, parseTailoringStrategy, parseCompanyNotes } from "@/server/importer/parsers/applications";

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

  it("parses H1 sections + bold-label JD summary + bullet-style gaps", () => {
    const src = `---
company: ExampleCo
role: Sample Role
language: en
---

# JD Summary

**Must-haves**:
- "First must-have item"
- "Second must-have item"

**Nice-to-haves**:
- "First nice-to-have"

**Signals**:
- First signal observation
- Second signal observation

**Ambiguities**:
- First ambiguity

# Tailoring Strategy

## Headline & summary

- **Headline (proposed)**: Sample Headline Text
- **Summary**: Sample summary description.

## Skills to lead with

- **Languages**: Lang1, Lang2
- **Infrastructure**: Infra1, Infra2

**Deprioritise / drop**: Skill1, Skill2

## Cover letter angle

- **Hook**: Sample hook sentence.
- **Body 1**: Sample body one sentence.
- **Body 2**: Sample body two sentence.
- **Close**: Sample closing sentence.

# Gaps flagged

- **Sample requirement one**: short context.
  → Option A: option A description.
  → Option B: option B description.
  → **Default: A** — reasoning.

- **Sample requirement two**: short context.
  → Option A: option A description.
  → Option B: option B description.
  → **Default: B** — reasoning.
`;
    const r = parseTailoringStrategy(src);
    expect(r.jdSummary.mustHaves.length).toBe(2);
    expect(r.jdSummary.mustHaves[0]).toContain("First must-have");
    expect(r.jdSummary.niceToHaves.length).toBe(1);
    expect(r.jdSummary.signals.length).toBe(2);
    expect(r.jdSummary.ambiguities.length).toBe(1);
    expect(r.strategy.headlineSummary).toContain("Sample Headline");
    expect(r.strategy.skillsLead.length).toBeGreaterThan(0);
    expect(r.strategy.skillsDeprioritize.length).toBeGreaterThan(0);
    expect(r.strategy.coverLetterAngle.hook).toBe("Sample hook sentence.");
    expect(r.strategy.coverLetterAngle.body1).toBe("Sample body one sentence.");
    expect(r.strategy.coverLetterAngle.body2).toBe("Sample body two sentence.");
    expect(r.strategy.coverLetterAngle.close).toBe("Sample closing sentence.");
    expect(r.gaps.length).toBe(2);
    expect(r.gaps[0]?.requirement).toBe("Sample requirement one");
    expect(r.gaps[0]?.optionA).toContain("option A");
    expect(r.gaps[0]?.optionB).toContain("option B");
    expect(r.gaps[0]?.recommendation).toBe("A");
    expect(r.gaps[1]?.recommendation).toBe("B");
  });
});

describe("parseCompanyNotes", () => {
  it("parses H1 sections + YAML calibration block", () => {
    const src = `---
company: ExampleCo
researched_at: 2026-01-01
last_updated: 2026-01-01
---

# Company

## Overview
Sample overview text with **bold** and bullet:
- bullet one

## Products
Sample products text.

## Recent signals
- Recent signal one
- Recent signal two

## Leadership
Sample leadership notes.

## Reputation
Sample reputation notes.

# Role

## Beyond the JD
Sample beyond-JD content.

## Why this role
Sample why-this-role content.

# Process

## Stages
1. Stage one.
2. Stage two.

## People to meet
unknown.

## Logistics
Sample logistics.

# Calibration

\`\`\`yaml
style: mixed
difficulty: staff-level-deep-dive
tone: casual
\`\`\`

## Justification
Sample justification text.

## Risk areas
- Risk one
- Risk two
`;
    const r = parseCompanyNotes(src);
    expect(r.company.overview).toContain("Sample overview");
    expect(r.company.products).toContain("Sample products");
    expect(r.company.recentSignals).toContain("Recent signal one");
    expect(r.company.leadership).toContain("Sample leadership");
    expect(r.company.reputation).toContain("Sample reputation");
    expect(r.role.beyondJd).toContain("Sample beyond-JD");
    expect(r.role.whyRole).toContain("Sample why-this-role");
    expect(r.process.logistics).toContain("Sample logistics");
    expect(r.calibration.style).toBe("mixed");
    expect(r.calibration.difficulty).toBe("staff-level-deep-dive");
    expect(r.calibration.tone).toBe("casual");
    expect(r.calibration.justification).toContain("Sample justification");
    expect(r.riskAreas).toContain("Risk one");
  });
});
