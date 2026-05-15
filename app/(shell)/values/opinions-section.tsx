"use client";
import { useState, useTransition } from "react";
import { setIndustryOpinions } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; position: string; why: string; counterargument: string; order: number };

export function OpinionsSection({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Industry opinions"
        hasUnsavedChanges={dirty}
        actions={<Button disabled={pending} onClick={() => start(async () => { await setIndustryOpinions(items.map(({ position, why, counterargument, order }) => ({ position, why, counterargument, order }))); })}>Save</Button>}
      />
      {items.slice().sort((a, b) => a.order - b.order).map((p, i) => (
        <div key={i} className="flex items-start gap-md">
          <Input type="number" className="w-16" value={String(p.order)} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
          <div className="flex-1 flex flex-col gap-xs">
            <Textarea rows={3} placeholder="Position" value={p.position} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, position: e.target.value } : x))} />
            <Textarea rows={3} placeholder="Why" value={p.why} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, why: e.target.value } : x))} />
            <Textarea rows={3} placeholder="Counterargument" value={p.counterargument} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, counterargument: e.target.value } : x))} />
          </div>
          <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, { position: "", why: "", counterargument: "", order: items.length }])}>Add opinion</Button>
    </div>
  );
}
