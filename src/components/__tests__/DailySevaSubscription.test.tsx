import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUser = { current: null as any };
const mockSubData = { current: null as any };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser.current }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockSubData.current }),
          }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DailySevaSubscription from "../DailySevaSubscription";

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe("DailySevaSubscription", () => {
  beforeEach(() => {
    mockUser.current = null;
    mockSubData.current = null;
  });

  it("renders amount selector with 3 options", () => {
    mockUser.current = { id: "u1" };
    render(<DailySevaSubscription />, { wrapper: createWrapper() });
    expect(screen.getByText("₹51/day")).toBeInTheDocument();
    expect(screen.getByText("₹101/day")).toBeInTheDocument();
    expect(screen.getByText("₹251/day")).toBeInTheDocument();
  });

  it("renders title and subscribe button", () => {
    mockUser.current = { id: "u1" };
    render(<DailySevaSubscription />, { wrapper: createWrapper() });
    expect(screen.getByText("Daily Seva Subscription")).toBeInTheDocument();
    expect(screen.getByText("Start ₹101/day Seva")).toBeInTheDocument();
  });
});
