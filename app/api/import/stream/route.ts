import { NextResponse } from "next/server";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      let lastSeen: number | null = null;
      const interval = setInterval(async () => {
        const run = await db.importRun.findFirst({ // scopeToUser: where.userId: CURRENT_USER_ID is set explicitly
          where: { userId: CURRENT_USER_ID },
          orderBy: { startedAt: "desc" },
        });
        if (!run) return;
        if (run.id === lastSeen && run.result === "in_progress") return;
        lastSeen = run.id;
        send({
          runId: run.id,
          result: run.result,
          summary: run.summary,
          finishedAt: run.finishedAt,
        });
        if (run.result !== "in_progress") {
          clearInterval(interval);
          controller.close();
        }
      }, 500);
    },
  });
  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
