import type { ChatProvider } from "./types.js";

export type { ChatProvider, ChatStreamEvent } from "./types.js";

export async function getChatProvider(): Promise<ChatProvider> {
  const provider = process.env.LLM_PROVIDER;

  if (provider === "anthropic") {
    const { createAnthropicProvider } = await import("./anthropic.js");
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const model = process.env.ANTHROPIC_MODEL;
    return createAnthropicProvider(apiKey, model);
  }

  if (provider === "pi") {
    const { createPiProvider } = await import("./pi.js");
    const apiKey = process.env.PI_API_KEY!;
    const model = process.env.PI_MODEL;
    return createPiProvider(apiKey, model);
  }

  throw new Error(`Unknown LLM_PROVIDER: "${provider}". Must be "anthropic" or "pi".`);
}
