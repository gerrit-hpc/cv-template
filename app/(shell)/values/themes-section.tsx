"use client";
import { useState, useTransition } from "react";
import { setLinkedInThemes } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; text: string; order: number };

export function ThemesSection({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="LinkedIn themes"
        hasUnsavedChanges={dirty}
        actions={<Button disabled={pending} onClick={() => start(async () => { await setLinkedInThemes(items.map(({ text, order }) => ({ text, order }))); })}>Save</Button>}
      />
      {items.slice().sort((a, b) => a.order - b.order).map((p, i) => (
        <div key={i} className="flex items-start gap-md">
          <Input type="number" className="w-16" value={String(p.order)} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
          <Textarea rows={4} className="flex-1" value={p.text} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
          <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, { text: "", order: items.length }])}>Add theme</Button>
    </div>
  );
}
