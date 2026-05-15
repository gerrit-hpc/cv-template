import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function ChatPane() {
  return (
    <Card className="border-dashed">
      <CardHeader title={<span className="flex items-center gap-sm">Chat <span className="px-sm py-xs rounded-full bg-warning-muted text-warning text-label">Soon</span></span>} />
      <CardBody>
        <p className="text-small text-text-secondary text-center py-lg">Conversational workflow lands in sub-project 2.</p>
      </CardBody>
    </Card>
  );
}
