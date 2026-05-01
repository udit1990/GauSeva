import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUser = { current: null as any };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser.current }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({}),
    }),
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return actual;
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReferralCard from "../ReferralCard";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("ReferralCard", () => {
  beforeEach(() => {
    mockUser.current = null;
  });

  it("returns null when user is not logged in", () => {
    const { container } = render(<ReferralCard orderId="test-123" />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it("renders referral content when user is present", () => {
    mockUser.current = { id: "user-abc123-def456" };
    render(<ReferralCard orderId="test-123" />, { wrapper });
    expect(screen.getByText("Refer & Earn Punya")).toBeInTheDocument();
    expect(screen.getByText("Share via WhatsApp")).toBeInTheDocument();
  });
});
