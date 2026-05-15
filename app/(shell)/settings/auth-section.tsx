import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function AuthSection({ enabled }: { enabled: boolean }) {
  return (
    <Card>
      <CardHeader title="Authentication" />
      <CardBody className="flex flex-col gap-sm">
        <p className="text-body">Password protection is <strong className={enabled ? "text-success" : "text-text-secondary"}>{enabled ? "enabled" : "disabled"}</strong>.</p>
        {!enabled ? (
          <p className="text-small text-text-secondary">
            Set <code className="font-mono">ADMIN_PASSWORD_HASH</code> in your <code className="font-mono">.env</code> to enable. Generate a hash with <code className="font-mono">npm run hash-password</code>.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
