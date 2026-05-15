import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-md py-3xl text-center">
      <p className="text-subheading text-text">{title}</p>
      {description ? <p className="text-body text-text-secondary max-w-md">{description}</p> : null}
      {actions ? <div className="flex items-center gap-md mt-md">{actions}</div> : null}
    </div>
  );
}
