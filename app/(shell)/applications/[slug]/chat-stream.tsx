"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/components/sections/markdown-preview";
import { parseSSE } from "@/lib/chat/parse-sse";
import type { ChatStreamEvent } from "@/lib/chat/providers/types";

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  streaming?: boolean;
  stopped?: boolean;
  error?: boolean;
}

export interface ChatStreamProps {
  applicationId: number;
  applicationSlug: string;
  initialMessages: Array<{
    id: number;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
  }>;
  // optional system prompt — wired by HOM-29 mode selector
  system?: string;
}

function assertNever(x: never): never {
  throw new Error(`Unexpected role: ${String(x)}`);
}

function Row({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="bg-accent-muted text-text rounded-lg px-md py-sm max-w-[80%] whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    );
  }

  if (message.role === "assistant") {
    if (message.error) {
      return (
        <div className="flex justify-start w-full">
          <div className="bg-danger-muted text-danger rounded-lg px-md py-sm w-full">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start">
        <div className="bg-surface-raised text-text rounded-lg px-md py-sm max-w-[80%]">
          {message.streaming ? (
            <span className="whitespace-pre-wrap">
              {message.content}
              <span className="animate-pulse">▍</span>
            </span>
          ) : (
            <>
              <MarkdownPreview source={message.content} />
              {message.stopped && (
                <span className="text-small text-text-secondary"> (stopped)</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return assertNever(message.role);
}

export function ChatStream({
  applicationSlug,
  initialMessages,
  system,
}: ChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: String(m.id),
        role: m.role as MessageRole,
        content: m.content,
      })),
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<"tailor" | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isPinnedToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 40;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const scrollIfPinned = useCallback(() => {
    if (isPinnedToBottom()) scrollToBottom();
  }, [isPinnedToBottom, scrollToBottom]);

  const submit = useCallback(
    async (overrideSystem?: string) => {
      const content = input.trim();
      if (!content || streaming) return;

      const userMsgId = `optimistic-${Date.now()}`;
      const assistantMsgId = `assistant-${Date.now()}`;

      setMessages((prev) => [...prev, { id: userMsgId, role: "user", content }]);
      setInput("");
      setStreaming(true);
      setTimeout(scrollToBottom, 0);

      const controller = new AbortController();
      abortRef.current = controller;

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", streaming: true },
      ]);

      try {
        const response = await fetch(`/api/chat/${applicationSlug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            ...(mode
              ? { mode }
              : (overrideSystem ?? system)
                ? { system: overrideSystem ?? system }
                : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        let accumulatedText = "";

        for await (const event of parseSSE(response.body)) {
          const e = event as ChatStreamEvent;

          if (e.type === "text_delta") {
            accumulatedText += e.text;
            const text = accumulatedText;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: text, streaming: true } : m,
              ),
            );
            scrollIfPinned();
          } else if (e.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, streaming: false } : m,
              ),
            );
            scrollIfPinned();
          } else if (e.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: e.message, streaming: false, error: true }
                  : m,
              ),
            );
          } else if (e.type === "tool_call" || e.type === "tool_result") {
            // swallowed in v1; HOM-25 renders these as confirmation cards
            console.log("chat: tool event (v1 no-op)", e.type);
          } else {
            console.log("chat: unknown event type", (e as { type: string }).type);
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          // Partial turn kept locally with (stopped) label; no DB row (server discards on abort)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, streaming: false, stopped: true } : m,
            ),
          );
        } else {
          // Pre-stream failure — roll back optimistic messages and show inline error
          setMessages((prev) =>
            prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId),
          );
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              content:
                err instanceof Error ? err.message : "Failed to send message. Please try again.",
              error: true,
            },
          ]);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, streaming, mode, applicationSlug, system, scrollToBottom, scrollIfPinned],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter inserts newline — standard chat convention
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="flex flex-col gap-md">
      <div
        ref={scrollContainerRef}
        className="max-h-[60vh] overflow-y-auto flex flex-col gap-md"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <p className="text-small text-text-secondary text-center py-lg">
            {mode === "tailor"
              ? "Paste a job description to start."
              : "Start the conversation — ask Claude to tailor your CV, research a company, or anything else."}
          </p>
        ) : (
          messages.map((m) => <Row key={m.id} message={m} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* HOM-32 interim mode toggle — replaced by HOM-29 full selector */}
      <div className="flex flex-col gap-sm">
        <div className="flex items-center gap-sm">
          <Button
            size="sm"
            variant={mode === null ? "primary" : "ghost"}
            onClick={() => setMode(null)}
            type="button"
          >
            Free chat
          </Button>
          <Button
            size="sm"
            variant={mode === "tailor" ? "primary" : "ghost"}
            onClick={() => setMode("tailor")}
            type="button"
          >
            Tailor
          </Button>
        </div>
        {mode === "tailor" && (
          <p className="text-small text-text-secondary">
            Tailor mode — Claude will read your KB, propose a tailoring strategy, and wait for
            approval.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-sm">
        <Textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Claude to tailor your CV, research a company, or anything else…"
          disabled={streaming}
          aria-label="Message input"
        />
        <div className="flex justify-end gap-sm">
          {streaming && (
            <Button variant="ghost" size="sm" onClick={stop} type="button">
              Stop
            </Button>
          )}
          <Button onClick={() => void submit()} disabled={streaming || !input.trim()} type="button">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
