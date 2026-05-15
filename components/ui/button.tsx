import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-small font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-bg hover:bg-accent-hover",
        secondary: "bg-surface-raised text-text border border-border hover:bg-surface-overlay",
        ghost: "bg-transparent text-text-secondary hover:text-text hover:bg-surface-raised",
      },
      size: {
        md: "h-8 px-md",
        sm: "h-6 px-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant, size, ...props },
  ref,
) {
  return <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />;
});
