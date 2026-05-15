import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "block w-full h-8 px-md rounded-md bg-surface-raised text-text border border-border",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted",
        "aria-[invalid=true]:border-danger",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
