import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  name: string;
  error?: string;
};

export function FormNumber({ label, name, error, className, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={name} className="text-label uppercase text-text-secondary">
        {label}
      </label>
      <Input
        type="number"
        id={name}
        name={name}
        className={className ?? "w-16"}
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
