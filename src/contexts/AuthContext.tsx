import { createContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isVolunteer: boolean;
  signUp: (email: string, password: string, fullName: string) => ReturnType<typeof supabase.auth.signUp>;
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>;
  signOut: () => ReturnType<typeof supabase.auth.signOut>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const latestUserIdRef = useRef<string | null>(null);

  const checkRoles = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (latestUserIdRef.current !== userId) return;

      const roles = data?.map((r) => r.role) || [];
      setIsAdmin(roles.includes("admin"));
      setIsVolunteer(roles.includes("volunteer"));
    } catch {
      if (latestUserIdRef.current !== userId) return;
      setIsAdmin(false);
      setIsVolunteer(false);
    }
  };

  useEffect(() => {
    // Safety timeout: if auth/roles don't resolve quickly, stop loading anyway.
    const safetyTimer = setTimeout(() => setLoading(false), 3000);

    const applySession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      const u = session?.user ?? null;
      latestUserIdRef.current = u?.id ?? null;
      setUser(u);

      if (u) {
        await checkRoles(u.id);
      } else {
        setIsAdmin(false);
        setIsVolunteer(false);
      }

      setLoading(false);
      clearTimeout(safetyTimer);
    };

    // Set up listener FIRST (before getSession) to catch all auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    // Then hydrate from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = (email: string, password: string, fullName: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isVolunteer, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
