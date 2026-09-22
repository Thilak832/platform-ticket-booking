import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PasswordInput from "./PasswordInput";

describe("PasswordInput", () => {
  it("masks the value by default", () => {
    render(<PasswordInput value="secret" onChange={() => {}} name="password" />);
    expect(screen.getByDisplayValue("secret")).toHaveAttribute("type", "password");
  });

  it("reveals the value as plain text when the toggle is clicked", () => {
    render(<PasswordInput value="secret" onChange={() => {}} name="password" />);
    fireEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(screen.getByDisplayValue("secret")).toHaveAttribute("type", "text");
  });

  it("re-masks the value when the toggle is clicked twice", () => {
    render(<PasswordInput value="secret" onChange={() => {}} name="password" />);
    const toggle = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(screen.getByDisplayValue("secret")).toHaveAttribute("type", "password");
  });

  it("calls onChange when the user types", () => {
    const handleChange = vi.fn();
    const { container } = render(<PasswordInput value="" onChange={handleChange} name="password" />);
    const input = container.querySelector('input[name="password"]');
    fireEvent.change(input, { target: { value: "abc" } });
    expect(handleChange).toHaveBeenCalled();
  });
});
