import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No items" description="Add one." />);
    expect(screen.getByText("No items")).toBeDefined();
    expect(screen.getByText("Add one.")).toBeDefined();
  });
  it("renders actions when provided", () => {
    render(<EmptyState title="x" actions={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
  });
});
