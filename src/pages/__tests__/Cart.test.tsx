import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockNavigate = vi.fn();
const mockCart = {
  items: [] as any[],
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  totalAmount: 0,
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => mockCart,
}));

import Cart from "../../pages/Cart";

describe("Cart Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCart.items = [];
    mockCart.totalAmount = 0;
  });

  it("shows empty state when cart has no items", () => {
    render(<Cart />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Browse Daan")).toBeInTheDocument();
  });

  it("navigates to home when Browse Daan clicked on empty cart", () => {
    render(<Cart />);
    fireEvent.click(screen.getByText("Browse Daan"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("renders items grouped by category", () => {
    mockCart.items = [
      { skuId: "s1", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, quantity: 2, unit: "kg" },
      { skuId: "s2", categoryId: "c2", name: "Bucket", categoryName: "Water Supply", unitPrice: 50, quantity: 1, unit: "litre" },
    ];
    mockCart.totalAmount = 250;
    render(<Cart />);
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Water Supply")).toBeInTheDocument();
    expect(screen.getByText("Hay")).toBeInTheDocument();
    expect(screen.getByText("₹250")).toBeInTheDocument();
  });

  it("shows per-item price breakdown", () => {
    mockCart.items = [
      { skuId: "s1", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, quantity: 3, unit: "kg" },
    ];
    mockCart.totalAmount = 300;
    render(<Cart />);
    expect(screen.getByText("₹100 × 3")).toBeInTheDocument();
  });

  it("calls clearCart when Clear All is clicked", () => {
    mockCart.items = [
      { skuId: "s1", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, quantity: 1, unit: "kg" },
    ];
    mockCart.totalAmount = 100;
    render(<Cart />);
    fireEvent.click(screen.getByText("Clear All"));
    expect(mockCart.clearCart).toHaveBeenCalledOnce();
  });

  it("navigates to checkout when proceed button clicked", () => {
    mockCart.items = [
      { skuId: "s1", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, quantity: 1, unit: "kg" },
    ];
    mockCart.totalAmount = 100;
    render(<Cart />);
    fireEvent.click(screen.getByText("Proceed to Donate — ₹100"));
    expect(mockNavigate).toHaveBeenCalledWith("/checkout");
  });
});
