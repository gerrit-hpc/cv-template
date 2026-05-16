import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    profile: { findUnique: mockFindUnique },
  },
}));

describe("makeGetProfileTool", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("scopes query to userId", async () => {
    mockFindUnique.mockResolvedValue(null);
    const { makeGetProfileTool } = await import("@/lib/chat/tools/kb/get-profile");
    const tool = makeGetProfileTool(1);
    await tool.execute({});
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } }),
    );
  });

  it("returns { profile: null } when no profile exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    const { makeGetProfileTool } = await import("@/lib/chat/tools/kb/get-profile");
    const tool = makeGetProfileTool(1);
    const result = await tool.execute({});
    expect(result).toEqual({ profile: null });
  });

  it("returns mapped profile DTO", async () => {
    mockFindUnique.mockResolvedValue({
      fullName: "Jane Doe",
      headline: "Engineer",
      locationCity: "Berlin",
      locationCountry: "Germany",
      email: "jane@example.com",
      phone: "+49123",
      linkedinUrl: "https://linkedin.com/in/jane",
      githubUrl: null,
      websiteUrl: null,
      professionalSummary: "Experienced engineer.",
      keyQualifications: [{ text: "Led teams", order: 0 }],
      languages: [{ name: "English", proficiency: "native", order: 0 }],
    });
    const { makeGetProfileTool } = await import("@/lib/chat/tools/kb/get-profile");
    const tool = makeGetProfileTool(1);
    const result = await tool.execute({}) as { profile: Record<string, unknown> };
    expect(result.profile).toMatchObject({
      fullName: "Jane Doe",
      email: "jane@example.com",
      location: "Berlin, Germany",
      keyQualifications: ["Led teams"],
      languages: [{ name: "English", proficiency: "native" }],
    });
  });
});
