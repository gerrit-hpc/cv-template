"use client";
import { useState, useTransition } from "react";
import { setKeyQualifications } from "@/server/actions/profile";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; text: string; order: number };

export function KeyQualificationsSection({ items: initial }: { profileId: number; items: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Key qualifications"
        hasUnsavedChanges={dirty}
        actions={
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setKeyQualifications(items.map(({ text, order }) => ({ text, order })));
              })
            }
          >
            {pending ? "Saving..." : "Save"}
          </Button>
        }
      />
      {items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item, i) => (
          <div key={i} className="flex items-start gap-md">
            <Input
              type="number"
              value={String(item.order)}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, order: Number(e.target.value) } : x)))
              }
              className="w-16"
            />
            <Textarea
              rows={3}
              value={item.text}
              onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            />
            <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
      <Button variant="secondary" onClick={() => setItems([...items, { text: "", order: items.length }])}>
        Add qualification
      </Button>
    </div>
  );
}
