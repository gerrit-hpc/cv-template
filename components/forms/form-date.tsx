import type { InputHTMLAttributes } from "react";
import { DateInput } from "@/components/forms/date-input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
};

export function FormDate({ label, name, error, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={name} className="text-label uppercase text-text-secondary">
        {label}
      </label>
      <DateInput
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
