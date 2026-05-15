import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "@/components/sections/markdown-preview";

describe("MarkdownPreview", () => {
  it("renders headings and paragraphs", () => {
    render(<MarkdownPreview source={"# Hi\n\nbody"} />);
    expect(screen.getByRole("heading", { name: "Hi" })).toBeDefined();
    expect(screen.getByText("body")).toBeDefined();
  });
  it("supports GFM tables", () => {
    render(<MarkdownPreview source={"| a | b |\n|---|---|\n| 1 | 2 |\n"} />);
    expect(screen.getByRole("table")).toBeDefined();
  });
  it("sanitizes html", () => {
    render(<MarkdownPreview source={"<script>alert(1)</script>hello"} />);
    expect(screen.queryByText("alert(1)")).toBeNull();
  });
});
