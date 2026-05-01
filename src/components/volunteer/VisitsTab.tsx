import { CheckCircle2, Phone, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import VisitNotesInline from "./VisitNotesInline";

const VisitsTab = ({ visits, updateVisitMutation, saveVisitNotesMutation }: any) => (
  <div className="space-y-3">
    <h2 className="text-base font-bold text-foreground">Assigned Visits</h2>
    {visits.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No visits assigned yet</p>}
    {visits.map((visit: any) => (
      <div key={visit.id} className="rounded-xl bg-card p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{visit.visitor_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(visit.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" • "}{visit.time_slot}
            </p>
          </div>
          <span className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            visit.status === "visited" ? "bg-secondary/10 text-secondary" :
            visit.status === "acknowledged" ? "bg-primary/10 text-primary" :
            visit.status === "not_visited" ? "bg-destructive/10 text-destructive" :
            "bg-muted text-muted-foreground"
          )}>
            {visit.status}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a href={`tel:${visit.visitor_phone}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Phone className="h-3 w-3" /> {visit.visitor_phone}
          </a>
          <a href={`https://wa.me/91${visit.visitor_phone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary">
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </a>
        </div>

        {visit.gaushalas_list && (
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-primary font-medium">{visit.gaushalas_list.name}, {visit.gaushalas_list.city}</p>
            {visit.gaushalas_list.lat && visit.gaushalas_list.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${visit.gaushalas_list.lat},${visit.gaushalas_list.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] text-primary underline"
              >
                <MapPin className="h-3 w-3" /> Directions
              </a>
            )}
          </div>
        )}

        {visit.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" className="rounded-lg text-xs" onClick={() => updateVisitMutation.mutate({ id: visit.id, status: "acknowledged" })}>
              Acknowledge
            </Button>
          </div>
        )}
        {visit.status === "acknowledged" && (
          <div className="flex gap-2">
            <Button size="sm" className="rounded-lg text-xs" onClick={() => updateVisitMutation.mutate({ id: visit.id, status: "visited" })}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Visited
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => updateVisitMutation.mutate({ id: visit.id, status: "not_visited" })}>
              Not Visited
            </Button>
          </div>
        )}

        <VisitNotesInline visit={visit} onSave={(notes: string) => saveVisitNotesMutation.mutate({ visitId: visit.id, notes })} saving={saveVisitNotesMutation.isPending} />
      </div>
    ))}
  </div>
);

export default VisitsTab;
