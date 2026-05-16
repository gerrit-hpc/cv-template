import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrinciplesFindMany = vi.fn();
const mockNarrativeFindUnique = vi.fn();
const mockOpinionsFindMany = vi.fn();
const mockThemesFindMany = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    valuePrinciple: { findMany: mockPrinciplesFindMany },
    valueCareerNarrative: { findUnique: mockNarrativeFindUnique },
    valueIndustryOpinion: { findMany: mockOpinionsFindMany },
    valueLinkedInTheme: { findMany: mockThemesFindMany },
  },
}));

describe("makeGetValuesTool", () => {
  beforeEach(() => {
    mockPrinciplesFindMany.mockReset();
    mockNarrativeFindUnique.mockReset();
    mockOpinionsFindMany.mockReset();
    mockThemesFindMany.mockReset();
  });

  it("scopes all queries to userId", async () => {
    mockPrinciplesFindMany.mockResolvedValue([]);
    mockNarrativeFindUnique.mockResolvedValue(null);
    mockOpinionsFindMany.mockResolvedValue([]);
    mockThemesFindMany.mockResolvedValue([]);
    const { makeGetValuesTool } = await import("@/lib/chat/tools/kb/get-values");
    const tool = makeGetValuesTool(1);
    await tool.execute({});
    expect(mockPrinciplesFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
    expect(mockNarrativeFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
    expect(mockOpinionsFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
    expect(mockThemesFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
  });

  it("returns null careerNarrative when none exists", async () => {
    mockPrinciplesFindMany.mockResolvedValue([]);
    mockNarrativeFindUnique.mockResolvedValue(null);
    mockOpinionsFindMany.mockResolvedValue([]);
    mockThemesFindMany.mockResolvedValue([]);
    const { makeGetValuesTool } = await import("@/lib/chat/tools/kb/get-values");
    const tool = makeGetValuesTool(1);
    const result = await tool.execute({}) as { careerNarrative: unknown };
    expect(result.careerNarrative).toBeNull();
  });

  it("returns full values DTO", async () => {
    mockPrinciplesFindMany.mockResolvedValue([
      { statement: "Build for people", justification: "Users come first" },
    ]);
    mockNarrativeFindUnique.mockResolvedValue({ text: "I build platforms." });
    mockOpinionsFindMany.mockResolvedValue([
      { position: "TypeScript over JS", why: "Type safety", counterargument: "More setup" },
    ]);
    mockThemesFindMany.mockResolvedValue([{ text: "Engineering leadership" }]);
    const { makeGetValuesTool } = await import("@/lib/chat/tools/kb/get-values");
    const tool = makeGetValuesTool(1);
    const result = await tool.execute({}) as Record<string, unknown>;
    expect(result).toEqual({
      principles: [{ statement: "Build for people", justification: "Users come first" }],
      careerNarrative: "I build platforms.",
      industryOpinions: [{ position: "TypeScript over JS", why: "Type safety", counterargument: "More setup" }],
      linkedInThemes: ["Engineering leadership"],
    });
  });
});
