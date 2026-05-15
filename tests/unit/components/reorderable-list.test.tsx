import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReorderableList } from "@/components/sections/reorderable-list";

describe("ReorderableList", () => {
  it("renders items in order", () => {
    render(
      <ReorderableList
        items={[
          { id: "a", order: 1, content: <span>One</span> },
          { id: "b", order: 0, content: <span>Zero</span> },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]?.textContent).toContain("Zero");
    expect(items[1]?.textContent).toContain("One");
  });
});
