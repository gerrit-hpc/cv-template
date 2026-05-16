import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { getChatProvider } from "@/lib/chat/providers/index";
import { loadHistory, appendUserMessage, appendAssistantMessage } from "@/lib/chat/persistence";

const BodySchema = z.object({
  content: z.string().min(1),
  system: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const app = await db.application.findFirst({
    where: { userId: CURRENT_USER_ID, slug },
    select: { id: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const { content, system } = body.data;
  await appendUserMessage(app.id, content);
  const history = await loadHistory(app.id);

  // If client disconnects mid-stream, we abort the provider and discard the partial turn.
  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  const provider = await getChatProvider();
  const events = provider.streamReply({ messages: history, system, signal: abortController.signal });

  const encoder = new TextEncoder();
  let accumulated = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        for await (const event of events) {
          if (req.signal.aborted) break;
          send(event);
          if (event.type === "text_delta") accumulated += event.text;
        }
      } catch {
        // Swallow errors after abort; they're already emitted as error events by adapters.
      }

      if (!req.signal.aborted && accumulated) {
        await appendAssistantMessage(app.id, accumulated);
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
