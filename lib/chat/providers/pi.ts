// NOTE: The issue description referenced createAgentSession() from @earendil-works/pi-coding-agent,
// but that package is a full CLI session with filesystem tools and complex session management.
// For this stateless streaming API endpoint, we use Agent from @earendil-works/pi-agent-core
// directly, which provides the same text streaming via subscribe() without the overhead.
import { Agent } from "@earendil-works/pi-agent-core";
import type { AgentMessage, AgentTool } from "@earendil-works/pi-agent-core";
import { getModel } from "@earendil-works/pi-ai";
import type { ChatProvider, ChatStreamEvent } from "./types.js";
import type { KbTool } from "@/lib/chat/tools/types.js";

const DEFAULT_MODEL_SPEC = "anthropic:claude-sonnet-4-5-20250929";

// Placeholder usage for history messages where token counts are unavailable.
const ZERO_USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
} as const;

function kbToolToPiTool(tool: KbTool): AgentTool {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    label: tool.name,
    executionMode: "parallel",
    execute: async (_toolCallId, args) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const out = await tool.execute(args as any);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(out) }],
          details: out,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: msg }) }],
          details: { error: msg },
          // Pi's AgentToolResult does not have isError; encode it in the content instead.
          // The loop emits isError: false here; the model reads the JSON error payload.
        };
      }
    },
  };
}

export function createPiProvider(apiKey: string, modelSpec?: string): ChatProvider {
  const spec = modelSpec ?? DEFAULT_MODEL_SPEC;
  const colonIdx = spec.indexOf(":");
  const providerName = colonIdx >= 0 ? spec.slice(0, colonIdx) : "anthropic";
  const modelId = colonIdx >= 0 ? spec.slice(colonIdx + 1) : spec;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = getModel(providerName as any, modelId as any);

  return {
    async *streamReply({ messages, system, tools, signal }) {
      const historyMessages: AgentMessage[] = messages.slice(0, -1).map((m, i) => {
        if (m.role === "user") {
          return { role: "user" as const, content: m.content, timestamp: i };
        }
        // Reconstruct a minimal AssistantMessage for history replay.
        // Token counts are unknown for stored messages; zeros are used as placeholders.
        // Tool-use history is not reconstructed — the DB never stored tool_use content blocks in v1.
        return {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: m.content }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          api: model.api as any,
          provider: model.provider,
          model: model.id,
          usage: ZERO_USAGE,
          stopReason: "stop" as const,
          timestamp: i,
        };
      });

      const piTools: AgentTool[] = (tools ?? []).map(kbToolToPiTool);

      const agent = new Agent({
        initialState: {
          systemPrompt: system ?? "",
          model,
          messages: historyMessages,
          tools: piTools,
        },
        getApiKey: () => apiKey,
      });

      // Queue-based bridge from push events to pull async iterable.
      const queue: Array<ChatStreamEvent | null> = [];
      let resolve: (() => void) | null = null;

      const push = (event: ChatStreamEvent | null) => {
        queue.push(event);
        resolve?.();
        resolve = null;
      };

      const wait = () => new Promise<void>((r) => { resolve = r; });

      agent.subscribe((event) => {
        if (event.type === "message_update") {
          const ae = event.assistantMessageEvent;
          if (ae.type === "text_delta") {
            push({ type: "text_delta", text: ae.delta });
          }
        } else if (event.type === "tool_execution_start") {
          push({ type: "tool_call", id: event.toolCallId, name: event.toolName, input: event.args });
        } else if (event.type === "tool_execution_end") {
          push({
            type: "tool_result",
            id: event.toolCallId,
            output: event.result,
            isError: event.isError,
          });
        } else if (event.type === "agent_end") {
          push({ type: "done", finishReason: "end_turn" });
          push(null); // sentinel: stream finished
        }
      });

      const lastMessage = messages[messages.length - 1];
      const promptPromise = agent.prompt(lastMessage?.content ?? "");

      promptPromise.catch((err: unknown) => {
        if (!signal?.aborted) {
          push({ type: "error", message: err instanceof Error ? err.message : String(err) });
          push(null);
        }
      });

      while (true) {
        if (signal?.aborted) return;

        if (queue.length === 0) {
          await wait();
        }

        while (queue.length > 0) {
          const item = queue.shift()!;
          if (item === null) return;
          yield item;
        }
      }
    },
  };
}
