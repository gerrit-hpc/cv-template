import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("renders status text", () => {
    render(<StatusBadge status="applied" />);
    expect(screen.getByText(/applied/i)).toBeDefined();
  });
  it("renders a colored dot", () => {
    render(<StatusBadge status="offer" />);
    const dot = screen.getByLabelText("offer status indicator");
    expect(dot.className).toContain("bg-status-offer");
  });
  it("uses correct background for each status", () => {
    const { rerender } = render(<StatusBadge status="drafting" />);
    expect(screen.getByText(/drafting/i).className).toContain("text-status-draft");
    rerender(<StatusBadge status="closed" />);
    expect(screen.getByText(/closed/i).className).toContain("text-status-closed");
  });
});
