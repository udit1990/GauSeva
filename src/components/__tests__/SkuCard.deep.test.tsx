import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SkuCard from "../SkuCard";

describe("SkuCard - deep tests", () => {
  const baseProps = {
    name: "Hay Bundle",
    price: 100,
    unit: "kg",
    onAdd: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies active border style when quantity > 0", () => {
    const { container } = render(<SkuCard {...baseProps} quantity={2} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-primary");
  });

  it("applies inactive border style when quantity is 0", () => {
    const { container } = render(<SkuCard {...baseProps} quantity={0} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-border");
  });

  it("displays price with unit", () => {
    render(<SkuCard {...baseProps} quantity={0} />);
    expect(screen.getByText("₹100 / kg")).toBeInTheDocument();
  });

  it("plus button fires onAdd when quantity > 0", () => {
    const onAdd = vi.fn();
    render(<SkuCard {...baseProps} quantity={3} onAdd={onAdd} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]); // plus button (second)
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("truncates long names", () => {
    render(<SkuCard {...baseProps} name="Very Long Hay Bundle Name That Should Truncate" quantity={0} />);
    const nameEl = screen.getByText("Very Long Hay Bundle Name That Should Truncate");
    expect(nameEl.className).toContain("truncate");
  });

  it("line-clamps long descriptions", () => {
    render(<SkuCard {...baseProps} description="A very long description that goes on and on" quantity={0} />);
    const descEl = screen.getByText("A very long description that goes on and on");
    expect(descEl.className).toContain("line-clamp");
  });
});
