import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── mocks ── */
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "order-1" },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    })),
  },
}));

const mockUser = { id: "user-1", email: "u@e.com" };
let authValue: any = { user: mockUser, loading: false, isAdmin: false, isVolunteer: false };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authValue,
}));

const cartItems = [
  { skuId: "s1", categoryId: "c1", name: "Fodder", categoryName: "Feed", unitPrice: 500, quantity: 2, unit: "kg" },
];
let cartValue: any;
const resetCart = () => {
  cartValue = {
    items: cartItems,
    totalAmount: 1000,
    totalItems: 2,
    gaushalaId: "g1",
    clearCart: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    setGaushalaId: vi.fn(),
    loading: false,
  };
};
vi.mock("@/contexts/CartContext", () => ({
  useCart: () => cartValue,
}));

vi.mock("@/hooks/usePersona", () => ({
  usePersona: () => ({ persona: "gau_seva", setPersona: vi.fn(), isHindi: true, t: (en: string) => en }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => children,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import Checkout from "../Checkout";
import { toast } from "sonner";

beforeEach(() => {
  vi.clearAllMocks();
  resetCart();
  authValue = { user: mockUser, loading: false, isAdmin: false, isVolunteer: false };
  localStorage.clear();
});

const renderCheckout = () => render(<Checkout />);

/* ─── Order summary ─── */
describe("Order summary", () => {
  it("renders items and total", () => {
    renderCheckout();
    expect(screen.getByText(/Fodder × 2/)).toBeInTheDocument();
    expect(screen.getAllByText("₹1000")).toHaveLength(2); // line item + total
  });

  it("shows empty state when cart has no items", () => {
    cartValue = { ...cartValue, items: [], totalAmount: 0, totalItems: 0 };
    renderCheckout();
    expect(screen.getByText(/No items to checkout/i)).toBeInTheDocument();
  });
});

/* ─── PAN validation ─── */
describe("PAN validation", () => {
  it("accepts a valid PAN", () => {
    renderCheckout();
    const panInput = screen.getByPlaceholderText(/PAN/i);
    fireEvent.change(panInput, { target: { value: "ABCDE1234F" } });
    expect(screen.queryByText(/Invalid PAN/i)).not.toBeInTheDocument();
  });

  it("shows error for invalid PAN", () => {
    renderCheckout();
    const panInput = screen.getByPlaceholderText(/PAN/i);
    fireEvent.change(panInput, { target: { value: "123" } });
    expect(screen.getByText(/Invalid PAN format/i)).toBeInTheDocument();
  });

  it("uppercases PAN input automatically", () => {
    renderCheckout();
    const panInput = screen.getByPlaceholderText(/PAN/i) as HTMLInputElement;
    fireEvent.change(panInput, { target: { value: "abcde1234f" } });
    expect(panInput.value).toBe("ABCDE1234F");
  });

  it("blocks submission with invalid PAN and shows toast", () => {
    renderCheckout();
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText(/Phone/i), { target: { value: "9999999999" } });
    fireEvent.change(screen.getByPlaceholderText(/PAN/i), { target: { value: "BAD" } });
    fireEvent.click(screen.getByRole("button", { name: /Donate Securely/i }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/valid PAN/i));
  });

  it("shows no-PAN warning dialog when PAN is empty", () => {
    renderCheckout();
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText(/Phone/i), { target: { value: "9999999999" } });
    fireEvent.click(screen.getByRole("button", { name: /Donate Securely/i }));
    expect(screen.getByText(/No 80G Tax Receipt/i)).toBeInTheDocument();
  });
});

/* ─── Gift toggle ─── */
describe("Gift toggle", () => {
  it("shows recipient fields when gift is toggled on", () => {
    renderCheckout();
    expect(screen.queryByPlaceholderText(/Recipient's Name/i)).not.toBeInTheDocument();
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(screen.getByPlaceholderText(/Recipient's Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Recipient's Phone/i)).toBeInTheDocument();
  });

  it("shows preset gift messages", () => {
    renderCheckout();
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByText(/blessings/i)).toBeInTheDocument();
    expect(screen.getByText(/Write custom message/i)).toBeInTheDocument();
  });

  it("switches to custom message textarea", () => {
    renderCheckout();
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByText(/Write custom message/i));
    expect(screen.getByPlaceholderText(/heartfelt/i)).toBeInTheDocument();
    expect(screen.getByText(/\/200/)).toBeInTheDocument();
  });

  it("switches back to preset messages", () => {
    renderCheckout();
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByText(/Write custom message/i));
    fireEvent.click(screen.getByText(/Use preset message/i));
    expect(screen.queryByPlaceholderText(/heartfelt/i)).not.toBeInTheDocument();
  });

  it("changes button label to Gift Daan when gift is on", () => {
    renderCheckout();
    expect(screen.getByRole("button", { name: /Donate Securely/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("button", { name: /Gift Daan/i })).toBeInTheDocument();
  });

  it("requires recipient name for gift donations", () => {
    renderCheckout();
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: "Donor" } });
    fireEvent.change(screen.getByPlaceholderText(/Phone Number/i), { target: { value: "9999999999" } });
    fireEvent.change(screen.getByPlaceholderText(/PAN/i), { target: { value: "ABCDE1234F" } });
    fireEvent.click(screen.getByRole("button", { name: /Gift Daan/i }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/recipient/i));
  });
});

/* ─── Donor form validation ─── */
describe("Donor form validation", () => {
  it("requires name and phone", () => {
    renderCheckout();
    fireEvent.click(screen.getByRole("button", { name: /Donate Securely/i }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/name and phone/i));
  });
});

/* ─── Referral code linking ─── */
describe("Referral code linking", () => {
  it("reads referral code from localStorage and clears after order", async () => {
    localStorage.setItem("df_referral_code", "DF_REF123");
    const { supabase } = await import("@/integrations/supabase/client");

    renderCheckout();
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText(/Phone/i), { target: { value: "9999999999" } });
    fireEvent.change(screen.getByPlaceholderText(/PAN/i), { target: { value: "ABCDE1234F" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Donate Securely/i }));
    });

    await waitFor(() => {
      expect(localStorage.getItem("df_referral_code")).toBeNull();
    });
  });
});

/* ─── Payment method selection ─── */
describe("Payment method", () => {
  it("defaults to UPI", () => {
    renderCheckout();
    const upiBtn = screen.getByText("UPI").closest("button")!;
    expect(upiBtn.className).toMatch(/border-primary/);
  });

  it("switches to card", () => {
    renderCheckout();
    fireEvent.click(screen.getByText("Card"));
    const cardBtn = screen.getByText("Card").closest("button")!;
    expect(cardBtn.className).toMatch(/border-primary/);
  });
});

/* ─── Guest checkout ─── */
describe("Guest checkout", () => {
  it("allows guest checkout and navigates to payment", async () => {
    authValue = { user: null, loading: false, isAdmin: false, isVolunteer: false };
    renderCheckout();
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText(/Phone/i), { target: { value: "9999999999" } });
    fireEvent.change(screen.getByPlaceholderText(/PAN/i), { target: { value: "ABCDE1234F" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Donate Securely/i }));
    });

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/payment"));
  });
});
