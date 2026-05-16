import type { KbTool } from "@/lib/chat/tools/types.js";

export type { KbTool };

export interface ChatProvider {
  streamReply(input: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    system?: string;
    tools?: KbTool[];
    signal?: AbortSignal;
  }): AsyncIterable<ChatStreamEvent>;
}

export type ChatStreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; output: unknown; isError?: boolean }
  | {
      type: "done";
      finishReason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "error";
      usage?: { inputTokens?: number; outputTokens?: number };
    }
  | { type: "error"; message: string };
