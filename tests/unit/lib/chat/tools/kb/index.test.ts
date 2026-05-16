import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/data/db", () => ({
  db: {
    profile: { findUnique: vi.fn() },
    experienceRole: { findMany: vi.fn(), findUnique: vi.fn() },
    skillCategory: { findMany: vi.fn() },
    softSkill: { findMany: vi.fn() },
    educationEntry: { findMany: vi.fn() },
    valuePrinciple: { findMany: vi.fn() },
    valueCareerNarrative: { findUnique: vi.fn() },
    valueIndustryOpinion: { findMany: vi.fn() },
    valueLinkedInTheme: { findMany: vi.fn() },
  },
}));

describe("buildKbTools", () => {
  it("returns six tools with the expected names", async () => {
    const { buildKbTools } = await import("@/lib/chat/tools/kb/index");
    const tools = buildKbTools(1);
    expect(tools).toHaveLength(6);
    const names = tools.map((t) => t.name);
    expect(names).toContain("get_profile");
    expect(names).toContain("list_experience");
    expect(names).toContain("get_experience_detail");
    expect(names).toContain("list_skills");
    expect(names).toContain("get_education");
    expect(names).toContain("get_values");
  });
});
