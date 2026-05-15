import type { InputHTMLAttributes } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  name: string;
};

export function FormCheckbox({ label, name, ...rest }: Props) {
  return (
    <div className="inline-flex items-center gap-sm text-body">
      <Checkbox id={name} name={name} {...rest} />
      <label htmlFor={name}>{label}</label>
    </div>
  );
}
