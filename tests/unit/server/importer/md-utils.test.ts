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
