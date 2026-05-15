import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeftRail } from "@/components/navigation/left-rail";

vi.mock("next/navigation", () => ({ usePathname: () => "/experience" }));

describe("LeftRail", () => {
  it("renders all primary nav items", () => {
    render(<LeftRail />);
    for (const label of ["Profile", "Experience", "Skills", "Education", "Values", "Applications", "Settings"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });
  it("marks the active item based on usePathname", () => {
    render(<LeftRail />);
    const active = screen.getByText("Experience").closest("a");
    expect(active?.className).toContain("bg-surface-raised");
  });
});
