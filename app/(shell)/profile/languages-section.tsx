"use client";
import { useState, useTransition } from "react";
import { setLanguages } from "@/server/actions/profile";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { id?: number; name: string; proficiency: string; order: number };

export function LanguagesSection({ items: initial }: { profileId: number; items: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Languages"
        hasUnsavedChanges={dirty}
        actions={
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setLanguages(items.map(({ name, proficiency, order }) => ({ name, proficiency, order })));
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
          <div key={i} className="flex items-center gap-md">
            <Input
              value={item.name}
              onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <Input
              value={item.proficiency}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, proficiency: e.target.value } : x)))
              }
            />
            <Input
              type="number"
              value={String(item.order)}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, order: Number(e.target.value) } : x)))
              }
              className="w-16"
            />
            <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
      <Button variant="secondary" onClick={() => setItems([...items, { name: "", proficiency: "", order: items.length }])}>
        Add language
      </Button>
    </div>
  );
}
