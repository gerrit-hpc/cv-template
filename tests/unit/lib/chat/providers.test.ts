import { describe, it, expect, vi, afterEach } from "vitest";

// Mock the adapter modules so we don't instantiate real SDK clients in unit tests.
vi.mock("@/lib/chat/providers/anthropic", () => ({
  createAnthropicProvider: vi.fn(() => ({ streamReply: vi.fn() })),
}));
vi.mock("@/lib/chat/providers/pi", () => ({
  createPiProvider: vi.fn(() => ({ streamReply: vi.fn() })),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getChatProvider", () => {
  it("returns an anthropic provider when LLM_PROVIDER=anthropic", async () => {
    process.env.LLM_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    delete process.env.ANTHROPIC_MODEL;

    const { getChatProvider } = await import("@/lib/chat/providers/index");
    const { createAnthropicProvider } = await import("@/lib/chat/providers/anthropic");

    await getChatProvider();
    expect(createAnthropicProvider).toHaveBeenCalledWith("sk-test", undefined);
  });

  it("passes ANTHROPIC_MODEL when set", async () => {
    process.env.LLM_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.ANTHROPIC_MODEL = "claude-opus-4-20250514";

    const { getChatProvider } = await import("@/lib/chat/providers/index");
    const { createAnthropicProvider } = await import("@/lib/chat/providers/anthropic");

    await getChatProvider();
    expect(createAnthropicProvider).toHaveBeenCalledWith("sk-test", "claude-opus-4-20250514");
  });

  it("returns a pi provider when LLM_PROVIDER=pi", async () => {
    process.env.LLM_PROVIDER = "pi";
    process.env.PI_API_KEY = "pi-key-123";
    delete process.env.PI_MODEL;

    const { getChatProvider } = await import("@/lib/chat/providers/index");
    const { createPiProvider } = await import("@/lib/chat/providers/pi");

    await getChatProvider();
    expect(createPiProvider).toHaveBeenCalledWith("pi-key-123", undefined);
  });

  it("throws for an unknown LLM_PROVIDER", async () => {
    process.env.LLM_PROVIDER = "unknown-provider";

    const { getChatProvider } = await import("@/lib/chat/providers/index");
    await expect(getChatProvider()).rejects.toThrow(/Unknown LLM_PROVIDER/);
  });
});
