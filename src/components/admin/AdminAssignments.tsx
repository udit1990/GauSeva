import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { UserPlus, ShoppingBag, CalendarDays, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGaushalas } from "@/hooks/useGaushalas";

type ViewFilter = "unassigned" | "assigned" | "all";

const AdminAssignments = () => {
  const queryClient = useQueryClient();
  const [viewFilter, setViewFilter] = useState<ViewFilter>("unassigned");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const { data: gaushalas } = useGaushalas(false);

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-assign-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, donor_name, donor_phone, total_amount, status, created_at, gaushala_id, assigned_volunteer, gaushalas_list(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: visits, isLoading: loadingVisits } = useQuery({
    queryKey: ["admin-assign-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_bookings")
        .select("id, visitor_name, visitor_phone, visit_date, time_slot, status, gaushala_id, assigned_volunteer, gaushalas_list(name)")
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: volunteers } = useQuery({
    queryKey: ["admin-assign-volunteers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "volunteer");
      if (error) throw error;
      if (!data?.length) return [];
      const ids = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, gaushala_id")
        .in("id", ids);
      return profiles || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ table, id, volunteerId }: { table: "orders" | "visit_bookings"; id: string; volunteerId: string }) => {
      const { error } = await supabase.from(table).update({ assigned_volunteer: volunteerId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assign-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-assign-visits"] });
      setAssigningId(null);
      toast.success("Volunteer assigned");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Build unified items
  type AssignItem = {
    id: string;
    type: "order" | "visit";
    table: "orders" | "visit_bookings";
    title: string;
    subtitle: string;
    gaushalaName: string | null;
    gaushalaId: string | null;
    assignedVolunteer: string | null;
    status: string;
    date: string;
  };

  const items: AssignItem[] = [
    ...(orders?.map((o) => ({
      id: o.id,
      type: "order" as const,
      table: "orders" as const,
      title: o.donor_name,
      subtitle: `₹${o.total_amount} • ${o.donor_phone}`,
      gaushalaName: (o.gaushalas_list as any)?.name || null,
      gaushalaId: o.gaushala_id,
      assignedVolunteer: o.assigned_volunteer,
      status: o.status,
      date: o.created_at,
    })) || []),
    ...(visits?.map((v) => ({
      id: v.id,
      type: "visit" as const,
      table: "visit_bookings" as const,
      title: v.visitor_name,
      subtitle: `${v.visit_date} • ${v.time_slot}`,
      gaushalaName: (v.gaushalas_list as any)?.name || null,
      gaushalaId: v.gaushala_id,
      assignedVolunteer: v.assigned_volunteer,
      status: v.status,
      date: v.visit_date,
    })) || []),
  ];

  const filtered = items.filter((item) => {
    if (viewFilter === "unassigned") return !item.assignedVolunteer;
    if (viewFilter === "assigned") return !!item.assignedVolunteer;
    return true;
  });

  // Sort: unassigned first, then by date desc
  filtered.sort((a, b) => {
    if (!a.assignedVolunteer && b.assignedVolunteer) return -1;
    if (a.assignedVolunteer && !b.assignedVolunteer) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const unassignedCount = items.filter((i) => !i.assignedVolunteer).length;
  const assignedCount = items.filter((i) => !!i.assignedVolunteer).length;

  const getVolName = (id: string | null) => {
    if (!id) return null;
    const v = volunteers?.find((vol: any) => vol.id === id);
    return v?.full_name || v?.phone || id.slice(0, 8);
  };

  const isLoading = loadingOrders || loadingVisits;

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-foreground">{items.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg bg-destructive/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-destructive">{unassignedCount}</p>
          <p className="text-[10px] text-muted-foreground">Unassigned</p>
        </div>
        <div className="rounded-lg bg-secondary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-secondary">{assignedCount}</p>
          <p className="text-[10px] text-muted-foreground">Assigned</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {([
          { key: "unassigned", label: `Unassigned (${unassignedCount})` },
          { key: "assigned", label: `Assigned (${assignedCount})` },
          { key: "all", label: "All" },
        ] as { key: ViewFilter; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setViewFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              viewFilter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.map((item) => {
        const isAutoAssigned = item.assignedVolunteer && volunteers?.find((v: any) => v.id === item.assignedVolunteer)?.gaushala_id === item.gaushalaId;

        return (
          <div key={`${item.type}-${item.id}`} className="rounded-lg bg-card shadow-sm p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {item.type === "order" ? (
                    <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <CalendarDays className="h-3.5 w-3.5 text-accent-foreground shrink-0" />
                  )}
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                {item.gaushalaName && (
                  <p className="text-xs text-primary font-medium mt-0.5">{item.gaushalaName}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <span className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                  item.type === "order" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                )}>
                  {item.type}
                </span>
                {item.assignedVolunteer ? (
                  <span className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isAutoAssigned ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                  )}>
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {isAutoAssigned ? "Auto" : "Manual"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">
                    <AlertCircle className="h-2.5 w-2.5" />
                    Unassigned
                  </span>
                )}
              </div>
            </div>

            {/* Assigned volunteer info */}
            {item.assignedVolunteer && (
              <div className="rounded-md bg-muted/30 px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-xs text-foreground font-medium">{getVolName(item.assignedVolunteer)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] h-6 px-2"
                  onClick={() => setAssigningId(`${item.type}-${item.id}`)}
                >
                  Override
                </Button>
              </div>
            )}

            {/* Assign controls */}
            {(assigningId === `${item.type}-${item.id}` || !item.assignedVolunteer) && (
              <div className="space-y-1.5">
                <Select onValueChange={(v) => assignMutation.mutate({ table: item.table, id: item.id, volunteerId: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers?.map((v: any) => {
                      const isTagged = v.gaushala_id === item.gaushalaId;
                      return (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          {v.full_name || v.phone || v.id.slice(0, 8)}
                          {isTagged ? " ⚡" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {assigningId === `${item.type}-${item.id}` && (
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAssigningId(null)}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {viewFilter === "unassigned" ? "All orders & visits are assigned 🎉" : "No items found"}
        </p>
      )}
    </div>
  );
};

export default AdminAssignments;
