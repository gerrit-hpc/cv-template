import type { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/select";

type Option = { value: string; label: string };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  name: string;
  options: Option[];
  error?: string;
};

export function FormSelect({ label, name, options, error, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={name} className="text-label uppercase text-text-secondary">
        {label}
      </label>
      <Select
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
