"use client";
import { useState, type ReactNode } from "react";

export function InfoBanner({ children, dismissible }: { children: ReactNode; dismissible?: boolean }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="flex items-start justify-between gap-md p-md rounded-md bg-accent-muted/40 border border-accent-muted text-body">
      <div>{children}</div>
      {dismissible ? (
        <button
          type="button"
          aria-label="dismiss"
          onClick={() => setVisible(false)}
          className="text-text-secondary hover:text-text"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
