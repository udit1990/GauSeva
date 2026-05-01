import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const VisitNotesInline = ({ visit, onSave, saving }: { visit: any; onSave: (notes: string) => void; saving: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(visit.volunteer_notes || "");

  if (!editing) {
    return (
      <div className="pt-2 border-t border-border">
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          onClick={() => { setValue(visit.volunteer_notes || ""); setEditing(true); }}>
          {visit.volunteer_notes
            ? <span className="text-foreground">📝 {visit.volunteer_notes}</span>
            : <span className="italic">+ Add notes...</span>
          }
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-border space-y-1.5">
      <Textarea placeholder="Notes about this visit..." value={value} onChange={(e) => setValue(e.target.value)} className="min-h-[60px] text-xs" />
      <div className="flex gap-1.5">
        <Button size="sm" className="rounded-lg text-xs h-7" onClick={() => { onSave(value); setEditing(false); }} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" className="rounded-lg text-xs h-7" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
};

export default VisitNotesInline;
