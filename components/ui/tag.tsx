"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tag({
  children,
  onRemove,
  className,
}: {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xs bg-accent-muted text-accent rounded-full px-md text-label",
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={`remove ${typeof children === "string" ? children : "tag"}`}
          onClick={onRemove}
          className="text-text-secondary hover:text-text"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
