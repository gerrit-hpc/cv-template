import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfoBanner } from "@/components/ui/info-banner";

describe("InfoBanner", () => {
  it("renders children", () => {
    render(<InfoBanner>Hello</InfoBanner>);
    expect(screen.getByText("Hello")).toBeDefined();
  });
  it("dismisses when dismissible and × clicked", () => {
    render(<InfoBanner dismissible>Hello</InfoBanner>);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("Hello")).toBeNull();
  });
});
