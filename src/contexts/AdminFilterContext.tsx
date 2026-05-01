import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type PersonaFilter = "all" | "animal_welfare" | "gau_seva";
export type AnimalFilter = "all" | "cow" | "dog" | "cat" | "monkey";

interface AdminFilterContextType {
  persona: PersonaFilter;
  animal: AnimalFilter;
  setPersona: (p: PersonaFilter) => void;
  setAnimal: (a: AnimalFilter) => void;
  resetFilters: () => void;
}

const AdminFilterContext = createContext<AdminFilterContextType | undefined>(undefined);

export const AdminFilterProvider = ({ children }: { children: ReactNode }) => {
  const [persona, setPersona] = useState<PersonaFilter>("all");
  const [animal, setAnimal] = useState<AnimalFilter>("all");

  const resetFilters = useCallback(() => {
    setPersona("all");
    setAnimal("all");
  }, []);

  return (
    <AdminFilterContext.Provider value={{ persona, animal, setPersona, setAnimal, resetFilters }}>
      {children}
    </AdminFilterContext.Provider>
  );
};

export const useAdminFilters = () => {
  const ctx = useContext(AdminFilterContext);
  if (!ctx) throw new Error("useAdminFilters must be used within AdminFilterProvider");
  return ctx;
};
