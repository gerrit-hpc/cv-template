import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BackLink } from "@/components/navigation/back-link";
import { SectionHeader } from "@/components/sections/section-header";

describe("BackLink", () => {
  it("renders an arrow + label and links to href", () => {
    render(<BackLink href="/experience" label="Experience" />);
    const link = screen.getByRole("link", { name: /experience/i });
    expect(link.getAttribute("href")).toBe("/experience");
    expect(link.textContent).toContain("←");
  });
});

describe("SectionHeader", () => {
  it("renders title and actions", () => {
    render(<SectionHeader title="Identity" actions={<button>Save</button>} />);
    expect(screen.getByText("Identity")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });
  it("renders dirty indicator dot when hasUnsavedChanges", () => {
    render(<SectionHeader title="X" actions={<button>Save</button>} hasUnsavedChanges />);
    expect(screen.getByLabelText("unsaved changes")).toBeDefined();
  });
});
