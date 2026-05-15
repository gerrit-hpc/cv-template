"use client";
import { useState, useTransition } from "react";
import { setPrinciples } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; statement: string; justification: string; order: number };

export function PrinciplesSection({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Principles"
        hasUnsavedChanges={dirty}
        actions={
          <Button
            disabled={pending}
            onClick={() => start(async () => { await setPrinciples(items.map(({ statement, justification, order }) => ({ statement, justification, order }))); })}
          >
            Save
          </Button>
        }
      />
      {items.slice().sort((a, b) => a.order - b.order).map((p, i) => (
        <div key={i} className="flex items-start gap-md">
          <Input type="number" className="w-16" value={String(p.order)} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
          <div className="flex-1 flex flex-col gap-xs">
            <Textarea rows={4} value={p.statement} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, statement: e.target.value } : x))} placeholder="Statement" />
            <Textarea rows={4} value={p.justification} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, justification: e.target.value } : x))} placeholder="Justification" />
          </div>
          <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, { statement: "", justification: "", order: items.length }])}>Add principle</Button>
    </div>
  );
}
