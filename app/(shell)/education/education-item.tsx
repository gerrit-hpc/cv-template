"use client";
import { useState, useTransition } from "react";
import { deleteEducationEntry } from "@/server/actions/education";
import { Button } from "@/components/ui/button";
import { EducationForm, type EducationEntry } from "./education-form";

export function EducationItem({ entry }: { entry: EducationEntry }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  if (editing) return <EducationForm entry={entry} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />;
  return (
    <div className="flex items-start justify-between gap-md">
      <div>
        <p className="text-body"><strong>{entry.name}</strong>{entry.institution ? ` — ${entry.institution}` : ""}</p>
        {entry.field ? <p className="text-small text-text-secondary">{entry.field}</p> : null}
        <p className="text-small text-text-secondary">{entry.startDate ?? "?"} — {entry.endDate ?? "?"}</p>
        {entry.notes ? <p className="text-small text-text-secondary">{entry.notes}</p> : null}
      </div>
      <div className="flex gap-sm">
        <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
        <Button variant="ghost" disabled={pending} onClick={() => start(async () => { await deleteEducationEntry(entry.id); })}>Delete</Button>
      </div>
    </div>
  );
}
