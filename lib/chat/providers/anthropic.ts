import Anthropic from "@anthropic-ai/sdk";
import type { ChatProvider, ChatStreamEvent } from "./types.js";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export function createAnthropicProvider(apiKey: string, model?: string): ChatProvider {
  const client = new Anthropic({ apiKey });
  const resolvedModel = model ?? DEFAULT_MODEL;

  return {
    async *streamReply({ messages, system, signal }) {
      const stream = client.messages.stream(
        {
          model: resolvedModel,
          max_tokens: 4096,
          ...(system ? { system } : {}),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        },
        { signal },
      );

      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            yield { type: "text_delta", text: event.delta.text } satisfies ChatStreamEvent;
          }
        }

        const finalMessage = await stream.finalMessage();
        yield {
          type: "done",
          finishReason: mapStopReason(finalMessage.stop_reason),
          usage: {
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
          },
        } satisfies ChatStreamEvent;
      } catch (err) {
        if (signal?.aborted) return;
        yield {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        } satisfies ChatStreamEvent;
      }
    },
  };
}

function mapStopReason(
  reason: string | null,
): "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "error" {
  switch (reason) {
    case "end_turn":
      return "end_turn";
    case "max_tokens":
      return "max_tokens";
    case "stop_sequence":
      return "stop_sequence";
    case "tool_use":
      return "tool_use";
    default:
      return "error";
  }
}
