import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminFilters } from "@/contexts/AdminFilterContext";
import { useMemo, useEffect } from "react";

export interface AdminOrder {
  id: string;
  donor_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_volunteer: string | null;
  expected_completion_at: string | null;
  animal_type: string | null;
  persona: string | null;
  gaushala_id: string | null;
  gaushalas_list: { name: string } | null;
}

/**
 * Single source of truth for admin order data.
 * Both KPIs and LiveFeed consume this hook — same query key, same data.
 * Realtime subscription auto-invalidates on changes.
 */
export const useAdminOrders = () => {
  const queryClient = useQueryClient();
  const { persona, animal } = useAdminFilters();

  const { data: rawOrders, isLoading } = useQuery({
    queryKey: ["admin-orders-shared"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, donor_name, total_amount, status, created_at, updated_at, assigned_volunteer, expected_completion_at, animal_type, persona, gaushala_id, gaushalas_list(name)")
        .order("updated_at", { ascending: false })
        .limit(1000);
      return (data || []) as AdminOrder[];
    },
    staleTime: 15_000,
  });

  // Realtime subscription — single channel for the shared dataset
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-shared-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-orders-shared"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtered by global context
  const filtered = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders.filter((o) => {
      if (persona !== "all" && o.persona !== persona) return false;
      if (animal !== "all" && o.animal_type !== animal) return false;
      return true;
    });
  }, [rawOrders, persona, animal]);

  // KPI computations — memoized with stable `now` snapshot
  const kpis = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    return {
      pending: filtered.filter((o) => o.status === "pending" && !o.assigned_volunteer).length,
      active: filtered.filter((o) => !!o.assigned_volunteer && o.status !== "completed").length,
      delayed: filtered.filter((o) => {
        if (!o.expected_completion_at || o.status === "completed") return false;
        return new Date(o.expected_completion_at) < now;
      }).length,
      completedToday: filtered.filter((o) => {
        if (o.status !== "completed") return false;
        return new Date(o.updated_at).toDateString() === todayStr;
      }).length,
    };
  }, [filtered]);

  // Live feed — top 20 of filtered
  const liveFeed = useMemo(() => filtered.slice(0, 20), [filtered]);

  return {
    orders: rawOrders || [],
    filtered,
    liveFeed,
    kpis,
    isLoading,
  };
};
