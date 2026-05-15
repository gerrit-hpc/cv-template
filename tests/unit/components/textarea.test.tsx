import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renders with rows prop", () => {
    render(<Textarea rows={6} aria-label="t" />);
    expect((screen.getByLabelText("t") as HTMLTextAreaElement).rows).toBe(6);
  });
  it("applies error styling when invalid", () => {
    render(<Textarea aria-invalid="true" aria-label="t" />);
    expect(screen.getByLabelText("t").className).toContain("border-danger");
  });
});
