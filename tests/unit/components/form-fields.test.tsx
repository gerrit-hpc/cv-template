import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormNumber } from "@/components/forms/form-number";
import { FormCheckbox } from "@/components/forms/form-checkbox";

describe("FormField wrappers", () => {
  it("FormField renders label, input, optional error", () => {
    render(<FormField label="Email" name="email" error="required" />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByText("required")).toBeDefined();
  });
  it("FormField links error to input via aria-describedby", () => {
    render(<FormField label="Email" name="email" error="bad" />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-describedby")).toBe("email-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
  it("FormTextarea renders label + textarea", () => {
    render(<FormTextarea label="Bio" name="bio" rows={3} />);
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).rows).toBe(3);
  });
  it("FormSelect renders options", () => {
    render(
      <FormSelect label="Type" name="type" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />,
    );
    expect((screen.getByLabelText("Type") as HTMLSelectElement).options.length).toBe(2);
  });
  it("FormNumber accepts default value", () => {
    render(<FormNumber label="Order" name="order" defaultValue={3} />);
    expect((screen.getByLabelText("Order") as HTMLInputElement).value).toBe("3");
  });
  it("FormCheckbox renders label", () => {
    render(<FormCheckbox label="Active" name="active" />);
    expect(screen.getByLabelText("Active")).toBeDefined();
  });
});
