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

  it("parses numbered-bold-list + alias section names", () => {
    const src = `# Career Values

## Core Principles

1. **First principle name**: First principle justification text.

2. **Second principle name**: Second principle justification text.

## Career Narrative

A short career narrative paragraph here.

## Industry Opinions

### Opinion title one

**Position**: position text one.

**Why**: why text one.

**Counterargument I'd address**: counter text one.

## Themes for LinkedIn Content

1. **Theme one**: theme description one.

2. **Theme two**: theme description two.
`;
    const r = parseValues(src);
    expect(r.principles.length).toBe(2);
    expect(r.principles[0]?.statement).toBe("First principle name");
    expect(r.principles[0]?.justification).toContain("First principle justification");
    expect(r.narrative).toContain("career narrative paragraph");
    expect(r.opinions.length).toBe(1);
    expect(r.opinions[0]?.position).toBe("position text one.");
    expect(r.opinions[0]?.why).toBe("why text one.");
    expect(r.opinions[0]?.counterargument).toBe("counter text one.");
    expect(r.themes.length).toBe(2);
    expect(r.themes[0]?.text).toContain("Theme one");
  });
});
