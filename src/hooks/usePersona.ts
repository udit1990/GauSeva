import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export type Persona = "gau_seva" | "animal_welfare" | null;

const PERSONA_STORAGE_KEY = "df_persona";

const loadGuestPersona = (): Persona => {
  try {
    const v = localStorage.getItem(PERSONA_STORAGE_KEY);
    if (v === "gau_seva" || v === "animal_welfare") return v;
    return null;
  } catch {
    return null;
  }
};

/**
 * Translation helper: returns Hindi string when persona is gau_seva and hi is truthy,
 * otherwise returns English.
 */
const makeT = (isHindi: boolean) => (en: string, hi?: string | null): string => {
  if (isHindi && hi) return hi;
  return en;
};

export const usePersona = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestPersona, setGuestPersona] = useState<Persona>(loadGuestPersona);

  // For authenticated users, read from profile
  const { data: profilePersona } = useQuery({
    queryKey: ["profile-persona", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("persona_preference")
        .eq("id", user!.id)
        .single();
      if (error) return null;
      const pref = (data as any)?.persona_preference;
      if (pref === "gau_seva" || pref === "animal_welfare") return pref as Persona;
      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const persona: Persona = user ? (profilePersona ?? null) : guestPersona;
  const isHindi = persona === "gau_seva";
  const t = makeT(isHindi);

  const setPersona = useCallback(async (newPersona: Persona) => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ persona_preference: newPersona } as any)
        .eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile-persona", user.id] });
    } else {
      try {
        if (newPersona) {
          localStorage.setItem(PERSONA_STORAGE_KEY, newPersona);
        } else {
          localStorage.removeItem(PERSONA_STORAGE_KEY);
        }
      } catch {}
      setGuestPersona(newPersona);
    }
  }, [user, queryClient]);

  return { persona, setPersona, isHindi, t };
};
