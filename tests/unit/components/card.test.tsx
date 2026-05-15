import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

describe("Card", () => {
  it("renders children with card styling", () => {
    render(<Card data-testid="c">x</Card>);
    expect(screen.getByTestId("c").className).toContain("bg-surface");
  });
  it("CardHeader renders title and actions", () => {
    render(
      <CardHeader title="Hello" actions={<button>Save</button>} />,
    );
    expect(screen.getByText("Hello")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });
  it("CardBody renders children", () => {
    render(<CardBody data-testid="b">y</CardBody>);
    expect(screen.getByTestId("b").textContent).toBe("y");
  });
});
