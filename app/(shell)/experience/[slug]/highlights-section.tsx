"use client";
import { useState, useTransition } from "react";
import { createHighlight, updateHighlight, deleteHighlight } from "@/server/actions/experience";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormNumber } from "@/components/forms/form-number";

type Highlight = { id: number; text: string; order: number };

export function HighlightsSection({ roleId, items }: { roleId: number; items: Highlight[] }) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function Form({ highlight, onClose }: { highlight: Highlight | null; onClose: () => void }) {
    return (
      <form
        action={(fd) =>
          start(async () => {
            const r = highlight ? await updateHighlight(highlight.id, fd) : await createHighlight(roleId, fd);
            if (r.ok) onClose();
          })
        }
        className="flex flex-col gap-md"
      >
        <FormTextarea label="Text" name="text" rows={3} defaultValue={highlight?.text ?? ""} />
        <FormNumber label="Order" name="order" defaultValue={highlight?.order ?? items.length} />
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{highlight ? "Save" : "Add"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Highlights" actions={<Button onClick={() => setAdding(true)}>Add highlight</Button>} />
      {items.map((h) => (
        <div key={h.id} className="flex items-start gap-md p-md bg-surface rounded-md border border-border">
          {editingId === h.id ? (
            <Form highlight={h} onClose={() => setEditingId(null)} />
          ) : (
            <>
              <p className="flex-1 text-body">{h.text}</p>
              <Button variant="ghost" onClick={() => setEditingId(h.id)}>Edit</Button>
              <Button variant="ghost" onClick={() => start(async () => { await deleteHighlight(h.id); })}>Delete</Button>
            </>
          )}
        </div>
      ))}
      {adding ? <Form highlight={null} onClose={() => setAdding(false)} /> : null}
    </div>
  );
}
