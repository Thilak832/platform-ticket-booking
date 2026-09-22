import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import BackButton from "./BackButton";

describe("BackButton", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the default label", () => {
    render(<BackButton />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    render(<BackButton label="Home" />);
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
  });

  it("navigates to an explicit `to` route when provided, ignoring history", () => {
    render(<BackButton to="/stations" fallback="/" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith("/stations");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("goes back in history when history exists", () => {
    const originalLength = window.history.length;
    Object.defineProperty(window.history, "length", { value: 2, configurable: true });

    render(<BackButton fallback="/" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);

    Object.defineProperty(window.history, "length", { value: originalLength, configurable: true });
  });

  it("falls back to the fallback route when there is no history to go back to", () => {
    const originalLength = window.history.length;
    Object.defineProperty(window.history, "length", { value: 1, configurable: true });

    render(<BackButton fallback="/stations" />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith("/stations");

    Object.defineProperty(window.history, "length", { value: originalLength, configurable: true });
  });
});
