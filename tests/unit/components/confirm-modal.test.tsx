import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

describe("ConfirmModal", () => {
  it("requires typing the confirm word", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal open title="Wipe" confirmWord="DELETE" onConfirm={onConfirm} onClose={() => {}} />);
    const confirmBtn = screen.getByRole("button", { name: /confirm/i }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/type DELETE/i), { target: { value: "DELETE" } });
    expect(confirmBtn.disabled).toBe(false);
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it("returns null when closed", () => {
    render(<ConfirmModal open={false} title="x" confirmWord="X" onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.queryByText("x")).toBeNull();
  });
});
