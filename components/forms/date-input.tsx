import { forwardRef, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const DateInput = forwardRef<HTMLInputElement, Props>(function DateInput(props, ref) {
  return <Input ref={ref} placeholder="YYYY-MM" pattern="[0-9]{4}-[0-9]{2}" {...props} />;
});
