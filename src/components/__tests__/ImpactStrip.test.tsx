import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ImpactStrip from "../ImpactStrip";

describe("ImpactStrip", () => {
  it("renders all items with correct values and labels", () => {
    const items = [
      { value: "100+", label: "Cows Fed" },
      { value: "₹5K", label: "Donated" },
    ];
    render(<ImpactStrip items={items} />);
    expect(screen.getByText("100+")).toBeInTheDocument();
    expect(screen.getByText("Cows Fed")).toBeInTheDocument();
    expect(screen.getByText("₹5K")).toBeInTheDocument();
    expect(screen.getByText("Donated")).toBeInTheDocument();
  });

  it("handles empty items array", () => {
    const { container } = render(<ImpactStrip items={[]} />);
    expect(container.querySelector(".flex")).toBeInTheDocument();
  });
});
