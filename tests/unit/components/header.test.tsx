import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/navigation/header";

describe("Header", () => {
  it("renders title", () => {
    render(<Header title="Profile" />);
    expect(screen.getByText("Profile")).toBeDefined();
  });
  it("renders subtitle when provided", () => {
    render(<Header title="Experience" subtitle="3 roles" />);
    expect(screen.getByText("3 roles")).toBeDefined();
  });
  it("renders actions", () => {
    render(<Header title="X" actions={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
  });
});
