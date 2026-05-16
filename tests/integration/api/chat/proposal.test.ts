import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

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

async function makeApp(slug = "acme") {
  return db.application.create({
    data: { userId: 1, slug, company: "Acme", roleTitle: "Eng", language: "en" },
  });
}

describe("chat proposal endpoints", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.chatToolCall.deleteMany();
    await db.tailoringStrategy.deleteMany();
    await db.application.deleteMany();
    // Other-user fixtures created in cross-user 404 tests; remove them so each test starts clean.
    await db.user.deleteMany({ where: { id: { not: 1 } } });
  });

  it("approve returns 404 when the proposal id does not exist", async () => {
    const { POST } = await import("@/app/api/chat/proposal/[id]/approve/route");
    const req = new Request("http://test/api/chat/proposal/9999/approve", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "9999" }) });
    expect(res.status).toBe(404);
  });

  it("approve returns 200 + commits via tailoring server action on success", async () => {
    const app = await makeApp();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "tu",
        args: validStrategy,
        status: "pending",
      },
    });

    const { POST } = await import("@/app/api/chat/proposal/[id]/approve/route");
    const req = new Request(`http://test/api/chat/proposal/${proposal.id}/approve`, {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req, { params: Promise.resolve({ id: String(proposal.id) }) });
    expect(res.status).toBe(200);

    const strategy = await db.tailoringStrategy.findUnique({ where: { applicationId: app.id } });
    expect(strategy).not.toBeNull();
  });

  it("approve returns 422 when the underlying action validation fails", async () => {
    const app = await makeApp("bad");
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "tu",
        args: { not: "valid" },
        status: "pending",
      },
    });

    const { POST } = await import("@/app/api/chat/proposal/[id]/approve/route");
    const req = new Request(`http://test/api/chat/proposal/${proposal.id}/approve`, {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req, { params: Promise.resolve({ id: String(proposal.id) }) });
    expect(res.status).toBe(422);
  });
  it("reject marks a pending proposal as rejected", async () => {
    const app = await makeApp();
    const proposal = await db.chatToolCall.create({
      data: {
        applicationId: app.id,
        toolName: "propose_tailoring_strategy",
        toolUseId: "tu",
        args: validStrategy,
        status: "pending",
      },
    });

    const { POST } = await import("@/app/api/chat/proposal/[id]/reject/route");
    const req = new Request(`http://test/api/chat/proposal/${proposal.id}/reject`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: String(proposal.id) }) });
    expect(res.status).toBe(200);

    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("rejected");
  });

  it("approve returns 404 when the proposal belongs to a different user", async () => {
    const otherUser = await db.user.create({ data: { id: 9999 } });
    const otherApp = await db.application.create({
      data: {
        userId: otherUser.id,
        slug: "other",
        company: "Other",
        roleTitle: "x",
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

    const { POST } = await import("@/app/api/chat/proposal/[id]/approve/route");
    const req = new Request(`http://test/api/chat/proposal/${proposal.id}/approve`, {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req, { params: Promise.resolve({ id: String(proposal.id) }) });
    expect(res.status).toBe(404);

    // Underlying tailoringStrategy must not have been written.
    const strategy = await db.tailoringStrategy.findUnique({ where: { applicationId: otherApp.id } });
    expect(strategy).toBeNull();
    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("pending");
  });

  it("reject returns 404 when the proposal belongs to a different user", async () => {
    const otherUser = await db.user.create({ data: { id: 8888 } });
    const otherApp = await db.application.create({
      data: {
        userId: otherUser.id,
        slug: "other-reject",
        company: "Other",
        roleTitle: "x",
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

    const { POST } = await import("@/app/api/chat/proposal/[id]/reject/route");
    const req = new Request(`http://test/api/chat/proposal/${proposal.id}/reject`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: String(proposal.id) }) });
    expect(res.status).toBe(404);

    const refreshed = await db.chatToolCall.findUnique({ where: { id: proposal.id } });
    expect(refreshed!.status).toBe("pending");
  });
});
