import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Users, Clock, UserPlus, X } from "lucide-react";
import AuditTrail from "./AuditTrail";
import { useGaushalas } from "@/hooks/useGaushalas";

const statusFilters = ["all", "pending", "confirmed", "visited", "cancelled"] as const;

const AdminVisits = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gaushalaFilter, setGaushalaFilter] = useState<string>("all");
  const [assigningVisit, setAssigningVisit] = useState<string | null>(null);
  const { data: gaushalas } = useGaushalas(false);

  const { data: visits, isLoading } = useQuery({
    queryKey: ["admin-visits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("visit_bookings")
        .select("*, gaushalas_list(name, city, state)")
        .order("visit_date", { ascending: false });
      return data || [];
    },
  });

  const { data: volunteers } = useQuery({
    queryKey: ["admin-volunteers-for-visits"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "volunteer");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, gaushala_id")
        .in("id", ids);
      return profiles || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ visitId, volunteerId }: { visitId: string; volunteerId: string }) => {
      const { error } = await supabase
        .from("visit_bookings")
        .update({ assigned_volunteer: volunteerId })
        .eq("id", visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-visits"] });
      setAssigningVisit(null);
      toast.success("Volunteer assigned to visit");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ visitId, status }: { visitId: string; status: string }) => {
      const { error } = await supabase
        .from("visit_bookings")
        .update({ status })
        .eq("id", visitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-visits"] });
      toast.success("Visit status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = visits?.filter((v) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (gaushalaFilter !== "all" && v.gaushala_id !== gaushalaFilter) return false;
    return true;
  }) || [];

  const now = new Date();
  const upcoming = filtered.filter((v) => new Date(v.visit_date) >= now && v.status !== "cancelled");
  const past = filtered.filter((v) => new Date(v.visit_date) < now || v.status === "cancelled");

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  const pendingCount = visits?.filter((v) => v.status === "pending").length || 0;
  const confirmedCount = visits?.filter((v) => v.status === "confirmed").length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-foreground">{visits?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg bg-primary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-primary">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg bg-secondary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-secondary">{confirmedCount}</p>
          <p className="text-[10px] text-muted-foreground">Confirmed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize",
                statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={gaushalaFilter} onValueChange={setGaushalaFilter}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="All Gaushalas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Gaushalas</SelectItem>
              {gaushalas?.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {gaushalaFilter !== "all" && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setGaushalaFilter("all")}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Upcoming</h3>
          {upcoming.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              volunteers={volunteers || []}
              assigningVisit={assigningVisit}
              setAssigningVisit={setAssigningVisit}
              onAssign={(volunteerId) => assignMutation.mutate({ visitId: visit.id, volunteerId })}
              onStatusChange={(status) => statusMutation.mutate({ visitId: visit.id, status })}
            />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past / Cancelled</h3>
          {past.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              volunteers={volunteers || []}
              assigningVisit={assigningVisit}
              setAssigningVisit={setAssigningVisit}
              onAssign={(volunteerId) => assignMutation.mutate({ visitId: visit.id, volunteerId })}
              onStatusChange={(status) => statusMutation.mutate({ visitId: visit.id, status })}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No visits found</p>}
    </div>
  );
};

const VisitCard = ({ visit, volunteers, assigningVisit, setAssigningVisit, onAssign, onStatusChange }: {
  visit: any;
  volunteers: any[];
  assigningVisit: string | null;
  setAssigningVisit: (id: string | null) => void;
  onAssign: (volunteerId: string) => void;
  onStatusChange: (status: string) => void;
}) => {
  const gaushala = visit.gaushalas_list as any;

  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{visit.visitor_name}</p>
          <p className="text-xs text-muted-foreground">{visit.visitor_phone}</p>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
          visit.status === "confirmed" || visit.status === "visited" ? "bg-secondary/10 text-secondary"
            : visit.status === "cancelled" ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        )}>
          {visit.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {gaushala && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {gaushala.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {new Date(visit.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {visit.time_slot}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {visit.num_visitors}
        </span>
      </div>

      {/* Assignment info + Actions */}
      <div className="space-y-2 pt-1">
        {visit.assigned_volunteer && (() => {
          const vol = volunteers.find((v) => v.id === visit.assigned_volunteer);
          const isAutoAssigned = vol && (vol as any).gaushala_id === visit.gaushala_id;
          return (
            <div className="rounded-lg bg-muted/30 p-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">{vol?.full_name || "Unknown"}</p>
                <p className="text-[10px] text-muted-foreground">{vol?.phone}</p>
              </div>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-medium",
                isAutoAssigned ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
              )}>
                {isAutoAssigned ? "⚡ Auto" : "✋ Manual"}
              </span>
            </div>
          );
        })()}

        <div className="flex items-center gap-2">
          {assigningVisit === visit.id ? (
            <div className="flex-1 flex gap-1.5">
              <Select onValueChange={onAssign}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.map((v) => {
                    const isTagged = (v as any).gaushala_id === visit.gaushala_id;
                    return (
                      <SelectItem key={v.id} value={v.id} className="text-xs">
                        {v.full_name || v.phone}
                        {isTagged ? " ⚡" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAssigningVisit(null)}>✕</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAssigningVisit(visit.id)}>
              <UserPlus className="h-3 w-3 mr-1" />
              {visit.assigned_volunteer ? "Override" : "Assign"}
            </Button>
          )}

          {visit.status === "pending" && (
            <Button size="sm" className="h-7 text-xs" onClick={() => onStatusChange("confirmed")}>
              Confirm
            </Button>
          )}
          {visit.status === "confirmed" && (
            <Button size="sm" className="h-7 text-xs" onClick={() => onStatusChange("visited")}>
              Complete
            </Button>
          )}
          {visit.status !== "cancelled" && visit.status !== "visited" && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onStatusChange("cancelled")}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      <AuditTrail entityType="visit" entityId={visit.id} volunteers={volunteers} />

      {visit.volunteer_notes && (
        <p className="text-[10px] text-muted-foreground italic border-t border-border pt-1.5 mt-1">
          Note: {visit.volunteer_notes}
        </p>
      )}
    </div>
  );
};

export default AdminVisits;