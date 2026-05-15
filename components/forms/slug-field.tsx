"use client";
import { useState, useEffect, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  derivedFrom?: string;
  manualOverride?: string;
};

export function SlugField({ name, defaultValue, derivedFrom, ...rest }: Props) {
  const [touched, setTouched] = useState(false);
  const [value, setValue] = useState(String(defaultValue ?? ""));
  useEffect(() => {
    if (!touched && derivedFrom) setValue(derivedFrom);
  }, [derivedFrom, touched]);
  return (
    <Input
      {...rest}
      name={name}
      className="font-mono"
      value={value}
      onChange={(e) => {
        setTouched(true);
        setValue(e.target.value);
      }}
    />
  );
}
