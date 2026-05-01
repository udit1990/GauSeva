import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/", search: "" }),
}));

const mockAuth = { user: null as any, isAdmin: false, isVolunteer: false };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 0 }),
          neq: () => Promise.resolve({ count: 0 }),
        }),
        neq: () => ({
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

describe("BottomNav - deep tests", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.isAdmin = false;
    mockAuth.isVolunteer = false;
  });

  it("admin user sees Admin and Visits tabs", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.isAdmin = true;
    render(<BottomNav />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.queryByText("Live Feed")).not.toBeInTheDocument();
  });

  it("volunteer user sees Today, Tasks, Uploads, Alerts, Profile tabs", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.isVolunteer = true;
    render(<BottomNav />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Uploads")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("admin user sees Home tab", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.isAdmin = true;
    render(<BottomNav />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("regular user does not see Tasks or Uploads tabs", () => {
    mockAuth.user = { id: "u1" };
    render(<BottomNav />);
    expect(screen.queryByText("Tasks")).not.toBeInTheDocument();
    expect(screen.queryByText("Uploads")).not.toBeInTheDocument();
  });

  it("guest sees Sign In tab", () => {
    render(<BottomNav />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });
});
