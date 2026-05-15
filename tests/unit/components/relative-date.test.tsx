import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelativeDate } from "@/components/ui/relative-date";

describe("RelativeDate", () => {
  beforeAll(() => vi.useFakeTimers({ now: new Date("2026-05-15T12:00:00Z") }));
  afterAll(() => vi.useRealTimers());

  it("renders 'just now' for <1 minute ago", () => {
    render(<RelativeDate date={new Date("2026-05-15T11:59:30Z")} />);
    expect(screen.getByText(/just now/i)).toBeDefined();
  });
  it("renders minutes ago", () => {
    render(<RelativeDate date={new Date("2026-05-15T11:55:00Z")} />);
    expect(screen.getByText(/5 minutes ago/i)).toBeDefined();
  });
  it("renders hours ago", () => {
    render(<RelativeDate date={new Date("2026-05-15T09:00:00Z")} />);
    expect(screen.getByText(/3 hours ago/i)).toBeDefined();
  });
  it("renders days ago for ≥1 day", () => {
    render(<RelativeDate date={new Date("2026-05-12T12:00:00Z")} />);
    expect(screen.getByText(/3 days ago/i)).toBeDefined();
  });
});
