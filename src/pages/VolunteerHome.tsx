import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CircleDot, Package, CalendarDays, Bell, ChevronRight,
  Sun, Clock, AlertTriangle, MapPin, Upload,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { processQueue, getQueueLength } from "@/lib/evidenceQueue";
import BottomNav from "@/components/BottomNav";
import dhyanText from "@/assets/dhyan-flag.png";
import dhyanFlag from "@/assets/dhyan-logo.png";
import {
  VOLUNTEER_ACTIONABLE_ORDER_STATUSES,
  isVolunteerActiveOrderStatus,
  isVolunteerCompletedOrderStatus,
} from "@/lib/volunteerOrderStatus";

const animalEmoji: Record<string, string> = { cow: "🐄", dog: "🐕", cat: "🐈", monkey: "🐒" };

const VolunteerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["volunteer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*, gaushalas_list(name, city)").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: orders } = useQuery({
    queryKey: ["volunteer-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("orders")
        .select("id, donor_name, total_amount, status, created_at, animal_type, expected_completion_at, gaushalas_list(name)")
        .eq("assigned_volunteer", user.id)
        .in("status", [...VOLUNTEER_ACTIONABLE_ORDER_STATUSES])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: visits } = useQuery({
    queryKey: ["volunteer-visits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("visit_bookings")
        .select("id, visitor_name, visit_date, time_slot, status, gaushalas_list(name, city)")
        .eq("assigned_volunteer", user.id)
        .order("visit_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const toggleAvailability = useMutation({
    mutationFn: async (available: boolean) => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ is_available: available } as any).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-profile"] });
      toast.success(profile?.is_available ? "Set as unavailable" : "Set as available");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("vol-home-assignments")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `assigned_volunteer=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["volunteer-orders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "visit_bookings", filter: `assigned_volunteer=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["volunteer-visits"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Queue
  const [queueCount, setQueueCount] = useState(getQueueLength());
  useEffect(() => {
    const retry = async () => {
      if (getQueueLength() === 0) return;
      const { success, failed } = await processQueue();
      setQueueCount(failed);
      if (success > 0) {
        toast.success(`${success} queued upload(s) synced`);
      }
    };
    retry();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  // Computed
  const pendingOrders = useMemo(() => orders?.filter((o) => isVolunteerActiveOrderStatus(o.status)) || [], [orders]);
  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders?.filter((o) => isVolunteerCompletedOrderStatus(o.status) && new Date(o.created_at).toDateString() === today).length || 0;
  }, [orders]);

  const overdueOrders = useMemo(() => {
    return pendingOrders.filter((o) => {
      if (o.expected_completion_at) return new Date(o.expected_completion_at) < new Date();
      return (Date.now() - new Date(o.created_at).getTime()) > 48 * 3600000;
    });
  }, [pendingOrders]);

  // Group by animal type
  const animalBuckets = useMemo(() => {
    const buckets: Record<string, typeof pendingOrders> = { cow: [], dog: [], other: [] };
    pendingOrders.forEach((o) => {
      const type = o.animal_type || "cow";
      if (type === "cow") buckets.cow.push(o);
      else if (type === "dog") buckets.dog.push(o);
      else buckets.other.push(o);
    });
    return buckets;
  }, [pendingOrders]);

  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = visits?.filter((v: any) => v.visit_date === today) || [];
  const gaushalaName = (profile?.gaushalas_list as any)?.name;
  const gaushalaCity = (profile?.gaushalas_list as any)?.city;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-5 pt-10 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={dhyanText} alt="Dhyan Foundation" className="h-6 object-contain" />
            <img src={dhyanFlag} alt="" className="h-8 object-contain -ml-0.5 -mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/alerts")}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {(unreadCount || 0) > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {(unreadCount || 0) > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 space-y-4">
        {/* Welcome + Availability */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <h1 className="text-lg font-bold text-foreground">
                {profile?.full_name || "Volunteer"}
              </h1>
              {gaushalaName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{gaushalaName}{gaushalaCity ? `, ${gaushalaCity}` : ""}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <CircleDot className={cn("h-3 w-3", profile?.is_available ? "text-secondary" : "text-muted-foreground")} />
                <span className="text-[10px] text-muted-foreground">{profile?.is_available ? "Available" : "Away"}</span>
                <Switch
                  checked={profile?.is_available ?? true}
                  onCheckedChange={(v) => toggleAvailability.mutate(v)}
                  disabled={toggleAvailability.isPending}
                  className="scale-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-xl font-bold text-primary">{pendingOrders.length}</p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-xl font-bold text-secondary">{completedToday}</p>
            <p className="text-[10px] text-muted-foreground">Done Today</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className={cn("text-xl font-bold", queueCount > 0 ? "text-destructive" : "text-muted-foreground")}>{queueCount}</p>
            <p className="text-[10px] text-muted-foreground">Queued</p>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueOrders.length > 0 && (
          <button
            onClick={() => navigate("/volunteer-tasks")}
            className="w-full rounded-xl bg-destructive/5 border border-destructive/20 p-3 flex items-center gap-2.5 active:scale-[0.98] transition-transform"
          >
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-destructive">{overdueOrders.length} overdue task(s)</p>
              <p className="text-[10px] text-muted-foreground">Tap to view and complete</p>
            </div>
            <ChevronRight className="h-4 w-4 text-destructive shrink-0" />
          </button>
        )}

        {/* Priority Tasks — Animal Buckets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-primary" />
              Priority Tasks
            </h2>
            <button onClick={() => navigate("/volunteer-tasks")} className="text-[10px] font-medium text-primary flex items-center gap-0.5">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {pendingOrders.length === 0 && todayVisits.length === 0 && (
            <div className="rounded-xl bg-secondary/5 border border-secondary/20 p-4 flex items-center gap-3">
              <Sun className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-semibold text-foreground">All clear! 🎉</p>
                <p className="text-[11px] text-muted-foreground">No pending tasks. Enjoy your day.</p>
              </div>
            </div>
          )}

          {/* Cow bucket */}
          {animalBuckets.cow.length > 0 && (
            <AnimalBucket
              emoji="🐄"
              label="Cow Tasks"
              orders={animalBuckets.cow}
              onTap={(id) => navigate(`/volunteer-task/${id}`)}
            />
          )}

          {/* Dog bucket */}
          {animalBuckets.dog.length > 0 && (
            <AnimalBucket
              emoji="🐕"
              label="Dog Tasks"
              orders={animalBuckets.dog}
              onTap={(id) => navigate(`/volunteer-task/${id}`)}
            />
          )}

          {/* Others bucket */}
          {animalBuckets.other.length > 0 && (
            <AnimalBucket
              emoji="🐾"
              label="Other Animals"
              orders={animalBuckets.other}
              onTap={(id) => navigate(`/volunteer-task/${id}`)}
            />
          )}
        </div>

        {/* Today Visits */}
        {todayVisits.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Today's Visits
              </h3>
              <button onClick={() => navigate("/volunteer-visits")} className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1.5">
              {todayVisits.slice(0, 3).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate">{v.visitor_name}</p>
                    <p className="text-[10px] text-muted-foreground">{(v.gaushalas_list as any)?.name || "—"}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0 ml-2">{v.time_slot}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Upload Banner */}
        {queueCount > 0 && (
          <button
            onClick={() => navigate("/volunteer-uploads")}
            className="w-full rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-2.5 active:scale-[0.98] transition-transform"
          >
            <Upload className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-primary">{queueCount} upload(s) pending</p>
              <p className="text-[10px] text-muted-foreground">Tap to manage offline queue</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary shrink-0" />
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

/** Animal type task bucket */
const AnimalBucket = ({ emoji, label, orders, onTap }: {
  emoji: string;
  label: string;
  orders: any[];
  onTap: (id: string) => void;
}) => {
  // Sort overdue first
  const sorted = [...orders].sort((a, b) => {
    const aOverdue = a.expected_completion_at ? new Date(a.expected_completion_at) < new Date() : (Date.now() - new Date(a.created_at).getTime()) > 48 * 3600000;
    const bOverdue = b.expected_completion_at ? new Date(b.expected_completion_at) < new Date() : (Date.now() - new Date(b.created_at).getTime()) > 48 * 3600000;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="rounded-xl bg-card border border-border p-3.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <p className="text-xs font-bold text-foreground">{label}</p>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{orders.length}</span>
      </div>
      {sorted.slice(0, 3).map((o) => {
        const isOverdue = o.expected_completion_at
          ? new Date(o.expected_completion_at) < new Date()
          : (Date.now() - new Date(o.created_at).getTime()) > 48 * 3600000;
        return (
          <button
            key={o.id}
            onClick={() => onTap(o.id)}
            className="w-full flex items-center justify-between py-1.5 border-b border-border last:border-0 text-left active:bg-muted/50 transition-colors rounded"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-foreground truncate">{o.donor_name}</p>
                {isOverdue && <AlertTriangle className="h-2.5 w-2.5 text-destructive shrink-0" />}
              </div>
              <p className="text-[10px] text-muted-foreground">₹{Number(o.total_amount).toLocaleString("en-IN")}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>
        );
      })}
      {orders.length > 3 && (
        <p className="text-[10px] text-muted-foreground text-center">+{orders.length - 3} more</p>
      )}
    </div>
  );
};

export default VolunteerHome;
