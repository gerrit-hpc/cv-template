import type { ReactNode } from "react";

type Item = { id: string; order: number; content: ReactNode };

export function ReorderableList({ items }: { items: Item[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  return (
    <ul className="flex flex-col gap-md">
      {sorted.map((item) => (
        <li key={item.id} className="flex items-start gap-md">
          {item.content}
        </li>
      ))}
    </ul>
  );
}
