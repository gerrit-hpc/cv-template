import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ChatStream } from "./chat-stream";

export async function ChatPane({
  applicationId,
  applicationSlug,
}: {
  applicationId: number;
  applicationSlug: string;
}) {
  const messages = await db.chatMessage.findMany({
    where: { application: { userId: CURRENT_USER_ID, slug: applicationSlug } }, // scopeToUser: scoped via application.userId
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  return (
    <Card>
      <CardHeader title="Chat" />
      <CardBody>
        <ChatStream
          applicationId={applicationId}
          applicationSlug={applicationSlug}
          initialMessages={messages}
        />
      </CardBody>
    </Card>
  );
}
