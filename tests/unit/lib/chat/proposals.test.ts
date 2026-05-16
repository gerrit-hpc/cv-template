import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
const update = vi.fn();
const updateMany = vi.fn();
const upsertTailoringStrategy = vi.fn();
const upsertCompanyNotes = vi.fn();
const upsertInterviewPrepBrief = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    chatToolCall: { findFirst, update, updateMany },
  },
}));

vi.mock("@/server/actions/tailoring-strategy", () => ({
  upsertTailoringStrategy: (...args: unknown[]) => upsertTailoringStrategy(...args),
}));
vi.mock("@/server/actions/company-notes", () => ({
  upsertCompanyNotes: (...args: unknown[]) => upsertCompanyNotes(...args),
}));
vi.mock("@/server/actions/interview-prep-brief", () => ({
  upsertInterviewPrepBrief: (...args: unknown[]) => upsertInterviewPrepBrief(...args),
}));

beforeEach(() => {
  findFirst.mockReset();
  update.mockReset();
  updateMany.mockReset();
  upsertTailoringStrategy.mockReset();
  upsertCompanyNotes.mockReset();
  upsertInterviewPrepBrief.mockReset();
});

// Valid fixtures matching the canonical zod schemas. approveProposal now zod-validates
// up front (before dispatching), so unit-test fixtures must conform.
const validStrategy = {
  jdSummary: { mustHaves: [], niceToHaves: [], signals: [], ambiguities: [] },
  strategy: {
    headlineSummary: "ok",
    experienceOrder: [],
    skillsLead: [],
    skillsDeprioritize: [],
    coverLetterAngle: { hook: "h", body1: "b", body2: "b2", close: "c" },
  },
  gaps: [],
};
const validNotes = {
  company: { overview: "o", products: "p", recentSignals: "r", leadership: "l", reputation: "rep" },
  role: { beyondJd: "x", whyRole: "y" },
  process: { stages: [], peopleToMeet: [], logistics: "log" },
  calibration: {
    style: "mixed" as const,
    difficulty: "mid-rigorous" as const,
    tone: "formal" as const,
    justification: "j",
  },
  riskAreas: "ra",
};
const validBrief = {
  stageContext: "x",
  anchorStories: [],
  questionClusters: [],
  toughQuestions: "tq",
  questionsToAsk: [],
  logistics: "lg",
};

describe("approveProposal", () => {
  it("returns NOT_FOUND when the proposal is not under the current user", async () => {
    findFirst.mockResolvedValue(null);
    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(123);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("idempotently returns success when proposal already resolved", async () => {
    findFirst.mockResolvedValue({
      id: 7,
      applicationId: 1,
      status: "approved",
      toolName: "propose_tailoring_strategy",
      args: {},
      resolvedContent: { strategy: {} },
      resolvedAt: new Date(),
    });
    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(7);
    expect(result.ok).toBe(true);
    expect(upsertTailoringStrategy).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("dispatches propose_tailoring_strategy to upsertTailoringStrategy", async () => {
    findFirst.mockResolvedValue({
      id: 7,
      applicationId: 42,
      status: "pending",
      toolName: "propose_tailoring_strategy",
      args: validStrategy,
      resolvedContent: null,
    });
    upsertTailoringStrategy.mockResolvedValue({ ok: true, data: null });
    update.mockResolvedValue({ id: 7, status: "approved" });
    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(7);
    expect(result.ok).toBe(true);
    expect(upsertTailoringStrategy).toHaveBeenCalledWith(42, validStrategy);
    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({ status: "approved", resolvedContent: validStrategy }),
    });
  });

  it("marks status edited when editedContent diverges from args", async () => {
    findFirst.mockResolvedValue({
      id: 8,
      applicationId: 42,
      status: "pending",
      toolName: "update_company_notes",
      args: validNotes,
      resolvedContent: null,
    });
    upsertCompanyNotes.mockResolvedValue({ ok: true, data: null });
    update.mockResolvedValue({ id: 8, status: "edited" });
    const { approveProposal } = await import("@/lib/chat/proposals");
    const edited = { ...validNotes, riskAreas: "MODIFIED" };
    const result = await approveProposal(8, edited);
    expect(result.ok).toBe(true);
    expect(upsertCompanyNotes).toHaveBeenCalledWith(42, edited);
    expect(update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: expect.objectContaining({ status: "edited", resolvedContent: edited }),
    });
  });

  it("dispatches save_brief with stageName + content from args", async () => {
    findFirst.mockResolvedValue({
      id: 9,
      applicationId: 42,
      status: "pending",
      toolName: "save_brief",
      args: { stageName: "recruiter-screen", content: validBrief },
      resolvedContent: null,
    });
    upsertInterviewPrepBrief.mockResolvedValue({ ok: true, data: null });
    update.mockResolvedValue({ id: 9, status: "approved" });
    const { approveProposal } = await import("@/lib/chat/proposals");
    await approveProposal(9);
    expect(upsertInterviewPrepBrief).toHaveBeenCalledWith(42, "recruiter-screen", validBrief);
  });

  it("marks status errored when the underlying action fails (non-validation)", async () => {
    findFirst.mockResolvedValue({
      id: 10,
      applicationId: 42,
      status: "pending",
      toolName: "propose_tailoring_strategy",
      args: validStrategy,
      resolvedContent: null,
    });
    upsertTailoringStrategy.mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL", message: "Database connection lost." },
    });
    update.mockResolvedValue({ id: 10, status: "errored" });
    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
    expect(update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({ status: "errored" }),
    });
  });

  it("rejects invalid editedContent up front without mutating the proposal row", async () => {
    findFirst.mockResolvedValue({
      id: 20,
      applicationId: 42,
      status: "pending",
      toolName: "propose_tailoring_strategy",
      args: validStrategy,
      resolvedContent: null,
    });

    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(20, { totally: "not a strategy" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(upsertTailoringStrategy).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("treats edit identical to args as a plain approval (status: approved)", async () => {
    findFirst.mockResolvedValue({
      id: 21,
      applicationId: 42,
      status: "pending",
      toolName: "propose_tailoring_strategy",
      args: validStrategy,
      resolvedContent: null,
    });
    upsertTailoringStrategy.mockResolvedValue({ ok: true, data: null });
    update.mockResolvedValue({ id: 21, status: "approved" });

    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(21, JSON.parse(JSON.stringify(validStrategy)));

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: expect.objectContaining({ status: "approved" }),
    });
  });
});

describe("rejectProposal", () => {
  it("marks the proposal rejected", async () => {
    findFirst.mockResolvedValue({ id: 11, status: "pending" });
    update.mockResolvedValue({ id: 11, status: "rejected" });
    const { rejectProposal } = await import("@/lib/chat/proposals");
    const result = await rejectProposal(11);
    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: expect.objectContaining({ status: "rejected" }),
    });
  });

  it("returns NOT_FOUND if not found", async () => {
    findFirst.mockResolvedValue(null);
    const { rejectProposal } = await import("@/lib/chat/proposals");
    const result = await rejectProposal(999);
    expect(result.ok).toBe(false);
  });

  it("is idempotent on already-resolved proposals", async () => {
    findFirst.mockResolvedValue({ id: 12, status: "rejected" });
    const { rejectProposal } = await import("@/lib/chat/proposals");
    const result = await rejectProposal(12);
    expect(result.ok).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("cancelStreamProposals", () => {
  it("cancels pending rows scoped by applicationId + toolUseId set", async () => {
    updateMany.mockResolvedValue({ count: 2 });
    const { cancelStreamProposals } = await import("@/lib/chat/proposals");
    await cancelStreamProposals(42, ["toolu_a", "toolu_b"]);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        applicationId: 42,
        toolUseId: { in: ["toolu_a", "toolu_b"] },
        status: "pending",
      },
      data: expect.objectContaining({ status: "cancelled" }),
    });
  });

  it("is a no-op on empty toolUseId set", async () => {
    const { cancelStreamProposals } = await import("@/lib/chat/proposals");
    await cancelStreamProposals(42, []);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
