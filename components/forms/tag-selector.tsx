"use client";
import { useState } from "react";
import { Tag } from "@/components/ui/tag";

type TagOption = { slug: string; label: string };

export function TagSelector({
  name,
  available,
  selected,
}: {
  name: string;
  available: TagOption[];
  selected: string[];
}) {
  const [picked, setPicked] = useState<string[]>(selected);
  const [open, setOpen] = useState(false);
  const remaining = available.filter((t) => !picked.includes(t.slug));
  return (
    <div className="flex flex-wrap items-center gap-xs">
      {picked.map((slug) => {
        const t = available.find((x) => x.slug === slug);
        return (
          <Tag key={slug} onRemove={() => setPicked(picked.filter((p) => p !== slug))}>
            {t?.label ?? slug}
          </Tag>
        );
      })}
      <input type="hidden" name={name} value={picked.join(",")} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-small text-text-secondary hover:text-text"
      >
        + Add tag
      </button>
      {open ? (
        <div className="absolute z-10 mt-md bg-surface-overlay border border-border rounded-md p-md flex flex-col gap-xs">
          {remaining.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => {
                setPicked([...picked, t.slug]);
                setOpen(false);
              }}
              className="text-left text-small text-text hover:bg-surface-raised px-sm py-xs rounded"
            >
              {t.label}
            </button>
          ))}
          {remaining.length === 0 ? (
            <p className="text-small text-text-tertiary">All tags selected.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
