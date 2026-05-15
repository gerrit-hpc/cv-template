import type { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export function FormField({ label, name, error, hint, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={name} className="text-label uppercase text-text-secondary">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {hint && !error ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
