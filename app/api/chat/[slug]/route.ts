import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { getChatProvider } from "@/lib/chat/providers/index";
import { loadHistory, appendUserMessage, appendAssistantMessage } from "@/lib/chat/persistence";
import { buildKbTools } from "@/lib/chat/tools/kb/index";
import { buildWriteTools, isWriteToolName } from "@/lib/chat/tools/writes/index";
import { cancelStreamProposals } from "@/lib/chat/proposals";
import { getMode } from "@/lib/chat/modes";

const BodySchema = z.object({
  content: z.string().min(1),
  system: z.string().optional(),
  mode: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const app = await db.application.findFirst({ // scopeToUser: userId = CURRENT_USER_ID
    where: { userId: CURRENT_USER_ID, slug },
    select: { id: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { content, system, mode } = body.data;

  const requestedMode = mode ? getMode(mode) : null;
  if (mode && !requestedMode) {
    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  }

  await appendUserMessage(app.id, content);
  const history = await loadHistory(app.id);

  // If client disconnects mid-stream, we abort the provider and discard the partial turn.
  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  const provider = await getChatProvider();
  // KB tools provide read access to the user's profile/experience/etc. Write tools
  // surface as approval proposals (ChatToolCall rows); each pending row is durable
  // and the model only sees a `{ proposalId, status: "pending_approval" }` ack.
  // Tool payloads stream to the client but are not persisted to ChatMessage in v1.
  const allTools = [
    ...buildKbTools(CURRENT_USER_ID), // scopeToUser: CURRENT_USER_ID
    ...buildWriteTools(app.id, CURRENT_USER_ID), // scopeToUser: applicationId verified above + CURRENT_USER_ID
  ];
  const tools = requestedMode ? requestedMode.filterTools(allTools) : allTools;
  const systemPrompt = requestedMode ? requestedMode.systemPrompt : system;
  const events = provider.streamReply({
    messages: history,
    system: systemPrompt,
    tools,
    signal: abortController.signal,
  });

  const encoder = new TextEncoder();
  let accumulated = "";
  // Track write-tool tool_use IDs (not numeric proposalIds): tool_call events fire BEFORE the
  // tool's execute() runs, so the toolUseId is recorded even if abort lands between yield and
  // the next loop iteration. cancelStreamProposals queries by this set against the DB.
  const streamToolUseIds: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        for await (const event of events) {
          if (req.signal.aborted) break;
          send(event);
          if (event.type === "text_delta") accumulated += event.text;
          if (event.type === "tool_call" && isWriteToolName(event.name)) {
            streamToolUseIds.push(event.id);
          }
        }
      } catch {
        // Swallow errors after abort; they're already emitted as error events by adapters.
      }

      if (!req.signal.aborted && accumulated) {
        await appendAssistantMessage(app.id, accumulated);
      }

      if (req.signal.aborted) {
        // Cancel any proposals this stream created so the UI doesn't leave stale pending cards.
        await cancelStreamProposals(app.id, streamToolUseIds);
      }

      controller.close();
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
