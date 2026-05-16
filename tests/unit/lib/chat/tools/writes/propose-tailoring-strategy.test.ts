import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    application: { findFirst },
    chatToolCall: { create },
  },
}));

const validStrategy = {
  jdSummary: { mustHaves: [], niceToHaves: [], signals: [], ambiguities: [] },
  strategy: {
    headlineSummary: "Engineer with 10 years at scale",
    experienceOrder: [],
    skillsLead: ["distributed systems"],
    skillsDeprioritize: [],
    coverLetterAngle: { hook: "h", body1: "b1", body2: "b2", close: "c" },
  },
  gaps: [],
};

describe("propose_tailoring_strategy", () => {
  beforeEach(() => {
    findFirst.mockReset();
    create.mockReset();
  });

  it("scopes the application lookup to (applicationId, userId)", async () => {
    findFirst.mockResolvedValue({ id: 42, slug: "acme" });
    create.mockResolvedValue({ id: 7 });
    const { makeProposeTailoringStrategyTool } = await import(
      "@/lib/chat/tools/writes/propose-tailoring-strategy"
    );
    const tool = makeProposeTailoringStrategyTool(42, 1);
    await tool.execute({ content: validStrategy }, { toolCallId: "toolu_x" });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42, userId: 1 } }),
    );
  });

  it("returns isError when the application is not under this user", async () => {
    findFirst.mockResolvedValue(null);
    const { makeProposeTailoringStrategyTool } = await import(
      "@/lib/chat/tools/writes/propose-tailoring-strategy"
    );
    const tool = makeProposeTailoringStrategyTool(42, 1);
    const result = await tool.execute({ content: validStrategy }, { toolCallId: "toolu_x" });
    expect(result).toMatchObject({ isError: true });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns isError when content fails zod validation", async () => {
    findFirst.mockResolvedValue({ id: 42, slug: "acme" });
    const { makeProposeTailoringStrategyTool } = await import(
      "@/lib/chat/tools/writes/propose-tailoring-strategy"
    );
    const tool = makeProposeTailoringStrategyTool(42, 1);
    const result = await tool.execute(
      { content: { jdSummary: {} } as unknown },
      { toolCallId: "toolu_x" },
    );
    expect(result).toMatchObject({ isError: true });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a pending ChatToolCall and returns proposalId + summary", async () => {
    findFirst.mockResolvedValue({ id: 42, slug: "acme" });
    create.mockResolvedValue({ id: 99 });
    const { makeProposeTailoringStrategyTool } = await import(
      "@/lib/chat/tools/writes/propose-tailoring-strategy"
    );
    const tool = makeProposeTailoringStrategyTool(42, 1);
    const result = await tool.execute({ content: validStrategy }, { toolCallId: "toolu_xyz" });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 42,
        toolName: "propose_tailoring_strategy",
        toolUseId: "toolu_xyz",
        status: "pending",
      }),
    });
    expect(result).toMatchObject({
      proposalId: 99,
      status: "pending_approval",
    });
    expect((result as { summary: string }).summary).toMatch(/Engineer with 10 years/);
  });

  it("has the canonical name and an 'end your turn' description", async () => {
    findFirst.mockResolvedValue({ id: 42 });
    const { makeProposeTailoringStrategyTool } = await import(
      "@/lib/chat/tools/writes/propose-tailoring-strategy"
    );
    const tool = makeProposeTailoringStrategyTool(42, 1);
    expect(tool.name).toBe("propose_tailoring_strategy");
    expect(tool.description.toLowerCase()).toMatch(/end your turn/);
  });
});
