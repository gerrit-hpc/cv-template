import type { ReactNode } from "react";

export function SectionHeader({
  title,
  actions,
  hasUnsavedChanges,
}: {
  title: string;
  actions?: ReactNode;
  hasUnsavedChanges?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-md">
      <h2 className="text-heading">{title}</h2>
      <div className="flex items-center gap-sm">
        {hasUnsavedChanges ? (
          <span aria-label="unsaved changes" className="inline-block h-2 w-2 rounded-full bg-accent" />
        ) : null}
        {actions}
      </div>
    </div>
  );
}
