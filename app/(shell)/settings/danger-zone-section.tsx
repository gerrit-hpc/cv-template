"use client";
import { useState, useTransition } from "react";
import { wipeAllData } from "@/server/actions/settings";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DangerZoneSection() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Card className="border-l-2 border-l-danger">
      <CardHeader title={<span className="text-danger">Danger zone</span>} />
      <CardBody className="flex flex-col gap-md">
        <p className="text-body">Wipe all data — delete all knowledge base and application data. This cannot be undone.</p>
        <div>
          <Button variant="secondary" className="border-danger text-danger" onClick={() => setOpen(true)}>
            Wipe all data
          </Button>
        </div>
        <ConfirmModal
          open={open}
          title="Wipe all data?"
          description="All KB and application data will be deleted. This cannot be undone."
          confirmWord="DELETE"
          onConfirm={() => start(async () => { await wipeAllData(); setOpen(false); })}
          onClose={() => setOpen(false)}
        />
      </CardBody>
    </Card>
  );
}
