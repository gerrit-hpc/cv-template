import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

async function makeApplication(slug = "acme-eng") {
  return db.application.create({
    data: {
      userId: 1,
      slug,
      company: "Acme",
      roleTitle: "Engineer",
      language: "en",
    },
  });
}

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
  company: { overview: "o", products: "p", recentSignals: "r", leadership: "l", reputation: "r" },
  role: { beyondJd: "b", whyRole: "w" },
  process: { stages: [], peopleToMeet: [], logistics: "log" },
  calibration: {
    style: "mixed" as const,
    difficulty: "mid-rigorous" as const,
    tone: "formal" as const,
    justification: "j",
  },
  riskAreas: "r",
};

const validBrief = {
  stageContext: "ctx",
  anchorStories: [],
  questionClusters: [],
  toughQuestions: "tq",
  questionsToAsk: [],
  logistics: "lg",
};

describe("chat proposals", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.chatToolCall.deleteMany();
    await db.tailoringStrategy.deleteMany();
    await db.companyNotes.deleteMany();
    await db.interviewPrepBrief.deleteMany();
    await db.application.deleteMany();
  });

  it("approveProposal dispatches propose_tailoring_strategy through the server action", async () => {
    const app = await makeApplication();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "toolu_abc",
        args: validStrategy,
        status: "pending",
      },
    });

    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(proposal.id);
    expect(result.ok).toBe(true);

    const strategy = await db.tailoringStrategy.findUnique({ where: { applicationId: app.id } });
    expect(strategy).not.toBeNull();
    expect(
      (strategy!.content as { strategy: { headlineSummary: string } }).strategy.headlineSummary,
    ).toBe("ok");

    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("approved");
    expect(refreshed!.resolvedAt).not.toBeNull();
  });

  it("approveProposal with editedContent commits the edited payload and marks status edited", async () => {
    const app = await makeApplication();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "update_company_notes",
        toolUseId: "tu",
        args: validNotes,
        status: "pending",
      },
    });

    const edited = { ...validNotes, riskAreas: "EDITED!" };
    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(proposal.id, edited);
    expect(result.ok).toBe(true);

    const notes = await db.companyNotes.findUnique({ where: { applicationId: app.id } });
    expect((notes!.content as { riskAreas: string }).riskAreas).toBe("EDITED!");

    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("edited");
    expect((refreshed!.resolvedContent as { riskAreas: string }).riskAreas).toBe("EDITED!");
  });

  it("approveProposal save_brief upserts a brief at the proposed stageName", async () => {
    const app = await makeApplication();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "save_brief",
        toolUseId: "tu",
        args: { stageName: "recruiter-screen", content: validBrief },
        status: "pending",
      },
    });
    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(proposal.id);
    expect(result.ok).toBe(true);

    const brief = await db.interviewPrepBrief.findUnique({
      where: { applicationId_stageName: { applicationId: app.id, stageName: "recruiter-screen" } },
    });
    expect(brief).not.toBeNull();
  });

  it("approveProposal rejects invalid edited content with VALIDATION_FAILED and leaves the row pending so retries stay open", async () => {
    const app = await makeApplication();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "tu",
        args: validStrategy,
        status: "pending",
      },
    });

    const { approveProposal } = await import("@/lib/chat/proposals");
    const result = await approveProposal(proposal.id, { totally: "wrong shape" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");

    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("pending");
    expect(refreshed!.resolvedAt).toBeNull();

    // A subsequent valid retry must commit successfully — proves the row was not bricked.
    const retry = await approveProposal(proposal.id, validStrategy);
    expect(retry.ok).toBe(true);
    const finalRow = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(finalRow!.status).toBe("approved");
  });

  it("rejectProposal marks status rejected and leaves the underlying table untouched", async () => {
    const app = await makeApplication();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "tu",
        args: validStrategy,
        status: "pending",
      },
    });

    const { rejectProposal } = await import("@/lib/chat/proposals");
    await rejectProposal(proposal.id);

    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("rejected");
    const strategy = await db.tailoringStrategy.findUnique({ where: { applicationId: app.id } });
    expect(strategy).toBeNull();
  });

  it("cancelStreamProposals only cancels pending rows scoped by applicationId + toolUseId", async () => {
    const app = await makeApplication();
    const pending = await db.chatToolCall.create({
      data: { applicationId: app.id, toolName: "save_brief", toolUseId: "toolu_pending", args: {}, status: "pending" },
    });
    const approved = await db.chatToolCall.create({
      data: { applicationId: app.id, toolName: "save_brief", toolUseId: "toolu_approved", args: {}, status: "approved" },
    });

    const { cancelStreamProposals } = await import("@/lib/chat/proposals");
    await cancelStreamProposals(app.id, ["toolu_pending", "toolu_approved"]);

    const p1 = await db.chatToolCall.findUnique({ where: { id: pending.id } });
    const p2 = await db.chatToolCall.findUnique({ where: { id: approved.id } });
    expect(p1!.status).toBe("cancelled");
    expect(p2!.status).toBe("approved");
  });

  it("loadProposalScopedToCurrentUser does not return proposals from other users", async () => {
    const otherUser = await db.user.create({ data: { id: 9999 } });
    const otherApp = await db.application.create({
      data: {
        userId: otherUser.id,
        slug: "other-app",
        company: "Other",
        roleTitle: "X",
        language: "en",
      },
    });
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: otherApp.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "tu",
        args: validStrategy,
        status: "pending",
      },
    });

    const { loadProposalScopedToCurrentUser } = await import("@/lib/chat/proposals");
    const row = await loadProposalScopedToCurrentUser(proposal.id);
    expect(row).toBeNull();
  });
});
