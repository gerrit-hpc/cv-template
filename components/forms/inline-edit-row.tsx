"use client";
import { useState, type ReactNode } from "react";

export function InlineEditRow({
  readView,
  editView,
}: {
  readView: ReactNode;
  editView: (close: () => void) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-md h-11 px-md hover:bg-surface-raised">
      {editing ? editView(() => setEditing(false)) : (
        <button type="button" onClick={() => setEditing(true)} className="w-full text-left">
          {readView}
        </button>
      )}
    </div>
  );
}
