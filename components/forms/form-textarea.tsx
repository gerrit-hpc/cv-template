import type { TextareaHTMLAttributes, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export function FormTextarea({ label, name, error, hint, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={name} className="text-label uppercase text-text-secondary">
        {label}
      </label>
      <Textarea
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
