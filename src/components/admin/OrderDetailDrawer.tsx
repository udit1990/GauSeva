import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ImageIcon, Clock, MapPin, Phone, Mail, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { useSignedEvidenceUrls } from "@/hooks/useSignedEvidenceUrls";

interface OrderDetailDrawerProps {
  orderId: string | null;
  onClose: () => void;
}

const OrderDetailDrawer = ({ orderId, onClose }: OrderDetailDrawerProps) => {
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const { getSignedUrls } = useSignedEvidenceUrls();

  const { data: order } = useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await supabase
        .from("orders")
        .select("*, gaushalas_list(name)")
        .eq("id", orderId)
        .single();
      return data;
    },
    enabled: !!orderId,
  });

  const { data: orderItems } = useQuery({
    queryKey: ["admin-order-detail-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      return data || [];
    },
    enabled: !!orderId,
  });

  const { data: evidence } = useQuery({
    queryKey: ["admin-order-detail-evidence", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data } = await supabase
        .from("order_evidence")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at");
      if (!data || data.length === 0) return [];
      const paths = data.map((e) => e.storage_path);
      const urls = await getSignedUrls(paths);
      return data.map((e) => ({
        ...e,
        publicUrl: urls[e.storage_path] || "",
      }));
    },
    enabled: !!orderId,
  });

  const { data: volunteers } = useQuery({
    queryKey: ["admin-cmd-assign-vols"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "volunteer");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone, gaushala_id").in("id", ids);
      return profiles || [];
    },
    staleTime: 60_000,
  });

  const assignMutation = useMutation({
    mutationFn: async (volunteerId: string) => {
      if (!orderId) throw new Error("No order");
      const { error } = await supabase.from("orders").update({ assigned_volunteer: volunteerId }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-live-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kpi-orders"] });
      setShowAssign(false);
      toast.success("Volunteer assigned");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const assignedVol = volunteers?.find((v) => v.id === order?.assigned_volunteer);

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm">Order Details</SheetTitle>
        </SheetHeader>

        {order && (
          <div className="space-y-4 mt-4">
            {/* Donor info */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{order.donor_name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.donor_phone}</span>
                {order.donor_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{order.donor_email}</span>}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">Amount</p>
                <p className="text-sm font-bold text-primary">₹{order.total_amount}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">Status</p>
                <p className={cn("text-sm font-bold capitalize", order.status === "completed" ? "text-secondary" : "text-primary")}>
                  {order.status}
                </p>
              </div>
              {order.animal_type && (
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">Animal</p>
                  <p className="text-sm font-medium text-foreground capitalize">{order.animal_type}</p>
                </div>
              )}
              {(order.gaushalas_list as any)?.name && (
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">Location</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {(order.gaushalas_list as any).name}
                  </p>
                </div>
              )}
              {order.expected_completion_at && (
                <div className="rounded-lg bg-muted/50 p-2 col-span-2">
                  <p className="text-[10px] text-muted-foreground">Expected Completion</p>
                  <p className={cn("text-sm font-medium flex items-center gap-1",
                    new Date(order.expected_completion_at) < new Date() && order.status !== "completed" ? "text-destructive" : "text-foreground"
                  )}>
                    <Clock className="h-3 w-3" />
                    {new Date(order.expected_completion_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            {orderItems && orderItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> Items
                </p>
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs border-b border-border pb-1 last:border-0">
                    <span className="text-foreground">{item.sku_name} × {item.quantity}</span>
                    <span className="text-muted-foreground">₹{item.total_price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Assigned volunteer */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <UserPlus className="h-3.5 w-3.5" /> Volunteer
              </p>
              {assignedVol ? (
                <div className="rounded-lg bg-muted/30 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{assignedVol.full_name || assignedVol.phone}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2" onClick={() => setShowAssign(true)}>
                    Reassign
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="text-xs w-full" onClick={() => setShowAssign(true)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Assign Volunteer
                </Button>
              )}
              {showAssign && (
                <div className="space-y-1.5">
                  <Select onValueChange={(v) => assignMutation.mutate(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteers?.map((v) => {
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
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowAssign(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Evidence */}
            {evidence && evidence.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" /> Evidence ({evidence.length})
                </p>
                <div className="grid grid-cols-3 gap-1.5">
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

            <p className="text-[10px] text-muted-foreground pt-2">
              Created {new Date(order.created_at).toLocaleString("en-IN")} · ID: {order.id.slice(0, 8)}…
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailDrawer;
