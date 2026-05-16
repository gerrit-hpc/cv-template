import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages/messages.js";
import pino from "pino";
import type { ChatProvider, ChatStreamEvent } from "./types.js";
import type { KbTool } from "@/lib/chat/tools/types.js";

const logger = pino({ name: "anthropic-provider" });

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOOL_ROUNDS = 10;

export function createAnthropicProvider(apiKey: string, model?: string): ChatProvider {
  const client = new Anthropic({ apiKey });
  const resolvedModel = model ?? DEFAULT_MODEL;

  return {
    async *streamReply({ messages, system, tools, signal }) {
      const anthropicMessages: MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const anthropicTools = tools?.length
        ? tools.map((t) => ({
            name: t.name,
            description: t.description,
            // typebox schemas are plain JSON Schema objects at runtime — type: "object" is present.
            input_schema: t.parameters as { type: "object"; [k: string]: unknown },
          }))
        : undefined;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        if (signal?.aborted) return;

        // Buffer for in-progress tool_use content blocks, keyed by block index.
        const pendingByIndex = new Map<number, { id: string; name: string; inputBuffer: string }>();

        const stream = client.messages.stream(
          {
            model: resolvedModel,
            max_tokens: 4096,
            ...(system ? { system } : {}),
            messages: anthropicMessages,
            ...(anthropicTools ? { tools: anthropicTools, tool_choice: { type: "auto" } } : {}),
          },
          { signal },
        );

        try {
          for await (const event of stream) {
            if (signal?.aborted) return;

            if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
              pendingByIndex.set(event.index, {
                id: event.content_block.id,
                name: event.content_block.name,
                inputBuffer: "",
              });
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                yield { type: "text_delta", text: event.delta.text } satisfies ChatStreamEvent;
              } else if (event.delta.type === "input_json_delta") {
                const pending = pendingByIndex.get(event.index);
                if (pending) pending.inputBuffer += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              const pending = pendingByIndex.get(event.index);
              if (pending) {
                let input: unknown;
                try {
                  input = pending.inputBuffer ? JSON.parse(pending.inputBuffer) : {};
                } catch {
                  input = {};
                }
                yield { type: "tool_call", id: pending.id, name: pending.name, input } satisfies ChatStreamEvent;
              }
            }
          }
        } catch (err) {
          if (signal?.aborted) return;
          yield {
            type: "error",
            message: err instanceof Error ? err.message : String(err),
          } satisfies ChatStreamEvent;
          return;
        }

        const finalMessage = await stream.finalMessage();

        if (finalMessage.stop_reason !== "tool_use" || pendingByIndex.size === 0) {
          yield {
            type: "done",
            finishReason: mapStopReason(finalMessage.stop_reason),
            usage: {
              inputTokens: finalMessage.usage.input_tokens,
              outputTokens: finalMessage.usage.output_tokens,
            },
          } satisfies ChatStreamEvent;
          return;
        }

        // Execute pending tool calls and collect results for the next round.
        const toolResultContent: ToolResultBlockParam[] = [];

        for (const pending of pendingByIndex.values()) {
          let parsedInput: unknown;
          try {
            parsedInput = pending.inputBuffer ? JSON.parse(pending.inputBuffer) : {};
          } catch {
            const errPayload = { error: "tool input was not valid JSON" };
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: pending.id,
              content: JSON.stringify(errPayload),
              is_error: true,
            });
            yield {
              type: "tool_result",
              id: pending.id,
              output: errPayload,
              isError: true,
            } satisfies ChatStreamEvent;
            continue;
          }

          const tool = tools?.find((t): t is KbTool => t.name === pending.name);
          if (!tool) {
            const errPayload = { error: `unknown tool: ${pending.name}` };
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: pending.id,
              content: JSON.stringify(errPayload),
              is_error: true,
            });
            yield {
              type: "tool_result",
              id: pending.id,
              output: errPayload,
              isError: true,
            } satisfies ChatStreamEvent;
            continue;
          }

          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const output = await tool.execute(parsedInput as any);
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: pending.id,
              content: JSON.stringify(output),
            });
            yield { type: "tool_result", id: pending.id, output } satisfies ChatStreamEvent;
          } catch (err) {
            const errPayload = { error: err instanceof Error ? err.message : String(err) };
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: pending.id,
              content: JSON.stringify(errPayload),
              is_error: true,
            });
            yield {
              type: "tool_result",
              id: pending.id,
              output: errPayload,
              isError: true,
            } satisfies ChatStreamEvent;
          }
        }

        // Append assistant turn + tool results to carry into the next round.
        const assistantContent = finalMessage.content.map((block) => {
          if (block.type === "tool_use") {
            return { type: "tool_use" as const, id: block.id, name: block.name, input: block.input };
          }
          if (block.type === "text") {
            return { type: "text" as const, text: block.text };
          }
          // Pass through other block types as-is (thinking, etc.).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return block as any;
        });

        anthropicMessages.push({ role: "assistant", content: assistantContent });
        anthropicMessages.push({ role: "user", content: toolResultContent });
      }

      logger.warn("Anthropic tool loop hit max round-trip cap (%d)", MAX_TOOL_ROUNDS);
      yield { type: "done", finishReason: "error" } satisfies ChatStreamEvent;
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
