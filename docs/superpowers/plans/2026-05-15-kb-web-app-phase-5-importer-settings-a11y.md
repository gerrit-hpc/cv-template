# KB Web App — Phase 5: Importer, Settings, Accessibility, E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Markdown parsers for the six KB file types (profile, education, experience, skills, values, applications); importer driver with idempotent update-by-natural-key; CLI entry + Settings UI button with SSE streaming; Settings page (tag vocab, auth status, importer, danger zone); Playwright E2E happy paths; axe-core accessibility smoke pass.

**Architecture:** Parsers are pure `(string) => ParsedShape` functions per file type. The driver orchestrates: walk inventory → parse with per-file try/catch → resolve role slugs for SkillApplication links → write in dependency order. CLI and Settings UI both call the same `runImport()` driver. Settings UI streams progress events to the browser via SSE.

**Tech Stack:** `gray-matter` (frontmatter), `marked` for `Heading` token detection (or hand-rolled section splitting — see Task 2), `@playwright/test`, `@axe-core/playwright`.

**Spec reference:** §3 (importer), §10 (accessibility), §11 (acceptance criteria), `design/ui-design-spec.md` §Settings.

---

## File structure (delivered by end of Phase 5)

```
server/importer/
  run.ts                      # driver
  md-utils.ts                 # frontmatter + section splitting
  parsers/
    profile.ts
    education.ts
    experience.ts
    skills.ts
    values.ts
    applications.ts

scripts/
  import.ts                   # CLI entry

app/(shell)/settings/
  page.tsx
  tags-section.tsx
  importer-section.tsx
  auth-section.tsx
  danger-zone-section.tsx

app/api/import/stream/route.ts

server/actions/
  tag.ts
  settings.ts                 # wipeAll
  importer.ts                 # kickoff (creates ImportRun row + stream id)

test-fixtures/cv-template-minimal/
  profile.md
  education.md
  skills.md
  values.md
  experience/_template.md
  experience/acme-engineer.md
  applications/acme-engineer/job-description.md
  applications/acme-engineer/tailoring-strategy.md

playwright.config.ts
tests/e2e/
  profile.spec.ts
  experience.spec.ts
  skills.spec.ts
  education.spec.ts
  values.spec.ts
  applications.spec.ts
  importer.spec.ts
  accessibility.spec.ts
```

---

## Task 1: Install parser + E2E deps

- [ ] **Step 1:**

```bash
npm install gray-matter
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "phase 5: install gray-matter + Playwright + axe-core"
```

---

## Task 2: Markdown utilities (frontmatter + section splitter)

**Files:** `server/importer/md-utils.ts` + tests

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

describe("parseFrontmatter", () => {
  it("returns frontmatter + body", () => {
    const r = parseFrontmatter("---\ntitle: x\n---\nbody\n");
    expect(r.data).toEqual({ title: "x" });
    expect(r.content).toBe("body\n");
  });
  it("handles missing frontmatter", () => {
    const r = parseFrontmatter("no frontmatter here");
    expect(r.data).toEqual({});
    expect(r.content).toBe("no frontmatter here");
  });
});

describe("splitSections", () => {
  it("splits a markdown body by ## headings", () => {
    const r = splitSections("intro\n\n## A\n\nbody A\n\n## B\n\nbody B\n");
    expect(r.preamble).toBe("intro\n");
    expect(r.sections.A).toBe("body A\n");
    expect(r.sections.B).toBe("body B\n");
  });
  it("returns empty preamble when first line is a heading", () => {
    const r = splitSections("## A\nbody A\n");
    expect(r.preamble).toBe("");
    expect(r.sections.A).toBe("body A\n");
  });
  it("supports H3 subsections inside a section as part of its body", () => {
    const r = splitSections("## A\n\n### Sub\n\nx\n\n## B\nbody B\n");
    expect(r.sections.A).toContain("### Sub");
    expect(r.sections.B).toBe("body B\n");
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/md-utils.ts`:

```ts
import matter from "gray-matter";

export function parseFrontmatter(source: string): { data: Record<string, unknown>; content: string } {
  const parsed = matter(source);
  return { data: parsed.data as Record<string, unknown>, content: parsed.content };
}

export function splitSections(body: string): { preamble: string; sections: Record<string, string> } {
  const lines = body.split("\n");
  const preambleLines: string[] = [];
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current !== null) {
      sections[current] = buffer.join("\n").replace(/^\n+/, "");
    }
  };

  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      current = m[1]!;
      buffer = [];
    } else if (current === null) {
      preambleLines.push(line);
    } else {
      buffer.push(line);
    }
  }
  flush();
  return { preamble: preambleLines.join("\n").trim() + (preambleLines.length ? "\n" : ""), sections };
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/md-utils.test.ts
git add server/importer/md-utils.ts tests/unit/server/importer/md-utils.test.ts
git commit -m "phase 5: add frontmatter + section markdown utilities"
```

---

## Task 3: Test fixtures

- [ ] **Step 1: Create `test-fixtures/cv-template-minimal/`**

```bash
mkdir -p test-fixtures/cv-template-minimal/experience
mkdir -p test-fixtures/cv-template-minimal/applications/acme-engineer
```

- [ ] **Step 2: Add fixture files**

`test-fixtures/cv-template-minimal/profile.md`:

```markdown
---
fullName: Jane Doe
headline: Senior Engineer
locationCity: Berlin
locationCountry: Germany
email: jane@example.com
linkedinUrl: https://linkedin.com/in/jane
---

# Professional Summary

Engineer with 10 years of experience shipping platforms.

# Key Qualifications

- Led a team of 8 engineers at Acme
- Built event-driven architecture handling 1M req/s
- Reduced infrastructure costs by 40%

# Languages

- English (native)
- German (fluent C1)
```

`test-fixtures/cv-template-minimal/education.md`:

```markdown
## Degrees

- MSc Computer Science, TU Berlin, 2010-2012, "Distributed systems thesis"
- BSc Mathematics, FU Berlin, 2007-2010

## Certifications

- AWS Solutions Architect, AWS, 2018-01

## Courses

- Designing Data-Intensive Applications book club, 2019
```

`test-fixtures/cv-template-minimal/skills.md`:

```markdown
## Languages

| Skill | Proficiency | Applied at | Notes |
|---|---|---|---|
| TypeScript | expert | Acme | daily |
| Rust | familiar | — | side projects |

## Infrastructure & Platforms

| Skill | Proficiency | Applied at | Notes |
|---|---|---|---|
| Kubernetes | proficient | Acme | production |
```

`test-fixtures/cv-template-minimal/values.md`:

```markdown
## Principles

### Ownership over heroism

Teams that win own boring problems together rather than relying on individual saves.

### Trust by default

Trust is cheaper than verification at small scale and necessary at large scale.

## Career narrative

I've spent ten years building infrastructure that other engineers rely on. Through-line: leverage.

## Industry opinions

### Microservices are over-prescribed

Position: most teams should start with a modular monolith.
Why: I've seen four teams hit ops fatigue inside 12 months of going micro.
Counterargument: at scale you need them. Sure, but you'll know when.

## LinkedIn themes

- Platform engineering tradeoffs
- Hiring senior ICs
- Migration patterns
```

`test-fixtures/cv-template-minimal/experience/acme-engineer.md`:

```markdown
---
company: Acme
title: Staff Engineer
start_date: 2020-01
end_date: present
location: Berlin
employment_type: full-time
company_url: https://acme.example
tags: [leadership, technical]
---

# Overview

Acme builds payment infrastructure.

# Scope

- Team size: 8
- Reporting to: VP Eng
- Tech stack: TypeScript, Go, Kubernetes, Postgres

## Achievements

### Rebuilt onboarding pipeline

**Result**: Cut onboarding time from 14 days to 2 hours.

**Context**: Onboarding was a manual checklist run by ops.

**Action**: Designed and led an event-driven pipeline.

**Tags**: `technical` `delivery`

### Grew the platform team

**Result**: Hired 5 senior engineers in 9 months.

**Context**: Headcount approved after Series B.

**Action**: Ran the hiring funnel end-to-end.

**Tags**: `leadership` `growth`
```

`test-fixtures/cv-template-minimal/applications/acme-engineer/job-description.md`:

```markdown
---
source: https://acme.example/jobs/staff-eng
captured_at: 2026-03-12
---

# Acme — Staff Engineer

We're looking for a Staff Engineer to lead our platform team. Must have 8+ years of experience with distributed systems and Kubernetes. Nice to have: payment systems background.
```

`test-fixtures/cv-template-minimal/applications/acme-engineer/tailoring-strategy.md`:

```markdown
---
company: Acme
role: Staff Engineer
language: en
---

## JD Summary

### Must-haves
- "8+ years of experience with distributed systems"
- "Kubernetes"

### Nice-to-haves
- "payment systems background"

### Signals
- Series B stage

### Ambiguities
- "lead our platform team" — IC or manager?

## Strategy

### Headline summary
Lead with platform / event-driven architecture experience.

### Cover letter

**Hook**: Ten years of building platforms others bet on.

**Body 1**: Acme onboarding pipeline.

**Body 2**: Hiring 5 senior engineers.

**Close**: Eager to discuss your platform challenges.

## Gaps flagged

### Payment systems
**Option A**: drop, lean on event-driven architecture.
**Option B**: confirm undocumented experience exists.
**Recommendation**: A
```

- [ ] **Step 3: Commit fixtures**

```bash
git add test-fixtures/
git commit -m "phase 5: add minimal cv-template test fixtures"
```

---

## Task 4: Profile parser

**Files:** `server/importer/parsers/profile.ts` + tests

- [ ] **Step 1: Write the test**

```ts
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
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/parsers/profile.ts`:

```ts
import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

type Profile = {
  fullName: string;
  headline: string;
  locationCity: string | null;
  locationCountry: string | null;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  professionalSummary: string;
};

export type ParsedProfile = {
  profile: Profile;
  keyQualifications: { text: string; order: number }[];
  languages: { name: string; proficiency: string; order: number }[];
};

function parseBulletList(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);
}

function splitH1Sections(body: string): Record<string, string> {
  const lines = body.split("\n");
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => { if (current !== null) sections[current] = buffer.join("\n").replace(/^\n+/, ""); };
  for (const line of lines) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) { flush(); current = m[1]!; buffer = []; }
    else if (current !== null) buffer.push(line);
  }
  flush();
  return sections;
}

export function parseProfile(source: string): ParsedProfile {
  const { data, content } = parseFrontmatter(source);
  const sections = splitH1Sections(content);
  const summary = (sections["Professional Summary"] ?? "").trim();
  const quals = parseBulletList(sections["Key Qualifications"] ?? "");
  const langs = parseBulletList(sections["Languages"] ?? "").map((line, i) => {
    const m = line.match(/^(.+?)\s*\((.+?)\)$/);
    return m ? { name: m[1]!.trim(), proficiency: m[2]!.trim(), order: i } : { name: line, proficiency: "", order: i };
  });

  return {
    profile: {
      fullName: String(data.fullName ?? ""),
      headline: String(data.headline ?? ""),
      locationCity: data.locationCity ? String(data.locationCity) : null,
      locationCountry: data.locationCountry ? String(data.locationCountry) : null,
      email: String(data.email ?? ""),
      phone: data.phone ? String(data.phone) : null,
      linkedinUrl: data.linkedinUrl ? String(data.linkedinUrl) : null,
      githubUrl: data.githubUrl ? String(data.githubUrl) : null,
      websiteUrl: data.websiteUrl ? String(data.websiteUrl) : null,
      professionalSummary: summary,
    },
    keyQualifications: quals.map((text, order) => ({ text, order })),
    languages: langs,
  };
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/profile.test.ts
git add server/importer/parsers/profile.ts tests/unit/server/importer/profile.test.ts
git commit -m "phase 5: add profile.md parser"
```

---

## Task 5: Education parser

**File:** `server/importer/parsers/education.ts`

- [ ] **Step 1: Write the test**

```ts
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
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/parsers/education.ts`:

```ts
import { splitSections } from "@/server/importer/md-utils";

type Entry = {
  kind: "degree" | "certification" | "course";
  institution: string | null;
  name: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  order: number;
};

function parseDateRange(s: string): { startDate: string | null; endDate: string | null } {
  // accept "YYYY-YYYY", "YYYY-MM", "YYYY-MM-YYYY-MM"
  const m = s.match(/(\d{4})(?:-(\d{2}))?(?:\s*[-–—]\s*(\d{4})(?:-(\d{2}))?)?/);
  if (!m) return { startDate: null, endDate: null };
  const startYear = m[1]!;
  const startMonth = m[2] ?? "01";
  const endYear = m[3];
  const endMonth = m[4] ?? "12";
  return {
    startDate: `${startYear}-${startMonth}`,
    endDate: endYear ? `${endYear}-${endMonth}` : null,
  };
}

function parseBulletLine(line: string, kind: Entry["kind"], order: number): Entry | null {
  const cleaned = line.replace(/^\s*-\s+/, "").trim();
  if (!cleaned) return null;
  // Try: "Name, Institution, YYYY-YYYY, "notes""
  const noteMatch = cleaned.match(/^(.+?),\s*"([^"]+)"$/);
  const base = noteMatch ? noteMatch[1]!.trim() : cleaned;
  const notes = noteMatch ? noteMatch[2]! : null;
  const parts = base.split(",").map((p) => p.trim());
  const name = parts[0] ?? "";
  const institution = parts[1] ?? null;
  const dateChunk = parts.slice(2).join(", ");
  const { startDate, endDate } = parseDateRange(dateChunk);
  return { kind, name, institution, field: null, startDate, endDate, notes, order };
}

export function parseEducation(source: string): Entry[] {
  const { sections } = splitSections(source);
  const out: Entry[] = [];
  for (const [heading, body] of Object.entries(sections)) {
    const kind: Entry["kind"] | null =
      heading.toLowerCase().includes("degree") ? "degree" :
      heading.toLowerCase().includes("certification") ? "certification" :
      heading.toLowerCase().includes("course") ? "course" :
      null;
    if (!kind) continue;
    const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
    lines.forEach((line, i) => {
      const e = parseBulletLine(line, kind, i);
      if (e) out.push(e);
    });
  }
  return out;
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/education.test.ts
git add server/importer/parsers/education.ts tests/unit/server/importer/education.test.ts
git commit -m "phase 5: add education.md parser"
```

---

## Task 6: Experience parser

**File:** `server/importer/parsers/experience.ts`

- [ ] **Step 1: Write the test**

```ts
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
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/parsers/experience.ts`:

```ts
import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

type Role = {
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  companyUrl: string | null;
  overview: string;
  scopeTeamSize: string | null;
  scopeReportingTo: string | null;
  scopeTechStack: string | null;
  scopeBudget: string | null;
  isHighlightsOnly: boolean;
  tagSlugs: string[];
};

type Achievement = {
  title: string;
  result: string;
  context: string;
  action: string;
  order: number;
  tagSlugs: string[];
};

type Highlight = { text: string; order: number };

function normalizeEmploymentType(s: string): Role["employmentType"] {
  switch (s.toLowerCase().replace(/[\s-]/g, "_")) {
    case "full_time": return "full_time";
    case "part_time": return "part_time";
    case "contract": return "contract";
    case "internship": return "internship";
    default: return "full_time";
  }
}

function parseScopeBullets(body: string): { teamSize: string | null; reportingTo: string | null; techStack: string | null; budget: string | null } {
  const out = { teamSize: null as string | null, reportingTo: null as string | null, techStack: null as string | null, budget: null as string | null };
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*-\s*([^:]+):\s*(.+)$/);
    if (!m) continue;
    const key = m[1]!.trim().toLowerCase();
    const val = m[2]!.trim();
    if (key.startsWith("team size")) out.teamSize = val;
    else if (key.startsWith("reporting to")) out.reportingTo = val;
    else if (key.startsWith("tech stack")) out.techStack = val;
    else if (key.startsWith("budget")) out.budget = val;
  }
  return out;
}

function parseAchievementBlock(block: string, order: number): Achievement | null {
  const lines = block.split("\n");
  const titleLine = lines[0]?.replace(/^###\s+/, "").trim();
  if (!titleLine) return null;
  const find = (label: string) => {
    const re = new RegExp(`^\\*\\*${label}\\*\\*:\\s*(.+)`);
    const idx = lines.findIndex((l) => re.test(l));
    if (idx === -1) return "";
    return lines[idx]!.match(re)![1]!.trim();
  };
  const tagsLine = lines.find((l) => l.startsWith("**Tags**"));
  const tagSlugs = tagsLine ? Array.from(tagsLine.matchAll(/`([a-z0-9-]+)`/g)).map((m) => m[1]!) : [];
  return {
    title: titleLine,
    result: find("Result"),
    context: find("Context"),
    action: find("Action"),
    order,
    tagSlugs,
  };
}

export function parseExperience(source: string, slug: string): {
  role: Role;
  achievements: Achievement[];
  highlights: Highlight[];
} {
  const { data, content } = parseFrontmatter(source);
  const tagsFromFm = Array.isArray(data.tags) ? (data.tags as unknown[]).map(String) : [];
  const { sections } = splitSections(content);

  const overview = (sections["Overview"] ?? sections["overview"] ?? "").trim();
  const scopeBody = sections["Scope"] ?? sections["scope"] ?? "";
  const scope = parseScopeBullets(scopeBody);
  const isHighlightsOnly = Object.keys(sections).some((k) => k.toLowerCase() === "highlights");

  const achievementsBody = sections["Achievements"] ?? "";
  const achievementBlocks = achievementsBody.split(/\n(?=###\s)/).filter((b) => b.trim().startsWith("###"));
  const achievements = achievementBlocks
    .map((b, i) => parseAchievementBlock(b, i))
    .filter((a): a is Achievement => a !== null);

  const highlightsBody = sections["Highlights"] ?? "";
  const highlights = highlightsBody
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l, i) => ({ text: l.replace(/^\s*-\s*/, "").trim(), order: i }))
    .filter((h) => h.text);

  const role: Role = {
    slug,
    company: String(data.company ?? ""),
    title: String(data.title ?? ""),
    startDate: String(data.start_date ?? ""),
    endDate: data.end_date && data.end_date !== "present" ? String(data.end_date) : null,
    location: data.location ? String(data.location) : null,
    employmentType: normalizeEmploymentType(String(data.employment_type ?? "full-time")),
    companyUrl: data.company_url ? String(data.company_url) : null,
    overview,
    scopeTeamSize: scope.teamSize,
    scopeReportingTo: scope.reportingTo,
    scopeTechStack: scope.techStack,
    scopeBudget: scope.budget,
    isHighlightsOnly,
    tagSlugs: tagsFromFm,
  };

  return { role, achievements, highlights };
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/experience.test.ts
git add server/importer/parsers/experience.ts tests/unit/server/importer/experience.test.ts
git commit -m "phase 5: add experience/*.md parser"
```

---

## Task 7: Skills parser

**File:** `server/importer/parsers/skills.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseSkills } from "@/server/importer/parsers/skills";

describe("parseSkills", () => {
  it("parses categories + skills from markdown tables", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/skills.md", "utf8");
    const r = parseSkills(src);
    expect(r.categories.map((c) => c.name).sort()).toEqual(["Infrastructure & Platforms", "Languages"]);
    const langs = r.categories.find((c) => c.name === "Languages")!;
    expect(langs.skills.length).toBe(2);
    expect(langs.skills[0]).toMatchObject({ name: "TypeScript", proficiency: "expert", notes: "daily", appliedAt: ["Acme"] });
    expect(langs.skills[1]).toMatchObject({ name: "Rust", proficiency: "familiar", appliedAt: [] });
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/parsers/skills.ts`:

```ts
import { splitSections } from "@/server/importer/md-utils";

type Skill = { name: string; proficiency: "familiar" | "proficient" | "expert"; notes: string | null; appliedAt: string[]; order: number };
type Category = { name: string; order: number; skills: Skill[] };

function normalizeProficiency(s: string): Skill["proficiency"] {
  const lower = s.toLowerCase();
  if (lower.includes("expert")) return "expert";
  if (lower.includes("proficient")) return "proficient";
  return "familiar";
}

function parseTableRows(body: string): { headers: string[]; rows: string[][] } {
  const lines = body.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]!.split("|").map((s) => s.trim()).filter(Boolean);
  const rows = lines.slice(2).map((l) => l.split("|").map((s) => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1 ? true : !!_));
  // Simpler: trim leading/trailing empty
  return {
    headers,
    rows: rows.map((cells) => cells.length ? cells : []).filter((cells) => cells.length > 0),
  };
}

export function parseSkills(source: string): { categories: Category[]; softSkills: { name: string; whereDemonstrated: string; whatHappened: string; tagSlugs: string[]; order: number }[] } {
  const { sections } = splitSections(source);
  const categories: Category[] = [];
  let order = 0;
  for (const [heading, body] of Object.entries(sections)) {
    if (heading.toLowerCase().includes("soft skill")) continue;
    const { headers, rows } = parseTableRows(body);
    if (headers.length === 0) continue;
    const skills: Skill[] = rows.map((cells, i) => ({
      name: cells[0] ?? "",
      proficiency: normalizeProficiency(cells[1] ?? ""),
      appliedAt: (cells[2] ?? "—") === "—" ? [] : cells[2]!.split(",").map((s) => s.trim()).filter(Boolean),
      notes: cells[3] && cells[3] !== "—" ? cells[3] : null,
      order: i,
    })).filter((s) => s.name);
    categories.push({ name: heading, order: order++, skills });
  }
  return { categories, softSkills: [] };
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/skills.test.ts
git add server/importer/parsers/skills.ts tests/unit/server/importer/skills.test.ts
git commit -m "phase 5: add skills.md parser"
```

---

## Task 8: Values parser

**File:** `server/importer/parsers/values.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseValues } from "@/server/importer/parsers/values";

describe("parseValues", () => {
  it("parses principles, narrative, opinions, themes", () => {
    const src = readFileSync("test-fixtures/cv-template-minimal/values.md", "utf8");
    const r = parseValues(src);
    expect(r.principles.length).toBe(2);
    expect(r.principles[0]?.statement).toBe("Ownership over heroism");
    expect(r.narrative).toContain("ten years");
    expect(r.opinions.length).toBe(1);
    expect(r.opinions[0]?.position).toContain("modular monolith");
    expect(r.themes.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/parsers/values.ts`:

```ts
import { splitSections } from "@/server/importer/md-utils";

type Principle = { statement: string; justification: string; order: number };
type Opinion = { position: string; why: string; counterargument: string; order: number };
type Theme = { text: string; order: number };

function splitH3Blocks(body: string): { title: string; body: string }[] {
  const lines = body.split("\n");
  const blocks: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;
  for (const line of lines) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1]!, body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function findLabelLine(body: string, label: string): string {
  const re = new RegExp(`^${label}:\\s*(.+)$`, "m");
  const m = body.match(re);
  return m ? m[1]!.trim() : "";
}

export function parseValues(source: string): {
  principles: Principle[];
  narrative: string;
  opinions: Opinion[];
  themes: Theme[];
} {
  const { sections } = splitSections(source);
  const principlesBody = sections["Principles"] ?? "";
  const principles = splitH3Blocks(principlesBody).map((b, i) => ({
    statement: b.title,
    justification: b.body.trim(),
    order: i,
  }));
  const narrative = (sections["Career narrative"] ?? "").trim();
  const opinionsBody = sections["Industry opinions"] ?? "";
  const opinions = splitH3Blocks(opinionsBody).map((b, i) => ({
    position: findLabelLine(b.body, "Position") || b.title,
    why: findLabelLine(b.body, "Why"),
    counterargument: findLabelLine(b.body, "Counterargument"),
    order: i,
  }));
  const themesBody = sections["LinkedIn themes"] ?? "";
  const themes = themesBody
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l, i) => ({ text: l.replace(/^\s*-\s*/, "").trim(), order: i }))
    .filter((t) => t.text);

  return { principles, narrative, opinions, themes };
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/values.test.ts
git add server/importer/parsers/values.ts tests/unit/server/importer/values.test.ts
git commit -m "phase 5: add values.md parser"
```

---

## Task 9: Applications parser

**File:** `server/importer/parsers/applications.ts`

For brevity, the application parser stores the JD content and rough JSONB shapes — fields that don't map cleanly land in a `raw` key. The chat workflow in sub-project 2 writes correct shapes going forward.

- [ ] **Step 1: Write the test**

```ts
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
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/parsers/applications.ts`:

```ts
import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

type JdSourceType = "url" | "path" | "pasted";

export function parseJobDescription(source: string): {
  sourceType: JdSourceType;
  sourceValue: string | null;
  capturedAt: string | null;
  content: string;
} {
  const { data, content } = parseFrontmatter(source);
  const src = String(data.source ?? "pasted");
  const sourceType: JdSourceType = src.startsWith("http") ? "url" : src === "pasted" ? "pasted" : "path";
  return {
    sourceType,
    sourceValue: src === "pasted" ? null : src,
    capturedAt: data.captured_at ? String(data.captured_at) : null,
    content: content.trim(),
  };
}

function bulletItems(body: string): string[] {
  return body.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
}

export function parseTailoringStrategy(source: string) {
  const { content } = parseFrontmatter(source);
  const { sections } = splitSections(content);
  const jdSummaryBody = sections["JD Summary"] ?? "";
  const { sections: jdSubs } = splitH3Sections(jdSummaryBody);
  const strategyBody = sections["Strategy"] ?? "";
  const { sections: strategySubs } = splitH3Sections(strategyBody);
  const coverBody = strategySubs["Cover letter"] ?? "";
  const gapsBody = sections["Gaps flagged"] ?? "";
  const gapBlocks = splitH3Blocks(gapsBody);

  const findLabel = (body: string, label: string) => {
    const re = new RegExp(`^\\*\\*${label}\\*\\*:\\s*(.+)`, "m");
    const m = body.match(re);
    return m ? m[1]!.trim() : "";
  };

  return {
    jdSummary: {
      mustHaves: bulletItems(jdSubs["Must-haves"] ?? ""),
      niceToHaves: bulletItems(jdSubs["Nice-to-haves"] ?? ""),
      signals: bulletItems(jdSubs["Signals"] ?? ""),
      ambiguities: bulletItems(jdSubs["Ambiguities"] ?? ""),
    },
    strategy: {
      headlineSummary: (strategySubs["Headline summary"] ?? "").trim(),
      experienceOrder: [],
      skillsLead: [],
      skillsDeprioritize: [],
      coverLetterAngle: {
        hook: findLabel(coverBody, "Hook"),
        body1: findLabel(coverBody, "Body 1"),
        body2: findLabel(coverBody, "Body 2"),
        close: findLabel(coverBody, "Close"),
      },
    },
    gaps: gapBlocks.map((b) => ({
      requirement: b.title,
      optionA: findLabel(b.body, "Option A"),
      optionB: findLabel(b.body, "Option B"),
      recommendation: (findLabel(b.body, "Recommendation") || "A") as "A" | "B" | "address-head-on",
    })),
  };
}

function splitH3Sections(body: string): { sections: Record<string, string> } {
  const lines = body.split("\n");
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => { if (current !== null) sections[current] = buffer.join("\n").replace(/^\n+/, ""); };
  for (const line of lines) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) { flush(); current = m[1]!; buffer = []; }
    else if (current !== null) buffer.push(line);
  }
  flush();
  return { sections };
}

function splitH3Blocks(body: string): { title: string; body: string }[] {
  const { sections } = splitH3Sections(body);
  return Object.entries(sections).map(([title, body]) => ({ title, body }));
}

export function parseCompanyNotes(source: string) {
  // Best-effort skeleton; chat workflow will fill in.
  const { content } = parseFrontmatter(source);
  const { sections } = splitSections(content);
  return {
    company: {
      overview: (sections["Overview"] ?? "").trim(),
      products: (sections["Products"] ?? "").trim(),
      recentSignals: (sections["Recent signals"] ?? "").trim(),
      leadership: (sections["Leadership"] ?? "").trim(),
      reputation: (sections["Reputation"] ?? "").trim(),
    },
    role: {
      beyondJd: (sections["Beyond the JD"] ?? "").trim(),
      whyRole: (sections["Why this role"] ?? "").trim(),
    },
    process: {
      stages: [],
      peopleToMeet: [],
      logistics: (sections["Logistics"] ?? "").trim(),
    },
    calibration: {
      style: "mixed" as const,
      difficulty: "mid-rigorous" as const,
      tone: "casual" as const,
      justification: (sections["Justification"] ?? "").trim(),
    },
    riskAreas: (sections["Risk areas"] ?? "").trim(),
  };
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/importer/applications.test.ts
git add server/importer/parsers/applications.ts tests/unit/server/importer/applications.test.ts
git commit -m "phase 5: add application-folder parsers (jd, strategy, notes)"
```

---

## Task 10: Importer driver

**File:** `server/importer/run.ts`

- [ ] **Step 1: Write the integration test**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";
import { runImport } from "@/server/importer/run";

describe("runImport", () => {
  beforeAll(async () => resetDb());
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.application.deleteMany();
    await db.experienceRole.deleteMany();
    await db.skill.deleteMany();
    await db.skillCategory.deleteMany();
    await db.softSkill.deleteMany();
    await db.educationEntry.deleteMany();
    await db.valuePrinciple.deleteMany();
    await db.valueIndustryOpinion.deleteMany();
    await db.valueLinkedInTheme.deleteMany();
    await db.valueCareerNarrative.deleteMany();
    await db.profile.deleteMany();
    // re-seed categories that the importer expects exist or creates
    const { default: seed } = await import("@/prisma/seed");
    if (typeof seed === "function") await seed();
  });

  it("imports the fixture cv-template end-to-end", async () => {
    const r = await runImport("test-fixtures/cv-template-minimal");
    expect(r.result).toBe("success");
    const profile = await db.profile.findUnique({ where: { userId: 1 } });
    expect(profile?.fullName).toBe("Jane Doe");
    const roles = await db.experienceRole.findMany();
    expect(roles.length).toBe(1);
    const apps = await db.application.findMany();
    expect(apps.length).toBe(1);
  });

  it("is idempotent (re-running does not duplicate)", async () => {
    await runImport("test-fixtures/cv-template-minimal");
    await runImport("test-fixtures/cv-template-minimal");
    expect(await db.experienceRole.count()).toBe(1);
    expect(await db.application.count()).toBe(1);
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`server/importer/run.ts`:

```ts
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { parseProfile } from "@/server/importer/parsers/profile";
import { parseEducation } from "@/server/importer/parsers/education";
import { parseExperience } from "@/server/importer/parsers/experience";
import { parseSkills } from "@/server/importer/parsers/skills";
import { parseValues } from "@/server/importer/parsers/values";
import { parseJobDescription, parseTailoringStrategy, parseCompanyNotes } from "@/server/importer/parsers/applications";
import { slugify } from "@/server/actions/helpers";

export type ImportReport = {
  result: "success" | "partial" | "failed";
  imported: number;
  updated: number;
  skipped: { file: string; error: string }[];
};

function safe<T>(file: string, fn: () => T, skipped: ImportReport["skipped"]): T | null {
  try {
    return fn();
  } catch (e) {
    skipped.push({ file, error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

export async function runImport(repoPath: string): Promise<ImportReport> {
  const report: ImportReport = { result: "success", imported: 0, updated: 0, skipped: [] };
  const seenAny = (): boolean => report.imported + report.updated > 0;

  // Profile
  const profilePath = path.join(repoPath, "profile.md");
  if (existsSync(profilePath)) {
    const parsed = safe(profilePath, () => parseProfile(readFileSync(profilePath, "utf8")), report.skipped);
    if (parsed) {
      const existing = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
      const profile = await db.profile.upsert({
        where: { userId: CURRENT_USER_ID },
        create: { ...parsed.profile, userId: CURRENT_USER_ID },
        update: parsed.profile,
      });
      await db.$transaction([
        db.keyQualification.deleteMany({ where: { profileId: profile.id } }),
        db.keyQualification.createMany({ data: parsed.keyQualifications.map((k) => ({ ...k, profileId: profile.id })) }),
        db.language.deleteMany({ where: { profileId: profile.id } }),
        db.language.createMany({ data: parsed.languages.map((l) => ({ ...l, profileId: profile.id })) }),
      ]);
      if (existing) report.updated += 1; else report.imported += 1;
    }
  }

  // Education
  const educationPath = path.join(repoPath, "education.md");
  if (existsSync(educationPath)) {
    const entries = safe(educationPath, () => parseEducation(readFileSync(educationPath, "utf8")), report.skipped);
    if (entries) {
      await db.educationEntry.deleteMany({ where: { userId: CURRENT_USER_ID } });
      if (entries.length) {
        await db.educationEntry.createMany({ data: entries.map((e) => ({ ...e, userId: CURRENT_USER_ID })) });
        report.imported += entries.length;
      }
    }
  }

  // Experience roles + achievements + highlights
  const expDir = path.join(repoPath, "experience");
  const roleSlugMap = new Map<string, number>(); // for SkillApplication later
  if (existsSync(expDir)) {
    const files = readdirSync(expDir).filter((f) => f.endsWith(".md") && f !== "_template.md");
    for (const file of files) {
      const filePath = path.join(expDir, file);
      const slug = file.replace(/\.md$/, "");
      const parsed = safe(filePath, () => parseExperience(readFileSync(filePath, "utf8"), slug), report.skipped);
      if (!parsed) continue;
      const { role, achievements, highlights } = parsed;
      const tagRows = await db.tag.findMany({ where: { slug: { in: role.tagSlugs } } });
      const existing = await db.experienceRole.findFirst({ where: { userId: CURRENT_USER_ID, slug } });
      const { tagSlugs, ...roleData } = role;
      const written = await db.experienceRole.upsert({
        where: { userId_slug: { userId: CURRENT_USER_ID, slug } },
        create: { ...roleData, userId: CURRENT_USER_ID },
        update: roleData,
      });
      roleSlugMap.set(slug, written.id);
      await db.$transaction([
        db.roleTag.deleteMany({ where: { roleId: written.id } }),
        db.roleTag.createMany({ data: tagRows.map((t) => ({ roleId: written.id, tagId: t.id })) }),
        db.achievement.deleteMany({ where: { roleId: written.id } }),
        db.highlight.deleteMany({ where: { roleId: written.id } }),
      ]);
      for (const a of achievements) {
        const created = await db.achievement.create({ data: { roleId: written.id, title: a.title, result: a.result, context: a.context, action: a.action, order: a.order } });
        const aTags = await db.tag.findMany({ where: { slug: { in: a.tagSlugs } } });
        if (aTags.length) await db.achievementTag.createMany({ data: aTags.map((t) => ({ achievementId: created.id, tagId: t.id })) });
      }
      if (highlights.length) await db.highlight.createMany({ data: highlights.map((h) => ({ ...h, roleId: written.id })) });
      if (existing) report.updated += 1; else report.imported += 1;
    }
  }

  // Skills
  const skillsPath = path.join(repoPath, "skills.md");
  if (existsSync(skillsPath)) {
    const parsed = safe(skillsPath, () => parseSkills(readFileSync(skillsPath, "utf8")), report.skipped);
    if (parsed) {
      for (const cat of parsed.categories) {
        const c = await db.skillCategory.upsert({
          where: { userId_name: { userId: CURRENT_USER_ID, name: cat.name } },
          create: { name: cat.name, order: cat.order, userId: CURRENT_USER_ID },
          update: { order: cat.order },
        });
        await db.skill.deleteMany({ where: { categoryId: c.id } });
        for (const s of cat.skills) {
          const skill = await db.skill.create({ data: { name: s.name, proficiency: s.proficiency, notes: s.notes, order: s.order, categoryId: c.id } });
          // Resolve appliedAt → role IDs by company name (case-insensitive).
          const matchingRoles = await db.experienceRole.findMany({
            where: { userId: CURRENT_USER_ID, company: { in: s.appliedAt } },
            select: { id: true },
          });
          if (matchingRoles.length) {
            await db.skillApplication.createMany({ data: matchingRoles.map((r) => ({ skillId: skill.id, roleId: r.id })) });
          }
          report.imported += 1;
        }
      }
    }
  }

  // Values
  const valuesPath = path.join(repoPath, "values.md");
  if (existsSync(valuesPath)) {
    const parsed = safe(valuesPath, () => parseValues(readFileSync(valuesPath, "utf8")), report.skipped);
    if (parsed) {
      await db.$transaction([
        db.valuePrinciple.deleteMany({ where: { userId: CURRENT_USER_ID } }),
        db.valueIndustryOpinion.deleteMany({ where: { userId: CURRENT_USER_ID } }),
        db.valueLinkedInTheme.deleteMany({ where: { userId: CURRENT_USER_ID } }),
      ]);
      if (parsed.principles.length) await db.valuePrinciple.createMany({ data: parsed.principles.map((p) => ({ ...p, userId: CURRENT_USER_ID })) });
      if (parsed.narrative) {
        await db.valueCareerNarrative.upsert({
          where: { userId: CURRENT_USER_ID },
          create: { userId: CURRENT_USER_ID, text: parsed.narrative },
          update: { text: parsed.narrative },
        });
      }
      if (parsed.opinions.length) await db.valueIndustryOpinion.createMany({ data: parsed.opinions.map((o) => ({ ...o, userId: CURRENT_USER_ID })) });
      if (parsed.themes.length) await db.valueLinkedInTheme.createMany({ data: parsed.themes.map((t) => ({ ...t, userId: CURRENT_USER_ID })) });
      report.imported += parsed.principles.length + parsed.opinions.length + parsed.themes.length + (parsed.narrative ? 1 : 0);
    }
  }

  // Applications
  const appsDir = path.join(repoPath, "applications");
  if (existsSync(appsDir) && statSync(appsDir).isDirectory()) {
    const folders = readdirSync(appsDir).filter((f) => statSync(path.join(appsDir, f)).isDirectory());
    for (const folder of folders) {
      const appPath = path.join(appsDir, folder);
      const jdPath = path.join(appPath, "job-description.md");
      if (!existsSync(jdPath)) continue;
      const jd = safe(jdPath, () => parseJobDescription(readFileSync(jdPath, "utf8")), report.skipped);
      if (!jd) continue;
      // Reconstruct company / role from the H1 heading or the folder.
      const h1 = jd.content.match(/^#\s+(.+?)$/m)?.[1] ?? folder;
      const [company, roleTitleRaw] = h1.split(/\s+[—-]\s+/);
      const roleTitle = roleTitleRaw ?? folder;
      const existing = await db.application.findFirst({ where: { userId: CURRENT_USER_ID, slug: folder } });
      const app = await db.application.upsert({
        where: { userId_slug: { userId: CURRENT_USER_ID, slug: folder } },
        create: {
          userId: CURRENT_USER_ID,
          slug: folder,
          company: company.trim(),
          roleTitle: roleTitle.trim(),
          language: "en",
        },
        update: { company: company.trim(), roleTitle: roleTitle.trim() },
      });
      await db.jobDescription.upsert({
        where: { applicationId: app.id },
        create: {
          applicationId: app.id,
          sourceType: jd.sourceType,
          sourceValue: jd.sourceValue,
          capturedAt: jd.capturedAt ? new Date(jd.capturedAt) : new Date(),
          content: jd.content,
        },
        update: { sourceType: jd.sourceType, sourceValue: jd.sourceValue, content: jd.content },
      });
      const strategyPath = path.join(appPath, "tailoring-strategy.md");
      if (existsSync(strategyPath)) {
        const strat = safe(strategyPath, () => parseTailoringStrategy(readFileSync(strategyPath, "utf8")), report.skipped);
        if (strat) {
          await db.tailoringStrategy.upsert({
            where: { applicationId: app.id },
            create: { applicationId: app.id, content: strat },
            update: { content: strat },
          });
        }
      }
      const notesPath = path.join(appPath, "company-notes.md");
      if (existsSync(notesPath)) {
        const notes = safe(notesPath, () => parseCompanyNotes(readFileSync(notesPath, "utf8")), report.skipped);
        if (notes) {
          const now = new Date();
          await db.companyNotes.upsert({
            where: { applicationId: app.id },
            create: { applicationId: app.id, content: notes, researchedAt: now, lastUpdated: now },
            update: { content: notes, lastUpdated: now },
          });
        }
      }
      // Register existing PDFs as artifacts (best-effort).
      for (const kind of ["cv", "cover-letter"] as const) {
        const pdf = path.join(appPath, `${kind}.pdf`);
        const typ = path.join(appPath, `${kind}.typ`);
        if (existsSync(typ) || existsSync(pdf)) {
          const dbKind = kind === "cv" ? "cv" : "cover_letter";
          const existingArt = await db.artifact.findFirst({ where: { applicationId: app.id, kind: dbKind } });
          if (!existingArt) {
            await db.artifact.create({
              data: {
                applicationId: app.id,
                kind: dbKind,
                typstSource: existsSync(typ) ? readFileSync(typ, "utf8") : "",
                pdfPath: existsSync(pdf) ? pdf : null,
                version: 1,
              },
            });
          }
        }
      }
      if (existing) report.updated += 1; else report.imported += 1;
    }
  }

  if (report.skipped.length > 0) report.result = report.imported + report.updated > 0 ? "partial" : "failed";
  if (!seenAny() && report.skipped.length === 0) report.result = "failed";
  return report;
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/integration/server/importer/run.test.ts
git add server/importer/run.ts tests/integration/server/importer/run.test.ts
git commit -m "phase 5: add importer driver (idempotent, partial-success)"
```

---

## Task 11: CLI entry

**File:** `scripts/import.ts`

- [ ] **Step 1: Implement**

```ts
import { runImport } from "@/server/importer/run";
import { db } from "@/server/data/db";

async function main() {
  const args = process.argv.slice(2);
  const repoPath = args.find((a) => !a.startsWith("--"));
  if (!repoPath) {
    console.error("Usage: npm run import -- <path-to-cv-template-repo> [--clean]");
    process.exit(1);
  }
  const clean = args.includes("--clean");
  if (clean) {
    console.log("--clean: wiping all rows…");
    await db.application.deleteMany();
    await db.experienceRole.deleteMany();
    await db.skill.deleteMany();
    await db.skillCategory.deleteMany();
    await db.softSkill.deleteMany();
    await db.educationEntry.deleteMany();
    await db.valuePrinciple.deleteMany();
    await db.valueIndustryOpinion.deleteMany();
    await db.valueLinkedInTheme.deleteMany();
    await db.valueCareerNarrative.deleteMany();
    await db.profile.deleteMany();
  }
  const r = await runImport(repoPath);
  console.log(`result: ${r.result}`);
  console.log(`imported: ${r.imported}, updated: ${r.updated}`);
  if (r.skipped.length) {
    console.log(`\nskipped:`);
    for (const s of r.skipped) console.log(`  ${s.file}: ${s.error}`);
  }
  await db.$disconnect();
  process.exit(r.result === "failed" && r.imported === 0 ? 1 : 0);
}

main();
```

- [ ] **Step 2: Smoke test**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16 && sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy && npx tsx prisma/seed.ts
npx tsx scripts/import.ts test-fixtures/cv-template-minimal
```

Expected: prints `result: success`, `imported: ≥5`. Stop temp container.

- [ ] **Step 3: Commit**

```bash
git add scripts/import.ts
git commit -m "phase 5: add npm run import CLI"
```

---

## Task 12: Tag CRUD actions

**File:** `server/actions/tag.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { TagSlug } from "@/server/validation/common";
import { z } from "zod";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

const TagSchema = z.object({ slug: TagSlug, label: z.string().min(1, "Label is required") });

export async function createTag(fd: FormData): Promise<ActionResult<null>> {
  const parsed = TagSchema.safeParse({ slug: String(fd.get("slug") ?? ""), label: String(fd.get("label") ?? "") });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid tag.", zodToFieldErrors(parsed.error));
  try {
    await db.tag.create({ data: parsed.data });
    revalidatePath("/settings");
    return ok(null);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Slug already taken.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function deleteTag(id: number): Promise<ActionResult<null>> {
  await db.tag.delete({ where: { id } });
  revalidatePath("/settings");
  return ok(null);
}
```

- [ ] **Step 2: Commit**

```bash
git add server/actions/tag.ts
git commit -m "phase 5: add Tag CRUD actions"
```

---

## Task 13: Importer + wipeAll actions

**File:** `server/actions/importer.ts`, `server/actions/settings.ts`

- [ ] **Step 1: Implement `server/actions/importer.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { runImport } from "@/server/importer/run";
import { ok, err, type ActionResult } from "@/server/actions/result";

export async function startImport(fd: FormData): Promise<ActionResult<{ runId: number }>> {
  const repoPath = String(fd.get("repoPath") ?? "") || process.env.KB_SOURCE_REPO_PATH;
  if (!repoPath) return err("VALIDATION_FAILED", "Set KB_SOURCE_REPO_PATH or provide a path.", { repoPath: "Required" });
  const run = await db.importRun.create({
    data: { userId: CURRENT_USER_ID, sourcePath: repoPath, result: "in_progress", summary: { phase: "starting" } },
  });
  // Synchronous run for v1; SSE endpoint reads status. (Streaming progress is best-effort — clients poll the ImportRun row.)
  try {
    const report = await runImport(repoPath);
    await db.importRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), result: report.result, summary: { counts: { imported: report.imported, updated: report.updated }, skipped: report.skipped } },
    });
    revalidatePath("/settings");
    return ok({ runId: run.id });
  } catch (e) {
    await db.importRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), result: "failed", summary: { error: e instanceof Error ? e.message : String(e) } },
    });
    return err("INTERNAL", "Import crashed.");
  }
}
```

- [ ] **Step 2: Implement `server/actions/settings.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { ok, type ActionResult } from "@/server/actions/result";

export async function wipeAllData(): Promise<ActionResult<null>> {
  // Cascading deletes flow from User; we drop the row and recreate via seed.
  await db.user.deleteMany();
  const { default: seed } = await import("@/prisma/seed");
  if (typeof seed === "function") await seed();
  revalidatePath("/", "layout");
  return ok(null);
}
```

(Refactor: this requires the seed script to export a `default` function. Update `prisma/seed.ts` accordingly.)

- [ ] **Step 3: Refactor `prisma/seed.ts`** to export a function

```ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEFAULT_TAGS = [
  { slug: "leadership", label: "Leadership" },
  { slug: "technical", label: "Technical" },
  { slug: "strategy", label: "Strategy" },
  { slug: "delivery", label: "Delivery" },
  { slug: "culture", label: "Culture" },
  { slug: "growth", label: "Growth" },
  { slug: "innovation", label: "Innovation" },
];

const DEFAULT_SKILL_CATEGORIES = [
  "Languages",
  "Infrastructure & Platforms",
  "Architecture & Design",
  "AI & Developer Experience",
  "Methods & Practices",
];

export default async function seed() {
  const user = await db.user.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  for (const tag of DEFAULT_TAGS) {
    await db.tag.upsert({ where: { slug: tag.slug }, update: { label: tag.label }, create: tag });
  }
  let order = 0;
  for (const name of DEFAULT_SKILL_CATEGORIES) {
    await db.skillCategory.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: { order },
      create: { userId: user.id, name, order },
    });
    order += 1;
  }
  console.log("Seeded user", user.id, "tags", DEFAULT_TAGS.length, "categories", DEFAULT_SKILL_CATEGORIES.length);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
}
```

- [ ] **Step 4: Commit**

```bash
git add server/actions/importer.ts server/actions/settings.ts prisma/seed.ts
git commit -m "phase 5: add startImport + wipeAllData + seed refactor"
```

---

## Task 14: SSE endpoint for import progress

**File:** `app/api/import/stream/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      let lastSeen: number | null = null;
      const interval = setInterval(async () => {
        const run = await db.importRun.findFirst({
          where: { userId: CURRENT_USER_ID },
          orderBy: { startedAt: "desc" },
        });
        if (!run) return;
        if (run.id === lastSeen && run.result === "in_progress") return;
        lastSeen = run.id;
        send({
          runId: run.id,
          result: run.result,
          summary: run.summary,
          finishedAt: run.finishedAt,
        });
        if (run.result !== "in_progress") {
          clearInterval(interval);
          controller.close();
        }
      }, 500);
    },
  });
  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/import/stream/route.ts
git commit -m "phase 5: add /api/import/stream SSE endpoint"
```

---

## Task 15: Settings page

**Files:** `app/(shell)/settings/page.tsx` + section components

- [ ] **Step 1: Implement `app/(shell)/settings/page.tsx`**

```tsx
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { TagsSection } from "./tags-section";
import { AuthSection } from "./auth-section";
import { ImporterSection } from "./importer-section";
import { DangerZoneSection } from "./danger-zone-section";

export default async function SettingsPage() {
  const tags = await db.tag.findMany({
    orderBy: { slug: "asc" },
    include: { _count: { select: { roles: true, achievements: true, softSkills: true } } },
  });
  const lastRun = await db.importRun.findFirst({
    where: { userId: CURRENT_USER_ID },
    orderBy: { startedAt: "desc" },
  });
  const authEnabled = !!process.env.ADMIN_PASSWORD_HASH;

  return (
    <>
      <Header title="Settings" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-3xl">
        <TagsSection
          tags={tags.map((t) => ({
            id: t.id,
            slug: t.slug,
            label: t.label,
            usage: t._count.roles + t._count.achievements + t._count.softSkills,
          }))}
        />
        <AuthSection enabled={authEnabled} />
        <ImporterSection
          lastRun={
            lastRun
              ? {
                  finishedAt: lastRun.finishedAt,
                  result: lastRun.result,
                  summary: lastRun.summary as { counts?: { imported: number; updated: number }; skipped?: { file: string; error: string }[] },
                }
              : null
          }
        />
        <DangerZoneSection />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Implement `tags-section.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { createTag, deleteTag } from "@/server/actions/tag";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Tag = { id: number; slug: string; label: string; usage: number };

export function TagsSection({ tags }: { tags: Tag[] }) {
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState<Tag | null>(null);
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader title="Tags" actions={!adding ? <Button onClick={() => setAdding(true)}>Add tag</Button> : null} />
      <CardBody className="flex flex-col gap-sm">
        {tags.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-sm border-b border-border-subtle">
            <div className="flex items-center gap-md">
              <span className="font-mono text-small">{t.slug}</span>
              <span className="text-body">{t.label}</span>
              <span className="text-caption text-text-tertiary">used in {t.usage}</span>
            </div>
            <Button variant="ghost" onClick={() => setConfirming(t)}>Delete</Button>
          </div>
        ))}
        {adding ? (
          <div className="flex items-center gap-sm pt-md">
            <Input placeholder="slug (kebab)" value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
            <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button
              disabled={pending || !slug || !label}
              onClick={() =>
                start(async () => {
                  const fd = new FormData();
                  fd.set("slug", slug); fd.set("label", label);
                  const r = await createTag(fd);
                  if (r.ok) { setSlug(""); setLabel(""); setAdding(false); }
                })
              }
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        ) : null}
        {confirming ? (
          <ConfirmModal
            open
            title={`Delete tag "${confirming.slug}"?`}
            description={`This will remove the tag from ${confirming.usage} item(s).`}
            confirmWord={confirming.slug}
            onConfirm={() => start(async () => { await deleteTag(confirming.id); setConfirming(null); })}
            onClose={() => setConfirming(null)}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 3: Implement `auth-section.tsx`**

```tsx
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function AuthSection({ enabled }: { enabled: boolean }) {
  return (
    <Card>
      <CardHeader title="Authentication" />
      <CardBody className="flex flex-col gap-sm">
        <p className="text-body">Password protection is <strong className={enabled ? "text-success" : "text-text-secondary"}>{enabled ? "enabled" : "disabled"}</strong>.</p>
        {!enabled ? (
          <p className="text-small text-text-secondary">
            Set <code className="font-mono">ADMIN_PASSWORD_HASH</code> in your <code className="font-mono">.env</code> to enable. Generate a hash with <code className="font-mono">npm run hash-password</code>.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 4: Implement `importer-section.tsx`**

```tsx
"use client";
import { useTransition, useState, useEffect } from "react";
import { startImport } from "@/server/actions/importer";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

type Run = {
  finishedAt: Date | null;
  result: "success" | "partial" | "failed" | "in_progress";
  summary: { counts?: { imported: number; updated: number }; skipped?: { file: string; error: string }[] };
};

export function ImporterSection({ lastRun: initial }: { lastRun: Run | null }) {
  const [pending, start] = useTransition();
  const [path, setPath] = useState("");
  const [run, setRun] = useState(initial);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!streaming) return;
    const src = new EventSource("/api/import/stream");
    src.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setRun({ finishedAt: data.finishedAt ? new Date(data.finishedAt) : null, result: data.result, summary: data.summary });
      if (data.result !== "in_progress") {
        setStreaming(false);
        src.close();
      }
    };
    return () => src.close();
  }, [streaming]);

  return (
    <Card>
      <CardHeader title="Import from markdown" />
      <CardBody className="flex flex-col gap-md">
        <p className="text-small text-text-secondary">Import your existing cv-template markdown KB into the database.</p>
        <FormField label="Repo path (or set KB_SOURCE_REPO_PATH)" name="repoPath" value={path} onChange={(e) => setPath(e.currentTarget.value)} />
        <div>
          <Button
            disabled={pending || streaming}
            onClick={() =>
              start(async () => {
                setStreaming(true);
                const fd = new FormData();
                fd.set("repoPath", path);
                await startImport(fd);
              })
            }
          >
            {streaming ? "Importing…" : "Run importer"}
          </Button>
        </div>
        {run ? (
          <div className="flex flex-col gap-sm pt-md border-t border-border-subtle">
            <p className="text-body">
              Last import: <strong>{run.result}</strong>
              {run.finishedAt ? <span className="text-text-secondary text-small"> · {run.finishedAt.toISOString()}</span> : null}
            </p>
            {run.summary?.counts ? (
              <p className="text-small">imported {run.summary.counts.imported}, updated {run.summary.counts.updated}</p>
            ) : null}
            {run.summary?.skipped?.length ? (
              <details>
                <summary className="text-small cursor-pointer">{run.summary.skipped.length} files skipped</summary>
                <ul className="mt-sm flex flex-col gap-xs">
                  {run.summary.skipped.map((s, i) => (
                    <li key={i} className="text-caption font-mono">{s.file}: {s.error}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 5: Implement `danger-zone-section.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { wipeAllData } from "@/server/actions/settings";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DangerZoneSection() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Card className="border-l-2 border-l-danger">
      <CardHeader title={<span className="text-danger">Danger zone</span>} />
      <CardBody className="flex flex-col gap-md">
        <p className="text-body">Wipe all data — delete all knowledge base and application data. This cannot be undone.</p>
        <div>
          <Button variant="secondary" className="border-danger text-danger" onClick={() => setOpen(true)}>
            Wipe all data
          </Button>
        </div>
        <ConfirmModal
          open={open}
          title="Wipe all data?"
          description="All KB and application data will be deleted. This cannot be undone."
          confirmWord="DELETE"
          onConfirm={() => start(async () => { await wipeAllData(); setOpen(false); })}
          onClose={() => setOpen(false)}
        />
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/\(shell\)/settings/
git commit -m "phase 5: add Settings page (tags, auth, importer, danger zone)"
```

---

## Task 16: Playwright config + helpers

**Files:** `playwright.config.ts`, `tests/e2e/helpers.ts`

- [ ] **Step 1: Implement `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Implement `tests/e2e/helpers.ts`**

```ts
import { execSync } from "node:child_process";

export function resetDatabase() {
  execSync("npx prisma migrate reset --force --skip-seed", { stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
}
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts tests/e2e/helpers.ts
git commit -m "phase 5: add Playwright config + helpers"
```

---

## Task 17: E2E happy paths (one per surface)

For brevity, this is six small spec files exercising the golden path of each page. Each spec resets the DB in `beforeAll`.

- [ ] **Step 1: `tests/e2e/profile.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("create + edit profile", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("Full name").fill("Jane Doe");
  await page.getByLabel("Headline").fill("Engineer");
  await page.getByLabel("Email").fill("j@d.com");
  await page.getByLabel("Professional summary").fill("Ten years of platforms.");
  await page.getByRole("button", { name: "Save" }).first().click();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Jane Doe");
});
```

- [ ] **Step 2: `tests/e2e/experience.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("create role + add achievement", async ({ page }) => {
  await page.goto("/experience/new");
  await page.getByLabel("Company").fill("Acme");
  await page.getByLabel("Title").fill("Engineer");
  await page.getByLabel("Start date").fill("2020-01");
  await page.getByLabel("Overview").fill("did things");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/experience\/acme-engineer/);
  await page.getByRole("button", { name: "Add achievement" }).click();
  await page.getByLabel("Title").fill("Shipped onboarding");
  await page.getByLabel("Context").fill("Manual checklist.");
  await page.getByLabel("Action").fill("Built pipeline.");
  await page.getByLabel("Result").fill("Cut time by 90%.");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Shipped onboarding")).toBeVisible();
});
```

- [ ] **Step 3: `tests/e2e/skills.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("add a skill to a seeded category", async ({ page }) => {
  await page.goto("/skills");
  await page.getByText("Languages").first();
  await page.getByRole("button", { name: "Add skill" }).first().click();
  await page.getByPlaceholder("Skill name").fill("TypeScript");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("TypeScript").first()).toBeVisible();
});
```

- [ ] **Step 4: `tests/e2e/education.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("add a degree", async ({ page }) => {
  await page.goto("/education/new");
  await page.getByLabel("Name").fill("MSc CS");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page).toHaveURL(/\/education$/);
  await expect(page.getByText("MSc CS")).toBeVisible();
});
```

- [ ] **Step 5: `tests/e2e/values.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("save a principle", async ({ page }) => {
  await page.goto("/values");
  await page.getByRole("button", { name: "Add principle" }).click();
  await page.getByPlaceholder("Statement").fill("Ownership");
  await page.getByPlaceholder("Justification").fill("Because.");
  await page.getByRole("button", { name: "Save" }).first().click();
  await page.reload();
  await expect(page.getByPlaceholder("Statement")).toHaveValue("Ownership");
});
```

- [ ] **Step 6: `tests/e2e/applications.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("create application", async ({ page }) => {
  await page.goto("/applications/new");
  await page.getByLabel("Company").fill("Acme");
  await page.getByLabel("Role title").fill("Engineer");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/applications\/acme-engineer/);
});
```

- [ ] **Step 7: `tests/e2e/importer.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("run importer from Settings", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Repo path (or set KB_SOURCE_REPO_PATH)").fill("test-fixtures/cv-template-minimal");
  await page.getByRole("button", { name: "Run importer" }).click();
  await expect(page.getByText(/Last import: success|partial/)).toBeVisible({ timeout: 30_000 });
  await page.goto("/profile");
  await expect(page.getByLabel("Full name")).toHaveValue("Jane Doe");
});
```

- [ ] **Step 8: Run E2E (after starting the app)**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16 && sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npx playwright test
```

Expected: all PASS. Stop temp container.

- [ ] **Step 9: Commit**

```bash
git add tests/e2e/
git commit -m "phase 5: add Playwright E2E happy paths for all surfaces"
```

---

## Task 18: Accessibility smoke pass

**File:** `tests/e2e/accessibility.spec.ts`

- [ ] **Step 1: Implement**

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

const SURFACES = ["/profile", "/experience", "/skills", "/education", "/values", "/applications", "/settings"];

for (const path of SURFACES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect.soft(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
```

- [ ] **Step 2: Run, fix any failures inline**

```bash
npx playwright test tests/e2e/accessibility.spec.ts
```

Common fixes: missing aria-label on icon-only buttons, insufficient color contrast on tertiary text (adjust the token if so). Iterate until all serious + critical violations are zero.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/accessibility.spec.ts
git commit -m "phase 5: add axe-core accessibility smoke pass"
```

---

## Task 19: Final Phase 5 + project acceptance verification

- [ ] **Step 1: Full clean install, build, all tests**

```bash
rm -rf node_modules .next
npm ci
docker compose up -d db && sleep 5
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm test
npx playwright test
docker compose down
```

Expected: all PASS.

- [ ] **Step 2: Docker compose smoke**

```bash
docker compose up --build -d
sleep 30
curl -s http://localhost:3000/api/health
docker compose down
```

Expected: `{"ok":true}`.

- [ ] **Step 3: Confirm acceptance criteria from spec §11**

Walk through the 10 acceptance criteria from `docs/superpowers/specs/2026-05-15-kb-web-app-data-model-and-crud-design.md` §11 and confirm each. Tick them off.

- [ ] **Step 4: Final commit (if any)**

```bash
git status
```

Expected: clean. If not, commit final touch-ups.

---

## Sub-project 1 is complete

The web app boots, KB CRUD works end-to-end, the importer migrates the existing markdown repo, Settings + tags + danger zone are wired, and the test suite (unit + integration + E2E + axe) is green. Sub-project 2 (Application chat workspace with LLM tool-use) begins from a stable, tested base.
