import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tag } from "@/components/ui/tag";

describe("Tag", () => {
  it("renders label", () => {
    render(<Tag>leadership</Tag>);
    expect(screen.getByText("leadership")).toBeDefined();
  });
  it("applies pill styling", () => {
    render(<Tag>x</Tag>);
    expect(screen.getByText("x").className).toContain("rounded-full");
  });
  it("renders a remove button when onRemove provided", () => {
    render(<Tag onRemove={() => {}}>x</Tag>);
    expect(screen.getByRole("button", { name: /remove/i })).toBeDefined();
  });
});
