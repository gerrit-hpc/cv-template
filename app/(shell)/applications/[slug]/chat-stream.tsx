"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/components/sections/markdown-preview";
import { parseSSE } from "@/lib/chat/parse-sse";
import type { ChatStreamEvent } from "@/lib/chat/providers/types";
import { ProposalCard, type Proposal, type ProposalStatus } from "@/components/chat/proposal-card";
import { isWriteToolName } from "@/lib/chat/tools/writes";

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  streaming?: boolean;
  stopped?: boolean;
  error?: boolean;
  createdAt: Date;
}

interface TimelineProposal extends Proposal {
  kind: "proposal";
  createdAt: Date;
}

interface TimelineMessage extends Message {
  kind: "message";
}

type TimelineEntry = TimelineMessage | TimelineProposal;

export interface ChatStreamProps {
  applicationId: number;
  applicationSlug: string;
  initialMessages: Array<{
    id: number;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
  }>;
  initialProposals?: Array<{
    id: number;
    toolUseId: string;
    toolName: string;
    args: unknown;
    status: ProposalStatus;
    resolvedContent: unknown;
    resolutionError: string | null;
    createdAt: Date;
  }>;
  // optional system prompt — wired by HOM-29 mode selector
  system?: string;
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

export function ChatStream({
  applicationSlug,
  initialMessages,
  initialProposals = [],
  system,
}: ChatStreamProps) {
  const [messages, setMessages] = useState<TimelineMessage[]>(() =>
    initialMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        kind: "message" as const,
        id: String(m.id),
        role: m.role as MessageRole,
        content: m.content,
        createdAt: new Date(m.createdAt),
      })),
  );
  const [proposals, setProposals] = useState<TimelineProposal[]>(() =>
    initialProposals.map((p) => ({
      kind: "proposal",
      id: p.id,
      toolUseId: p.toolUseId,
      toolName: p.toolName,
      args: p.args,
      status: p.status,
      resolvedContent: p.resolvedContent,
      resolutionError: p.resolutionError,
      createdAt: new Date(p.createdAt),
    })),
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<"tailor" | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const timeline = useMemo<TimelineEntry[]>(
    () =>
      [...messages, ...proposals].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    [messages, proposals],
  );

  const isPinnedToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 40;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const scrollIfPinned = useCallback(() => {
    if (isPinnedToBottom()) scrollToBottom();
  }, [isPinnedToBottom, scrollToBottom]);

  const upsertProposalByToolUseId = useCallback(
    (toolUseId: string, patch: Partial<TimelineProposal>) => {
      setProposals((prev) => {
        const idx = prev.findIndex((p) => p.toolUseId === toolUseId);
        if (idx === -1) {
          return [
            ...prev,
            {
              kind: "proposal",
              toolUseId,
              toolName: patch.toolName ?? "unknown",
              args: patch.args ?? {},
              status: "pending",
              createdAt: new Date(),
              ...patch,
            } as TimelineProposal,
          ];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch } as TimelineProposal;
        return next;
      });
    },
    [],
  );

  const submit = useCallback(
    async (overrideSystem?: string) => {
      const content = input.trim();
      if (!content || streaming) return;

      const now = new Date();
      const userMsgId = `optimistic-${now.getTime()}`;
      const assistantMsgId = `assistant-${now.getTime()}`;

      setMessages((prev) => [
        ...prev,
        { kind: "message", id: userMsgId, role: "user", content, createdAt: now },
      ]);
      setInput("");
      setStreaming(true);
      setTimeout(scrollToBottom, 0);

      const controller = new AbortController();
      abortRef.current = controller;

      const assistantCreatedAt = new Date(now.getTime() + 1);
      setMessages((prev) => [
        ...prev,
        {
          kind: "message",
          id: assistantMsgId,
          role: "assistant",
          content: "",
          streaming: true,
          createdAt: assistantCreatedAt,
        },
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
          } else if (e.type === "tool_call") {
            if (isWriteToolName(e.name)) {
              upsertProposalByToolUseId(e.id, {
                toolName: e.name,
                args: e.input,
                status: "pending",
                createdAt: new Date(),
              });
              scrollIfPinned();
            }
          } else if (e.type === "tool_result") {
            const out = e.output as { proposalId?: number } | null;
            if (out && typeof out === "object" && typeof out.proposalId === "number") {
              upsertProposalByToolUseId(e.id, { id: out.proposalId });
            }
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          // Server cancels its own in-flight proposals; mirror the state locally so the UI
          // matches what the next reload would show.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, streaming: false, stopped: true } : m,
            ),
          );
          setProposals((prev) =>
            prev.map((p) =>
              p.status === "pending" && p.createdAt >= assistantCreatedAt
                ? { ...p, status: "cancelled" }
                : p,
            ),
          );
        } else {
          setMessages((prev) =>
            prev.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId),
          );
          setMessages((prev) => [
            ...prev,
            {
              kind: "message",
              id: `error-${Date.now()}`,
              role: "assistant",
              content:
                err instanceof Error ? err.message : "Failed to send message. Please try again.",
              error: true,
              createdAt: new Date(),
            },
          ]);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, streaming, mode, applicationSlug, system, scrollToBottom, scrollIfPinned, upsertProposalByToolUseId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const onResolved = useCallback(
    (updated: Proposal) => {
      setProposals((prev) =>
        prev.map((p) =>
          (updated.id !== undefined && p.id === updated.id) || p.toolUseId === updated.toolUseId
            ? {
                ...p,
                status: updated.status,
                resolvedContent: updated.resolvedContent,
                resolutionError: updated.resolutionError,
              }
            : p,
        ),
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-md">
      <div
        ref={scrollContainerRef}
        className="max-h-[60vh] overflow-y-auto flex flex-col gap-md"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {timeline.length === 0 ? (
          <p className="text-small text-text-secondary text-center py-lg">
            {mode === "tailor"
              ? "Paste a job description to start."
              : "Start the conversation — ask Claude to tailor your CV, research a company, or anything else."}
          </p>
        ) : (
          timeline.map((entry) => {
            if (entry.kind === "message") {
              return <Row key={`m-${entry.id}`} message={entry} />;
            }
            return (
              <ProposalCard
                key={`p-${entry.toolUseId}`}
                proposal={entry}
                onResolved={onResolved}
              />
            );
          })
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
