"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConfirmModal({
  open,
  title,
  description,
  confirmWord,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmWord: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  if (!open) return null;
  const canConfirm = typed === confirmWord;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70" role="dialog" aria-modal="true">
      <div className="w-[420px] bg-surface rounded-lg border border-border p-lg flex flex-col gap-md">
        <h2 className="text-heading text-danger">{title}</h2>
        {description ? <div className="text-body text-text-secondary">{description}</div> : null}
        <label className="flex flex-col gap-xs text-label text-text-secondary">
          <span>Type {confirmWord} to confirm</span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={`type ${confirmWord}`} />
        </label>
        <div className="flex items-center justify-end gap-sm">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!canConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
