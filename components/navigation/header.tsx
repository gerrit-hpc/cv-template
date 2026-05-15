import type { ReactNode } from "react";

export function Header({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="h-14 flex items-center justify-between px-2xl border-b border-border bg-bg">
      <div>
        <h1 className="text-display">{title}</h1>
        {subtitle ? <p className="text-small text-text-secondary">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-sm">{actions}</div> : null}
    </header>
  );
}
