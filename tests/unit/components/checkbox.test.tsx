import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  it("renders an unchecked checkbox by default", () => {
    render(<Checkbox aria-label="c" />);
    expect((screen.getByLabelText("c") as HTMLInputElement).checked).toBe(false);
  });
  it("respects defaultChecked", () => {
    render(<Checkbox aria-label="c" defaultChecked />);
    expect((screen.getByLabelText("c") as HTMLInputElement).checked).toBe(true);
  });
});
