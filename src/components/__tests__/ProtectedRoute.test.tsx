import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockAuth = {
  user: null as any,
  loading: false,
  isAdmin: false,
  isVolunteer: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: "/protected", search: "" }),
  useNavigate: () => mockNavigate,
}));

import ProtectedRoute from "../ProtectedRoute";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.loading = false;
    mockAuth.isAdmin = false;
    mockAuth.isVolunteer = false;
  });

  it("shows loading state when auth is loading", () => {
    mockAuth.loading = true;
    render(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("redirects to auth when no user", () => {
    render(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    const nav = screen.getByTestId("navigate");
    expect(nav.getAttribute("data-to")).toContain("/auth?redirect=");
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    mockAuth.user = { id: "u1" };
    render(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });

  it("denies access when admin role required but user is not admin", () => {
    mockAuth.user = { id: "u1" };
    render(<ProtectedRoute requiredRole="admin"><p>Admin Page</p></ProtectedRoute>);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.queryByText("Admin Page")).not.toBeInTheDocument();
  });

  it("allows access when admin role required and user is admin", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.isAdmin = true;
    render(<ProtectedRoute requiredRole="admin"><p>Admin Page</p></ProtectedRoute>);
    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  it("denies access when volunteer role required but user is not volunteer", () => {
    mockAuth.user = { id: "u1" };
    render(<ProtectedRoute requiredRole="volunteer"><p>Vol Page</p></ProtectedRoute>);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("allows access when volunteer role required and user is volunteer", () => {
    mockAuth.user = { id: "u1" };
    mockAuth.isVolunteer = true;
    render(<ProtectedRoute requiredRole="volunteer"><p>Vol Page</p></ProtectedRoute>);
    expect(screen.getByText("Vol Page")).toBeInTheDocument();
  });
});
