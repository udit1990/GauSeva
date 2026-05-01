import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SkuCard from "../SkuCard";

describe("SkuCard", () => {
  const baseProps = {
    name: "Hay Bundle",
    price: 100,
    unit: "kg",
    onAdd: vi.fn(),
    onRemove: vi.fn(),
  };

  it("shows Add button when quantity is 0", () => {
    render(<SkuCard {...baseProps} quantity={0} />);
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("shows +/- controls and quantity when quantity > 0", () => {
    render(<SkuCard {...baseProps} quantity={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("Add")).not.toBeInTheDocument();
  });

  it("fires onAdd when Add button clicked", () => {
    const onAdd = vi.fn();
    render(<SkuCard {...baseProps} quantity={0} onAdd={onAdd} />);
    fireEvent.click(screen.getByText("Add"));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("fires onRemove when minus button clicked", () => {
    const onRemove = vi.fn();
    render(<SkuCard {...baseProps} quantity={2} onRemove={onRemove} />);
    // The minus button is the first button-like element with Minus icon
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // minus button
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("renders description when provided", () => {
    render(<SkuCard {...baseProps} quantity={0} description="Fresh hay" />);
    expect(screen.getByText("Fresh hay")).toBeInTheDocument();
  });
});
