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
