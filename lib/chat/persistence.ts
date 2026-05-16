import { db } from "@/server/data/db";

export async function loadHistory(
  applicationId: number,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const rows = await db.chatMessage.findMany({
    where: { applicationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
  return rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
}

export async function appendUserMessage(applicationId: number, content: string): Promise<void> {
  await db.chatMessage.create({ data: { applicationId, role: "user", content } });
}

export async function appendAssistantMessage(
  applicationId: number,
  content: string,
): Promise<void> {
  await db.chatMessage.create({ data: { applicationId, role: "assistant", content } });
}
