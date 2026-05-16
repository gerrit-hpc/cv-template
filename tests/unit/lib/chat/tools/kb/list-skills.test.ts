import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSkillCategoryFindMany = vi.fn();
const mockSoftSkillFindMany = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    skillCategory: { findMany: mockSkillCategoryFindMany },
    softSkill: { findMany: mockSoftSkillFindMany },
  },
}));

describe("makeListSkillsTool", () => {
  beforeEach(() => {
    mockSkillCategoryFindMany.mockReset();
    mockSoftSkillFindMany.mockReset();
  });

  it("scopes both queries to userId", async () => {
    mockSkillCategoryFindMany.mockResolvedValue([]);
    mockSoftSkillFindMany.mockResolvedValue([]);
    const { makeListSkillsTool } = await import("@/lib/chat/tools/kb/list-skills");
    const tool = makeListSkillsTool(1);
    await tool.execute({});
    expect(mockSkillCategoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } }),
    );
    expect(mockSoftSkillFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } }),
    );
  });

  it("returns categories with skills and softSkills with tags", async () => {
    mockSkillCategoryFindMany.mockResolvedValue([
      {
        name: "Languages",
        order: 0,
        skills: [{ name: "TypeScript", proficiency: "expert", notes: null, order: 0 }],
      },
    ]);
    mockSoftSkillFindMany.mockResolvedValue([
      {
        name: "Leadership",
        whereDemonstrated: "At Acme",
        whatHappened: "Led team of 8",
        order: 0,
        tags: [{ tag: { slug: "leadership" } }],
      },
    ]);
    const { makeListSkillsTool } = await import("@/lib/chat/tools/kb/list-skills");
    const tool = makeListSkillsTool(1);
    const result = await tool.execute({}) as { categories: unknown[]; softSkills: unknown[] };
    expect(result.categories).toEqual([
      { name: "Languages", skills: [{ name: "TypeScript", proficiency: "expert", notes: null }] },
    ]);
    expect(result.softSkills).toEqual([
      { name: "Leadership", whereDemonstrated: "At Acme", whatHappened: "Led team of 8", tags: ["leadership"] },
    ]);
  });
});
