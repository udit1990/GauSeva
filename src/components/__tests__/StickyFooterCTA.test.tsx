import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyFooterCTA from "../StickyFooterCTA";

describe("StickyFooterCTA", () => {
  it("renders label text", () => {
    render(<StickyFooterCTA label="Proceed to Pay" />);
    expect(screen.getByText("Proceed to Pay")).toBeInTheDocument();
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<StickyFooterCTA label="Pay" onClick={onClick} />);
    fireEvent.click(screen.getByText("Pay"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("respects disabled prop", () => {
    render(<StickyFooterCTA label="Pay" disabled />);
    expect(screen.getByText("Pay").closest("button")).toBeDisabled();
  });
});
