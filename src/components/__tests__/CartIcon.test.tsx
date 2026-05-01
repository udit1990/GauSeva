import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockCart = {
  totalItems: 0,
  totalAmount: 0,
};

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => mockCart,
}));

const mockNavigate = vi.fn();
const mockLocation = { pathname: "/" };
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

import CartIcon from "../CartIcon";

describe("CartIcon", () => {
  beforeEach(() => {
    mockCart.totalItems = 0;
    mockCart.totalAmount = 0;
    mockLocation.pathname = "/";
    sessionStorage.clear();
  });

  it("returns null when cart is empty", () => {
    const { container } = render(<CartIcon />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when cart has items", () => {
    mockCart.totalItems = 2;
    mockCart.totalAmount = 300;
    render(<CartIcon />);
    expect(screen.getByText("₹300")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("hides on /cart route", () => {
    mockCart.totalItems = 1;
    mockCart.totalAmount = 100;
    mockLocation.pathname = "/cart";
    const { container } = render(<CartIcon />);
    expect(container.firstChild).toBeNull();
  });

  it("hides on /checkout route", () => {
    mockCart.totalItems = 1;
    mockCart.totalAmount = 100;
    mockLocation.pathname = "/checkout";
    const { container } = render(<CartIcon />);
    expect(container.firstChild).toBeNull();
  });

  it("hides on /auth route", () => {
    mockCart.totalItems = 1;
    mockCart.totalAmount = 100;
    mockLocation.pathname = "/auth";
    const { container } = render(<CartIcon />);
    expect(container.firstChild).toBeNull();
  });

  it("has correct aria-label", () => {
    mockCart.totalItems = 3;
    mockCart.totalAmount = 750;
    render(<CartIcon />);
    expect(screen.getByLabelText("Cart: 3 items, ₹750")).toBeInTheDocument();
  });
});
