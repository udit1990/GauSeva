import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const VolunteerStatusPanel = () => {
  const { data: volunteers } = useQuery({
    queryKey: ["admin-cmd-volunteers"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "volunteer");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, is_available, gaushala_id")
        .in("id", ids);
      return profiles || [];
    },
    staleTime: 30_000,
  });

  const { data: activeOrders } = useQuery({
    queryKey: ["admin-cmd-active-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, assigned_volunteer")
        .neq("status", "completed")
        .not("assigned_volunteer", "is", null)
        .limit(1000);
      return data || [];
    },
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    if (!volunteers) return { available: 0, busy: 0, offline: 0, total: 0, list: [] as any[] };

    const taskCounts: Record<string, number> = {};
    activeOrders?.forEach((o) => {
      if (o.assigned_volunteer) {
        taskCounts[o.assigned_volunteer] = (taskCounts[o.assigned_volunteer] || 0) + 1;
      }
    });

    const list = volunteers.map((v) => ({
      ...v,
      taskCount: taskCounts[v.id] || 0,
      status: !v.is_available ? "offline" as const
        : (taskCounts[v.id] || 0) > 0 ? "busy" as const
        : "available" as const,
    }));

    return {
      available: list.filter((v) => v.status === "available").length,
      busy: list.filter((v) => v.status === "busy").length,
      offline: list.filter((v) => v.status === "offline").length,
      total: list.length,
      list: list.sort((a, b) => b.taskCount - a.taskCount),
    };
  }, [volunteers, activeOrders]);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        Volunteer Status
      </h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-2 text-center">
          <UserCheck className="h-3 w-3 text-secondary mx-auto mb-0.5" />
          <p className="text-sm font-bold text-secondary">{stats.available}</p>
          <p className="text-[9px] text-muted-foreground">Available</p>
        </div>
        <div className="rounded-lg bg-accent/10 border border-accent/20 p-2 text-center">
          <Briefcase className="h-3 w-3 text-accent-foreground mx-auto mb-0.5" />
          <p className="text-sm font-bold text-accent-foreground">{stats.busy}</p>
          <p className="text-[9px] text-muted-foreground">Busy</p>
        </div>
        <div className="rounded-lg bg-muted border border-border p-2 text-center">
          <UserX className="h-3 w-3 text-muted-foreground mx-auto mb-0.5" />
          <p className="text-sm font-bold text-muted-foreground">{stats.offline}</p>
          <p className="text-[9px] text-muted-foreground">Offline</p>
        </div>
      </div>

      {/* Volunteer list */}
      <div className="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1">
        {stats.list.slice(0, 10).map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-md bg-card border border-border px-2.5 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground truncate">{v.full_name || v.phone || v.id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {v.taskCount > 0 && (
                <span className="text-[9px] font-medium text-accent-foreground bg-accent/10 rounded-full px-1.5 py-0.5">
                  {v.taskCount} task{v.taskCount > 1 ? "s" : ""}
                </span>
              )}
              <span className={cn(
                "h-2 w-2 rounded-full",
                v.status === "available" ? "bg-secondary" : v.status === "busy" ? "bg-accent-foreground" : "bg-muted-foreground"
              )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolunteerStatusPanel;
