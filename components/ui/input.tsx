import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full h-8 px-md rounded-md bg-surface-raised text-text border border-border",
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
