import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CartProvider, useCart } from "../../contexts/CartContext";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
    from: () => ({
      upsert: () => Promise.resolve({}),
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({}) }) }),
      update: () => ({ eq: () => Promise.resolve({}) }),
      select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
    }),
  },
}));

beforeEach(() => localStorage.clear());

const TestHarness = () => {
  const { items, totalItems, totalAmount, addItem, removeItem, updateQuantity, clearCart } = useCart();
  return (
    <div>
      <span data-testid="count">{totalItems}</span>
      <span data-testid="total">{totalAmount}</span>
      <span data-testid="items-json">{JSON.stringify(items)}</span>
      <button onClick={() => addItem({ skuId: "a", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, unit: "kg" })}>addA</button>
      <button onClick={() => addItem({ skuId: "b", categoryId: "c2", name: "Water", categoryName: "Water", unitPrice: 50, unit: "litre" })}>addB</button>
      <button onClick={() => addItem({ skuId: "c", categoryId: "c1", name: "Custom", categoryName: "Feed", unitPrice: 500, unit: "unit", isCustomAmount: true })}>addCustom</button>
      <button onClick={() => addItem({ skuId: "a", categoryId: "c1", name: "Hay", categoryName: "Feed", unitPrice: 100, unit: "kg", quantity: 5 })}>addA5</button>
      <button onClick={() => removeItem("a")}>removeA</button>
      <button onClick={() => removeItem("nonexistent")}>removeNone</button>
      <button onClick={() => updateQuantity("a", 10)}>updateA10</button>
      <button onClick={() => updateQuantity("a", 0)}>updateA0</button>
      <button onClick={() => updateQuantity("a", -1)}>updateANeg</button>
      <button onClick={() => clearCart()}>clear</button>
    </div>
  );
};

const renderHarness = () => render(<CartProvider><TestHarness /></CartProvider>);

describe("CartContext - deep tests", () => {
  it("adding multiple distinct items tracks each separately", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("addB").click());
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("total").textContent).toBe("150");
  });

  it("adding same item increments quantity", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("addA").click());
    expect(screen.getByTestId("count").textContent).toBe("3");
    expect(screen.getByTestId("total").textContent).toBe("300");
  });

  it("adding with explicit quantity adds that quantity", () => {
    renderHarness();
    act(() => screen.getByText("addA5").click());
    expect(screen.getByTestId("count").textContent).toBe("5");
    expect(screen.getByTestId("total").textContent).toBe("500");
  });

  it("adding explicit quantity to existing item increments by that amount", () => {
    renderHarness();
    act(() => screen.getByText("addA").click()); // qty=1
    act(() => screen.getByText("addA5").click()); // qty=1+5=6
    expect(screen.getByTestId("count").textContent).toBe("6");
    expect(screen.getByTestId("total").textContent).toBe("600");
  });

  it("custom amount items are tracked with isCustomAmount flag", () => {
    renderHarness();
    act(() => screen.getByText("addCustom").click());
    const items = JSON.parse(screen.getByTestId("items-json").textContent!);
    expect(items[0].isCustomAmount).toBe(true);
    expect(items[0].unitPrice).toBe(500);
  });

  it("removing non-existent item does not change cart", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("removeNone").click());
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("updateQuantity to 0 removes the item", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("updateA0").click());
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("updateQuantity to negative removes the item", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("updateANeg").click());
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("updateQuantity sets exact quantity", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("updateA10").click());
    expect(screen.getByTestId("count").textContent).toBe("10");
    expect(screen.getByTestId("total").textContent).toBe("1000");
  });

  it("clearCart removes all items", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("addB").click());
    act(() => screen.getByText("clear").click());
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");
  });

  it("persists to localStorage for guest users", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    const stored = JSON.parse(localStorage.getItem("dhyan-cart") || "[]");
    expect(stored.length).toBe(1);
    expect(stored[0].skuId).toBe("a");
  });

  it("clearCart clears localStorage cart key", () => {
    renderHarness();
    act(() => screen.getByText("addA").click());
    act(() => screen.getByText("clear").click());
    const stored = localStorage.getItem("dhyan-cart");
    // After clear, either null or removed
    expect(stored === null || stored === "[]").toBe(true);
  });
});
