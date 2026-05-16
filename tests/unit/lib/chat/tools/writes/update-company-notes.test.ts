import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    application: { findFirst },
    chatToolCall: { create },
  },
}));

const validNotes = {
  company: { overview: "OK", products: "p", recentSignals: "r", leadership: "l", reputation: "rep" },
  role: { beyondJd: "x", whyRole: "y" },
  process: { stages: [], peopleToMeet: [], logistics: "logs" },
  calibration: {
    style: "mixed" as const,
    difficulty: "mid-rigorous" as const,
    tone: "formal" as const,
    justification: "j",
  },
  riskAreas: "ra",
};

describe("update_company_notes", () => {
  beforeEach(() => {
    findFirst.mockReset();
    create.mockReset();
  });

  it("scopes lookup and creates pending row on success", async () => {
    findFirst.mockResolvedValue({ id: 11, slug: "acme", company: "Acme", roleTitle: "Eng" });
    create.mockResolvedValue({ id: 55 });
    const { makeUpdateCompanyNotesTool } = await import(
      "@/lib/chat/tools/writes/update-company-notes"
    );
    const tool = makeUpdateCompanyNotesTool(11, 1);
    const result = await tool.execute({ content: validNotes }, { toolCallId: "tu_a" });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 11, userId: 1 } }),
    );
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 11,
        toolName: "update_company_notes",
        toolUseId: "tu_a",
        status: "pending",
      }),
    });
    expect(result).toMatchObject({ proposalId: 55, status: "pending_approval" });
  });

  it("rejects invalid content with isError", async () => {
    findFirst.mockResolvedValue({ id: 11 });
    const { makeUpdateCompanyNotesTool } = await import(
      "@/lib/chat/tools/writes/update-company-notes"
    );
    const tool = makeUpdateCompanyNotesTool(11, 1);
    const result = await tool.execute(
      { content: { company: { overview: "ok" } } as unknown },
      { toolCallId: "t" },
    );
    expect(result).toMatchObject({ isError: true });
  });

  it("returns isError if application not found", async () => {
    findFirst.mockResolvedValue(null);
    const { makeUpdateCompanyNotesTool } = await import(
      "@/lib/chat/tools/writes/update-company-notes"
    );
    const tool = makeUpdateCompanyNotesTool(11, 1);
    const result = await tool.execute({ content: validNotes }, { toolCallId: "t" });
    expect(result).toMatchObject({ isError: true });
  });

  it("declares the canonical tool name and end-your-turn note", async () => {
    findFirst.mockResolvedValue({ id: 11 });
    const { makeUpdateCompanyNotesTool } = await import(
      "@/lib/chat/tools/writes/update-company-notes"
    );
    const tool = makeUpdateCompanyNotesTool(11, 1);
    expect(tool.name).toBe("update_company_notes");
    expect(tool.description.toLowerCase()).toMatch(/end your turn/);
  });
});
