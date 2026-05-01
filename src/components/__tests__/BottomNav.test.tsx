import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockAuth = { user: null as any, isAdmin: false, isVolunteer: false };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/", search: "" }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 0 }),
        }),
      }),
    }),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: 0 }),
}));

import BottomNav from "../BottomNav";

describe("BottomNav", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.isAdmin = false;
    mockAuth.isVolunteer = false;
  });

  it("guest: renders Seva, About, Sign In tabs", () => {
    render(<BottomNav />);
    expect(screen.getByText("Seva")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.queryByText("Live Feed")).not.toBeInTheDocument();
  });

  it("logged-in regular user: renders Seva, Live Feed, My Karma, About", () => {
    mockAuth.user = { id: "u1" };
    render(<BottomNav />);
    expect(screen.getByText("Seva")).toBeInTheDocument();
    expect(screen.getByText("Live Feed")).toBeInTheDocument();
    expect(screen.getByText("My Karma")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });
});
