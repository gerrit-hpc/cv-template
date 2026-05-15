import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });
  it("applies the primary variant by default", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");
  });
  it("applies the secondary variant", () => {
    render(<Button variant="secondary">X</Button>);
    expect(screen.getByRole("button").className).toContain("bg-surface-raised");
  });
  it("applies the ghost variant", () => {
    render(<Button variant="ghost">X</Button>);
    expect(screen.getByRole("button").className).toContain("bg-transparent");
  });
  it("forwards type and disabled props", () => {
    render(<Button type="submit" disabled>X</Button>);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.type).toBe("submit");
    expect(btn.disabled).toBe(true);
  });
});
