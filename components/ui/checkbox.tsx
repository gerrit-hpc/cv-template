import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded-sm bg-surface-raised border border-border accent-accent",
        "focus:outline-none focus:ring-2 focus:ring-accent-muted",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
