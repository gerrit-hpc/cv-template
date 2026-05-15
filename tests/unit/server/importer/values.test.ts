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
