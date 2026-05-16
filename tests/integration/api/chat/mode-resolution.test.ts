import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type StreamReplyArgs = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  system?: string;
  tools?: unknown[];
  signal?: AbortSignal;
};

const streamReplySpy = vi.fn<(input: StreamReplyArgs) => AsyncIterable<unknown>>(
  async function* () {
    yield { type: "done", finishReason: "end_turn" };
  },
);

vi.mock("@/lib/chat/providers/index", () => ({
  getChatProvider: vi.fn(async () => ({
    streamReply: (input: StreamReplyArgs) => streamReplySpy(input),
  })),
}));

vi.mock("@/server/data/db", () => ({
  db: {
    application: {
      findFirst: vi.fn(async () => ({ id: 42 })),
    },
  },
}));

vi.mock("@/lib/chat/persistence", () => ({
  loadHistory: vi.fn(async () => [{ role: "user" as const, content: "hi" }]),
  appendUserMessage: vi.fn(async () => {}),
  appendAssistantMessage: vi.fn(async () => {}),
}));

async function drainResponse(res: Response): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  // Consume stream so the route's appendAssistantMessage logic completes.
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
}

function makeRequest(body: object): Request {
  return new Request("http://test.local/api/chat/test-app", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  streamReplySpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("/api/chat/[slug] mode resolution", () => {
  it("calls provider with unfiltered tools and passes through body.system when no mode is set", async () => {
    const { POST } = await import("@/app/api/chat/[slug]/route");
    const res = await POST(makeRequest({ content: "hello", system: "BASE_SYSTEM" }), {
      params: Promise.resolve({ slug: "test-app" }),
    });
    expect(res.status).toBe(200);
    await drainResponse(res);

    expect(streamReplySpy).toHaveBeenCalledTimes(1);
    const args = streamReplySpy.mock.calls[0]![0];
    expect(args.system).toBe("BASE_SYSTEM");
    // buildKbTools(CURRENT_USER_ID) returns 6 KB tools; no mode means no filtering.
    expect(args.tools?.length).toBe(6);
  });

  it("returns 400 and never calls the provider for an unknown mode", async () => {
    const { POST } = await import("@/app/api/chat/[slug]/route");
    const res = await POST(makeRequest({ content: "hello", mode: "unknown" }), {
      params: Promise.resolve({ slug: "test-app" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Unknown mode" });
    expect(streamReplySpy).not.toHaveBeenCalled();
  });

  it("uses the mode's systemPrompt and filtered tools when a registered mode is requested", async () => {
    const modesModule = await import("@/lib/chat/modes");
    const getModeSpy = vi.spyOn(modesModule, "getMode").mockReturnValue({
      id: "x",
      label: "X",
      systemPrompt: "TEST_PROMPT",
      filterTools: (all) => all.slice(0, 2),
    });

    const { POST } = await import("@/app/api/chat/[slug]/route");
    const res = await POST(
      makeRequest({ content: "hello", system: "IGNORED_BY_MODE", mode: "x" }),
      { params: Promise.resolve({ slug: "test-app" }) },
    );
    expect(res.status).toBe(200);
    await drainResponse(res);

    expect(getModeSpy).toHaveBeenCalledWith("x");
    expect(streamReplySpy).toHaveBeenCalledTimes(1);
    const args = streamReplySpy.mock.calls[0]![0];
    expect(args.system).toBe("TEST_PROMPT");
    expect(args.tools?.length).toBe(2);
  });
});
