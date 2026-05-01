import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
    from: () => ({
      upsert: () => Promise.resolve({}),
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({}),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({}),
      }),
      select: () => ({
        eq: () => Promise.resolve({ data: [] }),
      }),
    }),
  },
}));

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

const TestConsumer = () => {
  const { items, totalItems, totalAmount, addItem, removeItem, updateQuantity, clearCart } = useCart();
  return (
    <div>
      <span data-testid="count">{totalItems}</span>
      <span data-testid="total">{totalAmount}</span>
      <span data-testid="items">{JSON.stringify(items)}</span>
      <button onClick={() => addItem({ skuId: "s1", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, unit: "kg" })}>
        add
      </button>
      <button onClick={() => removeItem("s1")}>remove</button>
      <button onClick={() => updateQuantity("s1", 5)}>update</button>
      <button onClick={() => clearCart()}>clear</button>
    </div>
  );
};

const renderCart = () =>
  render(
    <CartProvider>
      <TestConsumer />
    </CartProvider>
  );

describe("CartContext", () => {
  it("starts with empty cart", () => {
    renderCart();
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");
  });

  it("addItem adds to cart and updates totals", () => {
    renderCart();
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("total").textContent).toBe("100");
  });

  it("addItem increments quantity on duplicate", () => {
    renderCart();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("total").textContent).toBe("200");
  });

  it("removeItem removes from cart", () => {
    renderCart();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("remove").click());
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("updateQuantity changes quantity", () => {
    renderCart();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("update").click());
    expect(screen.getByTestId("count").textContent).toBe("5");
    expect(screen.getByTestId("total").textContent).toBe("500");
  });

  it("clearCart empties everything", () => {
    renderCart();
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("clear").click());
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");
  });
});
