import { useAdminFilters, PersonaFilter, AnimalFilter } from "@/contexts/AdminFilterContext";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";

const personaOptions: { key: PersonaFilter; label: string }[] = [
  { key: "all", label: "All Personas" },
  { key: "gau_seva", label: "🙏 Gau Seva" },
  { key: "animal_welfare", label: "🐾 Animal Welfare" },
];

const animalOptions: { key: AnimalFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cow", label: "🐄 Cow" },
  { key: "dog", label: "🐕 Dog" },
  { key: "cat", label: "🐈 Cat" },
  { key: "monkey", label: "🐒 Monkey" },
];

const GlobalFilterBar = () => {
  const { persona, animal, setPersona, setAnimal, resetFilters } = useAdminFilters();
  const hasFilters = persona !== "all" || animal !== "all";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {personaOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setPersona(o.key)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0",
                persona === o.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button onClick={resetFilters} className="shrink-0 rounded-full p-1 hover:bg-muted">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {animalOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => setAnimal(o.key)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0",
              animal === o.key
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GlobalFilterBar;
