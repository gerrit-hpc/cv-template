"use client";
import { useState, useTransition } from "react";
import { setApplicationStatus } from "@/server/actions/application";
import { StatusBadge, type ApplicationStatus } from "@/components/ui/status-badge";

const STATUSES: ApplicationStatus[] = ["drafting", "applied", "interviewing", "offer", "closed"];

export function StatusDropdown({ applicationId, status }: { applicationId: number; status: ApplicationStatus }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-sm">
        <StatusBadge status={status} />
        <span className="text-text-secondary">▾</span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-sm bg-surface-overlay border border-border rounded-md p-xs flex flex-col gap-xs z-10">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={pending}
              onClick={() => start(async () => { await setApplicationStatus(applicationId, s); setOpen(false); })}
              className="text-left px-sm py-xs hover:bg-surface-raised rounded"
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
