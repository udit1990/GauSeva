import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, ChevronRight, HandHeart, MapPin, Calendar, Clock, Users, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AdminDonors = () => {
  const [search, setSearch] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"donations" | "visits">("donations");

  // Fetch all profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-donor-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all orders with items count
  const { data: allOrders } = useQuery({
    queryKey: ["admin-all-orders-for-donors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, gaushalas_list(name), order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all visit bookings
  const { data: allVisits } = useQuery({
    queryKey: ["admin-all-visits-for-donors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_bookings")
        .select("*, gaushalas_list(name, city, state)")
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Build donor summaries
  const donorSummaries = profiles?.map((p) => {
    const orders = allOrders?.filter((o) => o.user_id === p.id) || [];
    const visits = allVisits?.filter((v) => v.user_id === p.id) || [];
    const totalDonated = orders.reduce((s, o) => s + Number(o.total_amount), 0);
    return {
      ...p,
      orderCount: orders.length,
      visitCount: visits.length,
      totalDonated,
      orders,
      visits,
    };
  }) || [];

  const filtered = donorSummaries.filter((d) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      d.full_name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.phone?.toLowerCase().includes(q)
    );
  });

  const selectedDonorData = filtered.find((d) => d.id === selectedDonor);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Stats
  const totalDonors = donorSummaries.length;
  const activeDonors = donorSummaries.filter((d) => d.orderCount > 0).length;
  const totalRevenue = donorSummaries.reduce((s, d) => s + d.totalDonated, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-foreground">{totalDonors}</p>
          <p className="text-[10px] text-muted-foreground">Total Donors</p>
        </div>
        <div className="rounded-lg bg-primary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-primary">{activeDonors}</p>
          <p className="text-[10px] text-muted-foreground">With Daans</p>
        </div>
        <div className="rounded-lg bg-secondary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-secondary">
            ₹{totalRevenue > 100000 ? `${(totalRevenue / 100000).toFixed(1)}L` : totalRevenue > 1000 ? `${(totalRevenue / 1000).toFixed(1)}K` : totalRevenue}
          </p>
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm rounded-lg"
        />
      </div>

      {/* Donor list / detail */}
      {selectedDonor && selectedDonorData ? (
        <div className="space-y-3">
          {/* Back + profile card */}
          <button
            onClick={() => setSelectedDonor(null)}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            ← Back to list
          </button>

          <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {selectedDonorData.full_name || "Unnamed"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{selectedDonorData.email}</p>
                {selectedDonorData.phone && (
                  <p className="text-xs text-muted-foreground">{selectedDonorData.phone}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-lg bg-muted/50 p-2">
                <p className="text-sm font-bold text-foreground">{selectedDonorData.orderCount}</p>
                <p className="text-[10px] text-muted-foreground">Daans</p>
              </div>
              <div className="text-center rounded-lg bg-muted/50 p-2">
                <p className="text-sm font-bold text-foreground">
                  ₹{selectedDonorData.totalDonated > 1000 ? `${(selectedDonorData.totalDonated / 1000).toFixed(1)}K` : selectedDonorData.totalDonated}
                </p>
                <p className="text-[10px] text-muted-foreground">Donated</p>
              </div>
              <div className="text-center rounded-lg bg-muted/50 p-2">
                <p className="text-sm font-bold text-foreground">{selectedDonorData.visitCount}</p>
                <p className="text-[10px] text-muted-foreground">Visits</p>
              </div>
            </div>
            {selectedDonorData.pan && (
              <p className="text-xs text-muted-foreground">PAN: {selectedDonorData.pan}</p>
            )}
          </div>

          {/* Tabs: Donations / Visits */}
          <div className="flex border-b border-border gap-1">
            <button
              onClick={() => setActiveTab("donations")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeTab === "donations"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <HandHeart className="h-3.5 w-3.5" />
              Donations ({selectedDonorData.orderCount})
            </button>
            <button
              onClick={() => setActiveTab("visits")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                activeTab === "visits"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <MapPin className="h-3.5 w-3.5" />
              Visits ({selectedDonorData.visitCount})
            </button>
          </div>

          {/* Donations list */}
          {activeTab === "donations" && (
            <div className="space-y-2">
              {selectedDonorData.orders.length > 0 ? (
                selectedDonorData.orders.map((order: any) => (
                  <div key={order.id} className="rounded-lg bg-card p-3 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        {order.gaushalas_list?.name && (
                          <p className="text-xs text-primary font-medium">{order.gaushalas_list.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {order.total_amount}
                        </p>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5",
                            order.status === "completed"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    {order.order_items?.length > 0 && (
                      <div className="border-t border-border pt-1.5 space-y-0.5">
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{item.sku_name} × {item.quantity}</span>
                            <span>₹{item.total_price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No donations yet</p>
              )}
            </div>
          )}

          {/* Visits list */}
          {activeTab === "visits" && (
            <div className="space-y-2">
              {selectedDonorData.visits.length > 0 ? (
                selectedDonorData.visits.map((visit: any) => {
                  const gaushala = visit.gaushalas_list as any;
                  return (
                    <div key={visit.id} className="rounded-lg bg-card p-3 shadow-sm space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{gaushala?.name || "Gaushala"}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[11px] text-muted-foreground">
                              {gaushala?.city}, {gaushala?.state}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                            visit.status === "confirmed" || visit.status === "visited"
                              ? "bg-secondary/15 text-secondary"
                              : visit.status === "cancelled"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary/15 text-primary"
                          )}
                        >
                          {visit.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(visit.visit_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{visit.time_slot}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{visit.num_visitors}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No visits booked</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Donor list */
        <div className="space-y-2">
          {filtered.length > 0 ? (
            filtered.map((donor) => (
              <button
                key={donor.id}
                onClick={() => { setSelectedDonor(donor.id); setActiveTab("donations"); }}
                className="w-full rounded-lg bg-card p-3 shadow-sm text-left flex items-center gap-3 active:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {donor.full_name || "Unnamed"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{donor.email || donor.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-primary">
                    ₹{donor.totalDonated > 1000 ? `${(donor.totalDonated / 1000).toFixed(1)}K` : donor.totalDonated}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {donor.orderCount} daan{donor.orderCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No donors found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDonors;
