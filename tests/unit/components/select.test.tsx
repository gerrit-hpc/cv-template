import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/select";

describe("Select", () => {
  it("renders options", () => {
    render(
      <Select aria-label="s">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect((screen.getByLabelText("s") as HTMLSelectElement).options.length).toBe(2);
  });
});
