import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeDefined();
  });
  it("applies error styling when invalid prop is set", () => {
    render(<Input aria-invalid="true" />);
    expect(screen.getByRole("textbox").className).toContain("border-danger");
  });
  it("forwards type and value", () => {
    render(<Input type="email" defaultValue="x@y.z" />);
    const el = screen.getByRole("textbox") as HTMLInputElement;
    expect(el.type).toBe("email");
    expect(el.value).toBe("x@y.z");
  });
});
