import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    application: { findFirst },
    chatToolCall: { create },
  },
}));

const validBrief = {
  stageContext: "Recruiter screen — 30 min phone call",
  anchorStories: [],
  questionClusters: [],
  toughQuestions: "Why are you leaving?",
  questionsToAsk: [],
  logistics: "Wear a shirt.",
};

describe("save_brief", () => {
  beforeEach(() => {
    findFirst.mockReset();
    create.mockReset();
  });

  it("rejects invalid kebab-case stageName", async () => {
    findFirst.mockResolvedValue({ id: 7 });
    const { makeSaveBriefTool } = await import("@/lib/chat/tools/writes/save-brief");
    const tool = makeSaveBriefTool(7, 1);
    const result = await tool.execute(
      { stageName: "Bad Stage Name", content: validBrief },
      { toolCallId: "x" },
    );
    expect(result).toMatchObject({ isError: true });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a pending row when stageName and content are valid", async () => {
    findFirst.mockResolvedValue({ id: 7, slug: "acme", company: "Acme", roleTitle: "Eng" });
    create.mockResolvedValue({ id: 33 });
    const { makeSaveBriefTool } = await import("@/lib/chat/tools/writes/save-brief");
    const tool = makeSaveBriefTool(7, 1);
    const result = await tool.execute(
      { stageName: "recruiter-screen", content: validBrief },
      { toolCallId: "tu_brief" },
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 7,
        toolName: "save_brief",
        toolUseId: "tu_brief",
        status: "pending",
        args: expect.objectContaining({ stageName: "recruiter-screen" }),
      }),
    });
    expect(result).toMatchObject({ proposalId: 33, status: "pending_approval" });
    expect((result as { summary: string }).summary).toMatch(/recruiter-screen/);
  });

  it("returns isError if application not found", async () => {
    findFirst.mockResolvedValue(null);
    const { makeSaveBriefTool } = await import("@/lib/chat/tools/writes/save-brief");
    const tool = makeSaveBriefTool(7, 1);
    const result = await tool.execute(
      { stageName: "recruiter-screen", content: validBrief },
      { toolCallId: "x" },
    );
    expect(result).toMatchObject({ isError: true });
  });

  it("rejects invalid content", async () => {
    findFirst.mockResolvedValue({ id: 7 });
    const { makeSaveBriefTool } = await import("@/lib/chat/tools/writes/save-brief");
    const tool = makeSaveBriefTool(7, 1);
    const result = await tool.execute(
      { stageName: "recruiter-screen", content: { stageContext: "x" } as unknown },
      { toolCallId: "x" },
    );
    expect(result).toMatchObject({ isError: true });
  });

  it("declares the canonical tool name and end-your-turn note", async () => {
    findFirst.mockResolvedValue({ id: 7 });
    const { makeSaveBriefTool } = await import("@/lib/chat/tools/writes/save-brief");
    const tool = makeSaveBriefTool(7, 1);
    expect(tool.name).toBe("save_brief");
    expect(tool.description.toLowerCase()).toMatch(/end your turn/);
  });
});
