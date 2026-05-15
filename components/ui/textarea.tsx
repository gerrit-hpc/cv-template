import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "block w-full px-md py-sm rounded-md bg-surface-raised text-text border border-border resize-y",
        "placeholder:text-text-tertiary",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted",
        "aria-[invalid=true]:border-danger",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});
