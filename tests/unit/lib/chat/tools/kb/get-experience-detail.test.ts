import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    experienceRole: { findUnique: mockFindUnique },
  },
}));

describe("makeGetExperienceDetailTool", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("scopes query to userId and slug", async () => {
    mockFindUnique.mockResolvedValue(null);
    const { makeGetExperienceDetailTool } = await import("@/lib/chat/tools/kb/get-experience-detail");
    const tool = makeGetExperienceDetailTool(1);
    await tool.execute({ slug: "acme-engineer" });
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_slug: { userId: 1, slug: "acme-engineer" } } }),
    );
  });

  it("returns { role: null } when slug not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const { makeGetExperienceDetailTool } = await import("@/lib/chat/tools/kb/get-experience-detail");
    const tool = makeGetExperienceDetailTool(1);
    const result = await tool.execute({ slug: "nonexistent" });
    expect(result).toEqual({ role: null });
  });

  it("returns full role DTO including achievements, highlights, tagSlugs, skillsUsed", async () => {
    mockFindUnique.mockResolvedValue({
      slug: "acme-engineer",
      company: "Acme",
      title: "Engineer",
      startDate: "2020-01",
      endDate: "2023-06",
      location: "Berlin",
      employmentType: "full_time",
      overview: "Led platform work.",
      scopeTeamSize: "8",
      scopeReportingTo: "CTO",
      scopeTechStack: "TypeScript, Postgres",
      scopeBudget: null,
      isHighlightsOnly: false,
      achievements: [
        {
          title: "Reduced latency",
          result: "50% faster",
          context: "High traffic",
          action: "Optimised queries",
          order: 0,
          tags: [{ tag: { slug: "performance" } }],
        },
      ],
      highlights: [{ text: "Key highlight", order: 0 }],
      tags: [{ tag: { slug: "backend" } }],
      skillApplications: [{ skill: { name: "TypeScript", proficiency: "expert" } }],
    });
    const { makeGetExperienceDetailTool } = await import("@/lib/chat/tools/kb/get-experience-detail");
    const tool = makeGetExperienceDetailTool(1);
    const result = await tool.execute({ slug: "acme-engineer" }) as { role: Record<string, unknown> };
    expect(result.role).toMatchObject({
      slug: "acme-engineer",
      overview: "Led platform work.",
      achievements: [
        {
          title: "Reduced latency",
          result: "50% faster",
          tags: ["performance"],
        },
      ],
      highlights: [{ text: "Key highlight" }],
      tagSlugs: ["backend"],
      skillsUsed: [{ name: "TypeScript", proficiency: "expert" }],
    });
  });
});
