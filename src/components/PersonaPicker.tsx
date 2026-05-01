import { Heart, PawPrint } from "lucide-react";
import type { Persona } from "@/hooks/usePersona";

interface PersonaPickerProps {
  onSelect: (persona: Persona) => void;
}

const PersonaPicker = ({ onSelect }: PersonaPickerProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-5">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Welcome 🙏</h1>
          <p className="text-sm text-muted-foreground mt-1">
            How would you like to contribute?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Gau Seva */}
          <button
            onClick={() => onSelect("gau_seva")}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-5 active:scale-[0.97] transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground" lang="hi">गौ सेवा</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cow welfare · Hindi
              </p>
            </div>
          </button>

          {/* Animal Welfare */}
          <button
            onClick={() => onSelect("animal_welfare")}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-5 active:scale-[0.97] transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/50">
              <PawPrint className="h-7 w-7 text-accent-foreground" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Animal Welfare</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                All animals · English
              </p>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          You can change this anytime in Settings
        </p>
      </div>
    </div>
  );
};

export default PersonaPicker;
