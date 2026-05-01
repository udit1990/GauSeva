import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

const mockCartValues = { totalItems: 0, totalAmount: 0 };
vi.mock("@/contexts/CartContext", () => ({
  useCart: () => mockCartValues,
}));

import CartBar from "../CartBar";

describe("CartBar", () => {
  it("returns null when cart is empty", () => {
    mockCartValues.totalItems = 0;
    mockCartValues.totalAmount = 0;
    const { container } = render(<CartBar />);
    expect(container.firstChild).toBeNull();
  });

  it("shows item count and total when cart has items", () => {
    mockCartValues.totalItems = 3;
    mockCartValues.totalAmount = 500;
    render(<CartBar />);
    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.getByText("₹500")).toBeInTheDocument();
  });
});
