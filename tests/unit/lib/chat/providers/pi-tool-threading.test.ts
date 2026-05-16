import { describe, it, expect, vi } from "vitest";
import { Type } from "typebox";
import type { KbTool } from "@/lib/chat/tools/types";

// Mock the pi packages so importing the module doesn't try to network.
const subscribeMock = vi.fn();
const promptMock = vi.fn().mockResolvedValue(undefined);
let capturedTools: Array<{ name: string; execute: (callId: string, args: unknown) => Promise<unknown> }> = [];

vi.mock("@earendil-works/pi-agent-core", () => ({
  Agent: function MockAgent(opts: { initialState: { tools: typeof capturedTools } }) {
    capturedTools = opts.initialState.tools;
    return { subscribe: subscribeMock, prompt: promptMock };
  },
}));

vi.mock("@earendil-works/pi-ai", () => ({
  getModel: vi.fn(() => ({ api: { id: "test-api" }, provider: "anthropic", id: "claude-test" })),
}));

describe("pi adapter threads toolCallId into KbTool.execute", () => {
  it("passes the pi callId as ctx.toolCallId", async () => {
    let received: { args: unknown; ctx: { toolCallId: string } | undefined } | undefined;

    const kbTool: KbTool<ReturnType<typeof Type.Object>> = {
      name: "spy_tool",
      description: "captures ctx",
      parameters: Type.Object({}),
      execute: async (args, ctx) => {
        received = { args, ctx };
        return { result: "ok" };
      },
    };

    const { createPiProvider } = await import("@/lib/chat/providers/pi");
    const provider = createPiProvider("pi-test-key");

    // Trigger streamReply to construct the Agent and register tools.
    const iter = provider.streamReply({
      messages: [{ role: "user", content: "hello" }],
      tools: [kbTool],
    });
    // Step the generator once so it constructs the Agent and registers tools.
    // The next() call will block on the queue.wait() — we race it against a microtask.
    const stepPromise = iter[Symbol.asyncIterator]().next();
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    void stepPromise;

    expect(capturedTools).toHaveLength(1);

    const piTool = capturedTools[0];
    if (!piTool) throw new Error("Pi tool was not registered");
    await piTool.execute("call_abc_999", { some: "args" });

    expect(received).toBeDefined();
    expect(received!.args).toEqual({ some: "args" });
    expect(received!.ctx).toEqual({ toolCallId: "call_abc_999" });
  });
});
