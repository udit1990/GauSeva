import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Package, Users, MapPin, Clock, IndianRupee, AlertCircle, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Period = "today" | "week" | "month" | "all";

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

const AdminOverview = ({ onNavigate }: AdminOverviewProps) => {
  const [period, setPeriod] = useState<Period>("month");

  const { data: orders } = useQuery({
    queryKey: ["admin-overview-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, gaushala_id, assigned_volunteer, gaushalas_list(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: visits } = useQuery({
    queryKey: ["admin-overview-visits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("visit_bookings")
        .select("id, status, visit_date, gaushala_id")
        .order("visit_date", { ascending: false });
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-overview-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, created_at");
      return data || [];
    },
  });

  const { data: topSkus } = useQuery({
    queryKey: ["admin-overview-top-skus"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("sku_name, quantity");
      if (!data) return [];
      const map: Record<string, number> = {};
      data.forEach((item) => {
        map[item.sku_name] = (map[item.sku_name] || 0) + item.quantity;
      });
      return Object.entries(map)
        .map(([name, qty]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6);
    },
  });

  const { data: evidence } = useQuery({
    queryKey: ["admin-overview-evidence"],
    queryFn: async () => {
      const { data } = await supabase.from("order_evidence").select("id, order_id");
      return data || [];
    },
  });

  // Period filter
  const filterByPeriod = (dateStr: string) => {
    if (period === "all") return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (period === "today") {
      return date.toDateString() === now.toDateString();
    }
    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    if (period === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    }
    return true;
  };

  const periodOrders = orders?.filter((o) => filterByPeriod(o.created_at)) || [];
  const totalRevenue = periodOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const pendingOrders = periodOrders.filter((o) => o.status === "pending").length;
  const completedOrders = periodOrders.filter((o) => o.status === "completed").length;
  const totalDonors = profiles?.length || 0;

  // Pending actions
  const unassignedOrders = orders?.filter((o) => o.status === "pending" && !o.assigned_volunteer).length || 0;
  const ordersWithoutEvidence = orders?.filter((o) => {
    const hasEvidence = evidence?.some((e) => e.order_id === o.id);
    return o.status === "pending" && !hasEvidence;
  }).length || 0;
  const upcomingVisits = visits?.filter((v) => {
    const vDate = new Date(v.visit_date);
    return vDate >= new Date() && v.status === "pending";
  }).length || 0;

  // Gaushala breakdown
  const gaushalaBreakdown = orders?.reduce((acc, o) => {
    const name = (o.gaushalas_list as any)?.name || "Unknown";
    acc[name] = (acc[name] || 0) + Number(o.total_amount);
    return acc;
  }, {} as Record<string, number>) || {};
  const gaushalaData = Object.entries(gaushalaBreakdown)
    .map(([name, amount]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Recent activity
  const recentOrders = (orders || []).slice(0, 8).map((o) => ({
    id: o.id,
    type: "order" as const,
    text: `${(o as any).donor_name || "Donor"} — ₹${o.total_amount}`,
    subtext: (o.gaushalas_list as any)?.name,
    date: o.created_at,
    status: o.status,
  }));

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "7 Days" },
    { key: "month", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="space-y-5">
      {/* Period Toggle */}
      <div className="flex gap-1.5">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              period === p.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Revenue + Key Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{periodOrders.length} orders</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Pending</span>
          </div>
          <p className="text-lg font-bold text-primary">{pendingOrders}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <p className="text-lg font-bold text-secondary">{completedOrders}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-foreground" />
            <span className="text-[10px] text-muted-foreground">Donors</span>
          </div>
          <p className="text-lg font-bold text-foreground">{totalDonors}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-3.5 w-3.5 text-foreground" />
            <span className="text-[10px] text-muted-foreground">Visits</span>
          </div>
          <p className="text-lg font-bold text-foreground">{upcomingVisits} upcoming</p>
        </div>
      </div>

      {/* Pending Actions */}
      {(unassignedOrders > 0 || ordersWithoutEvidence > 0 || upcomingVisits > 0) && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 space-y-2">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            Pending Actions
          </h3>
          <div className="space-y-1">
            {unassignedOrders > 0 && (
              <button
                onClick={() => onNavigate?.("assignments")}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
              >
                <span><span className="font-semibold text-foreground">{unassignedOrders}</span> orders need volunteer assignment</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {ordersWithoutEvidence > 0 && (
              <button
                onClick={() => onNavigate?.("orders")}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
              >
                <span><span className="font-semibold text-foreground">{ordersWithoutEvidence}</span> orders missing evidence</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {upcomingVisits > 0 && (
              <button
                onClick={() => onNavigate?.("visits")}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
              >
                <span><span className="font-semibold text-foreground">{upcomingVisits}</span> upcoming visits to manage</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top SKUs Chart */}
      {topSkus && topSkus.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Top SKUs by Quantity
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topSkus} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gaushala Breakdown */}
      {gaushalaData.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Gaushala-wise Revenue
          </h3>
          <div className="space-y-2">
            {gaushalaData.map((g) => (
              <div key={g.name} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{g.name}</span>
                <span className="text-xs font-semibold text-foreground">{formatCurrency(g.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-xs font-semibold text-foreground mb-3">Recent Orders</h3>
        <div className="space-y-2">
          {recentOrders.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">{item.text}</p>
                {item.subtext && <p className="text-[10px] text-muted-foreground">{item.subtext}</p>}
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                  item.status === "completed" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                )}>
                  {item.status}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;