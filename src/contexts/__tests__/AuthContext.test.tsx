import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthContext, AuthProvider } from "../AuthContext";
import { useContext } from "react";

// --- Supabase mock setup ---
let authStateCallback: ((event: string, session: any) => void) | null = null;
const mockUnsubscribe = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockSelectRoles = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: any) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
      getSession: () => mockGetSession(),
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => {
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => mockSelectRoles(),
          }),
        };
      }
      return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
    },
  },
}));

// --- Test consumer ---
const TestConsumer = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) return <p>no context</p>;
  return (
    <div>
      <span data-testid="user">{ctx.user ? ctx.user.id : "null"}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="isAdmin">{String(ctx.isAdmin)}</span>
      <span data-testid="isVolunteer">{String(ctx.isVolunteer)}</span>
      <button onClick={() => ctx.signIn("test@test.com", "pass123")}>signIn</button>
      <button onClick={() => ctx.signUp("test@test.com", "pass123", "Test User")}>signUp</button>
      <button onClick={() => ctx.signOut()}>signOut</button>
    </div>
  );
};

const renderAuth = () =>
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSelectRoles.mockResolvedValue({ data: [] });
  });

  it("starts in loading state with no user", async () => {
    renderAuth();
    // Before getSession resolves, loading may be true
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
    });
  });

  it("sets loading to false after session hydration", async () => {
    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("sets user from existing session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });
    mockSelectRoles.mockResolvedValue({ data: [] });

    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("u1");
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("detects admin role from user_roles table", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "admin1" } } },
    });
    mockSelectRoles.mockResolvedValue({ data: [{ role: "admin" }] });

    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("isAdmin").textContent).toBe("true");
      expect(screen.getByTestId("isVolunteer").textContent).toBe("false");
    });
  });

  it("detects volunteer role from user_roles table", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "vol1" } } },
    });
    mockSelectRoles.mockResolvedValue({ data: [{ role: "volunteer" }] });

    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("isVolunteer").textContent).toBe("true");
      expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    });
  });

  it("detects multiple roles (admin + volunteer)", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "super1" } } },
    });
    mockSelectRoles.mockResolvedValue({
      data: [{ role: "admin" }, { role: "volunteer" }],
    });

    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("isAdmin").textContent).toBe("true");
      expect(screen.getByTestId("isVolunteer").textContent).toBe("true");
    });
  });

  it("updates state when onAuthStateChange fires (login)", async () => {
    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
    });

    // Simulate login event
    await act(async () => {
      authStateCallback?.("SIGNED_IN", { user: { id: "u2" } });
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("u2");
    });
  });

  it("clears roles on sign-out event", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "admin1" } } },
    });
    mockSelectRoles.mockResolvedValue({ data: [{ role: "admin" }] });

    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    });

    // Reset mock for the logout path (no roles query needed)
    mockSelectRoles.mockResolvedValue({ data: [] });

    // Simulate sign-out event
    await act(async () => {
      authStateCallback?.("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(screen.getByTestId("isAdmin").textContent).toBe("false");
      expect(screen.getByTestId("isVolunteer").textContent).toBe("false");
    });
  });

  it("calls supabase.auth.signInWithPassword on signIn", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      screen.getByText("signIn").click();
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "pass123",
    });
  });

  it("calls supabase.auth.signUp with full_name metadata on signUp", async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      screen.getByText("signUp").click();
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "pass123",
      options: { data: { full_name: "Test User" } },
    });
  });

  it("calls supabase.auth.signOut on signOut", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      screen.getByText("signOut").click();
    });

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("unsubscribes from auth listener on unmount", async () => {
    const { unmount } = renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it("handles no user (regular user with no roles)", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "regular1" } } },
    });
    mockSelectRoles.mockResolvedValue({ data: [{ role: "user" }] });

    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("regular1");
      expect(screen.getByTestId("isAdmin").textContent).toBe("false");
      expect(screen.getByTestId("isVolunteer").textContent).toBe("false");
    });
  });
});
