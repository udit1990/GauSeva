import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ChevronRight, UserPlus, ImageIcon, CalendarIcon, X } from "lucide-react";
import AuditTrail from "./AuditTrail";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSignedEvidenceUrls } from "@/hooks/useSignedEvidenceUrls";
import { useGaushalas } from "@/hooks/useGaushalas";

const statusFilters = ["all", "pending", "completed"] as const;

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const { getSignedUrls } = useSignedEvidenceUrls();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [gaushalaFilter, setGaushalaFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const { data: gaushalas } = useGaushalas(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, gaushalas_list(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: volunteers } = useQuery({
    queryKey: ["admin-volunteers"],
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

  const { data: orderItems } = useQuery({
    queryKey: ["admin-order-items", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedOrder);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  const { data: evidence } = useQuery({
    queryKey: ["admin-order-evidence", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data } = await supabase
        .from("order_evidence")
        .select("*")
        .eq("order_id", selectedOrder)
        .order("created_at");
      if (!data || data.length === 0) return [];
      const paths = data.map((e) => e.storage_path);
      const urls = await getSignedUrls(paths);
      return data.map((e) => ({
        ...e,
        publicUrl: urls[e.storage_path] || "",
      }));
    },
    enabled: !!selectedOrder,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ orderId, volunteerId }: { orderId: string; volunteerId: string }) => {
      const { error } = await supabase.from("orders").update({ assigned_volunteer: volunteerId }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setAssigningOrder(null);
      toast.success("Volunteer assigned");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredOrders = orders?.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (gaushalaFilter !== "all" && o.gaushala_id !== gaushalaFilter) return false;
    if (dateFrom) {
      const orderDate = new Date(o.created_at);
      if (orderDate < dateFrom) return false;
    }
    if (dateTo) {
      const orderDate = new Date(o.created_at);
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (orderDate > endOfDay) return false;
    }
    return true;
  });

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  const pendingCount = orders?.filter((o) => o.status === "pending").length || 0;
  const completedCount = orders?.filter((o) => o.status === "completed").length || 0;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-foreground">{orders?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg bg-primary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-primary">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-lg bg-secondary/5 p-2.5 shadow-sm text-center">
          <p className="text-lg font-bold text-secondary">{completedCount}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2.5">
        {/* Status pills */}
        <div className="flex gap-1.5">
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

        {/* Gaushala filter */}
        <Select value={gaushalaFilter} onValueChange={setGaushalaFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Gaushalas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Gaushalas</SelectItem>
            {gaushalas?.map((g) => (
              <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs flex-1 justify-start", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs flex-1 justify-start", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateTo ? format(dateTo, "dd MMM yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo || gaushalaFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => { setDateFrom(undefined); setDateTo(undefined); setGaushalaFilter("all"); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Orders list */}
      {filteredOrders?.map((order: any) => (
        <div key={order.id} className="rounded-lg bg-card shadow-sm overflow-hidden">
          <button
            onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
            className="w-full p-3 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{order.donor_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" • "}{order.donor_phone}
                </p>
                {order.gaushalas_list?.name && (
                  <p className="text-xs text-primary font-medium mt-0.5">{order.gaushalas_list.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">₹{order.total_amount}</span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedOrder === order.id ? "rotate-90" : ""}`} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                order.status === "completed" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
              }`}>
                {order.status}
              </span>
              {order.assigned_volunteer && (() => {
                const vol = volunteers?.find((v: any) => v.id === order.assigned_volunteer);
                const isAutoAssigned = vol && vol.gaushala_id === order.gaushala_id;
                return (
                  <span className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isAutoAssigned ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                  )}>
                    {isAutoAssigned ? "⚡ Auto-assigned" : "✋ Manual"}
                    {vol ? ` · ${vol.full_name}` : ""}
                  </span>
                );
              })()}
              {!order.assigned_volunteer && order.gaushala_id && (
                <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">
                  Unassigned
                </span>
              )}
            </div>
          </button>

          {selectedOrder === order.id && (
            <div className="border-t border-border p-3 space-y-3">
              {/* Items */}
              {orderItems && orderItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</p>
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-foreground">{item.sku_name} × {item.quantity}</span>
                      <span className="text-muted-foreground">₹{item.total_price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Assign volunteer */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Volunteer</p>
                {order.assigned_volunteer && (() => {
                  const vol = volunteers?.find((v: any) => v.id === order.assigned_volunteer);
                  const isAutoAssigned = vol && vol.gaushala_id === order.gaushala_id;
                  return (
                    <div className="rounded-lg bg-muted/30 p-2 mb-1.5">
                      <div className="flex items-center justify-between">
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
                    </div>
                  );
                })()}
                {assigningOrder === order.id ? (
                  <div className="space-y-1">
                    <Select onValueChange={(v) => assignMutation.mutate({ orderId: order.id, volunteerId: v })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select volunteer" />
                      </SelectTrigger>
                      <SelectContent>
                        {volunteers?.map((v: any) => {
                          const isTagged = v.gaushala_id === order.gaushala_id;
                          return (
                            <SelectItem key={v.id} value={v.id} className="text-xs">
                              {v.full_name || v.phone || v.id.slice(0, 8)}
                              {isTagged ? " ⚡" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setAssigningOrder(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-lg"
                    onClick={() => setAssigningOrder(order.id)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {order.assigned_volunteer ? "Override Assignment" : "Assign Volunteer"}
                  </Button>
                )}
              </div>

              {/* Evidence */}
              {evidence && evidence.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Evidence ({evidence.length})
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {evidence.map((e) => (
                      <div key={e.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                        {e.media_type === "video" ? (
                          <video src={e.publicUrl} className="h-full w-full object-cover" />
                        ) : (
                          <img src={e.publicUrl} alt={e.caption || ""} className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Audit Trail */}
              <AuditTrail entityType="order" entityId={order.id} volunteers={volunteers || []} />

              <p className="text-[10px] text-muted-foreground">ID: {order.id.slice(0, 8)}…</p>
            </div>
          )}
        </div>
      ))}
      {filteredOrders?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No orders found</p>}
    </div>
  );
};

export default AdminOrders;
