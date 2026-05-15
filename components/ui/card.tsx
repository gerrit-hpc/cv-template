import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-surface rounded-lg border border-border", className)} {...props} />;
}

export function CardHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-lg py-md border-b border-border-subtle",
        className,
      )}
    >
      <h3 className="text-subheading">{title}</h3>
      {actions ? <div className="flex items-center gap-sm">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-lg", className)} {...props} />;
}
