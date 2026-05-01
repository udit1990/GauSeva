import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircleDot, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { processQueue, getQueueLength } from "@/lib/evidenceQueue";
import HomeTab from "@/components/volunteer/HomeTab";
import { HomeTabSkeleton } from "@/components/volunteer/VolunteerSkeletons";
import BottomNav from "@/components/BottomNav";
import {
  VOLUNTEER_ACTIONABLE_ORDER_STATUSES,
  isVolunteerCompletedOrderStatus,
} from "@/lib/volunteerOrderStatus";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["volunteer-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("assigned_volunteer", user.id)
        .in("status", [...VOLUNTEER_ACTIONABLE_ORDER_STATUSES])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ["volunteer-visits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("visit_bookings")
        .select("*, gaushalas_list(name, city, state, lat, lng)")
        .eq("assigned_volunteer", user.id)
        .order("visit_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: allEvidence } = useQuery({
    queryKey: ["volunteer-all-evidence", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("order_evidence")
        .select("*", { count: "exact", head: true })
        .eq("uploaded_by", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["volunteer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
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

  // Realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("volunteer-assignments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `assigned_volunteer=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["volunteer-orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visit_bookings", filter: `assigned_volunteer=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["volunteer-visits"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Retry queued uploads
  const [queueCount, setQueueCount] = useState(getQueueLength());
  useEffect(() => {
    const retry = async () => {
      if (getQueueLength() === 0) return;
      const { success, failed } = await processQueue();
      setQueueCount(failed);
      if (success > 0) {
        toast.success(`${success} queued upload(s) synced`);
        queryClient.invalidateQueries({ queryKey: ["volunteer-all-evidence"] });
      }
    };
    retry();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  const completedOrders = orders?.filter((o) => isVolunteerCompletedOrderStatus(o.status)).length || 0;
  const completedVisits = visits?.filter((v: any) => v.status === "visited").length || 0;
  const evidenceCount = allEvidence || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <h1 className="text-lg font-bold text-foreground">
                {profile?.full_name || user?.email?.split("@")[0] || "Volunteer"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
      </header>

      <div className="px-5 pt-4">
        {ordersLoading || visitsLoading ? (
          <HomeTabSkeleton />
        ) : (
          <HomeTab
            completedOrders={completedOrders}
            completedVisits={completedVisits}
            evidenceCount={evidenceCount}
            queueCount={queueCount}
            orders={orders || []}
            visits={visits || []}
            onGoOrders={() => navigate("/volunteer-orders")}
            onGoVisits={() => navigate("/volunteer-visits")}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VolunteerDashboard;
