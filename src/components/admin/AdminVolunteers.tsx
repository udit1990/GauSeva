import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Package, Camera, MapPin, Check, X, ArrowRightLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminVolunteers = () => {
  const queryClient = useQueryClient();
  const [editingVolunteer, setEditingVolunteer] = useState<string | null>(null);
  const [selectedGaushala, setSelectedGaushala] = useState<string>("");

  const { data: volunteers, isLoading } = useQuery({
    queryKey: ["admin-volunteer-list"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "volunteer");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, gaushala_id")
        .in("id", ids);
      return profiles || [];
    },
  });

  const { data: gaushalas } = useQuery({
    queryKey: ["admin-gaushalas-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gaushalas_list")
        .select("id, name, city, state")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const { data: changeRequests } = useQuery({
    queryKey: ["admin-gaushala-change-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gaushala_change_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-volunteer-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, assigned_volunteer, status");
      return data || [];
    },
  });

  const { data: evidence } = useQuery({
    queryKey: ["admin-volunteer-evidence"],
    queryFn: async () => {
      const { data } = await supabase.from("order_evidence").select("id, uploaded_by");
      return data || [];
    },
  });

  const { data: visits } = useQuery({
    queryKey: ["admin-volunteer-visits"],
    queryFn: async () => {
      const { data } = await supabase.from("visit_bookings").select("id, assigned_volunteer, status");
      return data || [];
    },
  });

  const assignGaushala = useMutation({
    mutationFn: async ({ volunteerId, gaushalaId }: { volunteerId: string; gaushalaId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ gaushala_id: gaushalaId } as any)
        .eq("id", volunteerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-volunteer-list"] });
      setEditingVolunteer(null);
      setSelectedGaushala("");
      toast.success("Gaushala assigned successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleChangeRequest = useMutation({
    mutationFn: async ({ requestId, action, volunteerId, gaushalaId }: {
      requestId: string; action: "approved" | "rejected"; volunteerId: string; gaushalaId: string;
    }) => {
      // Update request status
      const { error: reqErr } = await supabase
        .from("gaushala_change_requests")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq("id", requestId);
      if (reqErr) throw reqErr;

      // If approved, update volunteer's gaushala
      if (action === "approved") {
        const { error: profErr } = await supabase
          .from("profiles")
          .update({ gaushala_id: gaushalaId } as any)
          .eq("id", volunteerId);
        if (profErr) throw profErr;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-volunteer-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gaushala-change-requests"] });
      toast.success(vars.action === "approved" ? "Change request approved" : "Change request rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getGaushalaName = (id: string | null) => {
    if (!id) return null;
    return gaushalas?.find((g) => g.id === id);
  };

  const getVolunteerName = (id: string) => {
    return volunteers?.find((v) => v.id === id)?.full_name || "Unknown";
  };

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  const volunteerStats = volunteers?.map((v) => {
    const assignedOrders = orders?.filter((o) => o.assigned_volunteer === v.id).length || 0;
    const completedOrders = orders?.filter((o) => o.assigned_volunteer === v.id && o.status === "completed").length || 0;
    const evidenceCount = evidence?.filter((e) => e.uploaded_by === v.id).length || 0;
    const assignedVisits = visits?.filter((vi) => vi.assigned_volunteer === v.id).length || 0;
    return { ...v, assignedOrders, completedOrders, evidenceCount, assignedVisits };
  }) || [];

  const pendingRequests = changeRequests || [];

  return (
    <div className="space-y-4">
      {/* Change Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Pending Change Requests</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{pendingRequests.length}</span>
          </div>
          {pendingRequests.map((req: any) => {
            const currentG = getGaushalaName(req.current_gaushala_id);
            const requestedG = getGaushalaName(req.requested_gaushala_id);
            return (
              <div key={req.id} className="rounded-xl bg-card border border-primary/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{getVolunteerName(req.volunteer_id)}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentG ? `${currentG.name}, ${currentG.city}` : "Unassigned"}</span>
                  <span>→</span>
                  <span className="font-medium text-foreground">{requestedG ? `${requestedG.name}, ${requestedG.city}` : "Unknown"}</span>
                </div>
                {req.reason && <p className="text-xs text-muted-foreground italic">"{req.reason}"</p>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-lg text-xs h-7 flex-1"
                    onClick={() => handleChangeRequest.mutate({
                      requestId: req.id, action: "approved",
                      volunteerId: req.volunteer_id, gaushalaId: req.requested_gaushala_id,
                    })}
                    disabled={handleChangeRequest.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs h-7 flex-1"
                    onClick={() => handleChangeRequest.mutate({
                      requestId: req.id, action: "rejected",
                      volunteerId: req.volunteer_id, gaushalaId: req.requested_gaushala_id,
                    })}
                    disabled={handleChangeRequest.isPending}
                  >
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Volunteers List */}
      {volunteerStats.length > 0 ? (
        volunteerStats.map((v) => {
          const gaushala = getGaushalaName(v.gaushala_id);
          const isEditing = editingVolunteer === v.id;
          return (
            <div key={v.id} className="rounded-xl bg-card border border-border p-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{v.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{v.phone || v.email}</p>
                </div>
              </div>

              {/* Gaushala Assignment */}
              <div className="rounded-lg bg-muted/30 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium text-muted-foreground">Tagged Gaushala</span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => { setEditingVolunteer(v.id); setSelectedGaushala(v.gaushala_id || ""); }}
                      className="text-[11px] text-primary font-medium"
                    >
                      {gaushala ? "Change" : "Assign"}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Select value={selectedGaushala} onValueChange={setSelectedGaushala}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Select gaushala" />
                      </SelectTrigger>
                      <SelectContent>
                        {gaushalas?.map((g) => (
                          <SelectItem key={g.id} value={g.id} className="text-xs">
                            {g.name}, {g.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 text-xs rounded-lg"
                      onClick={() => assignGaushala.mutate({ volunteerId: v.id, gaushalaId: selectedGaushala || null })}
                      disabled={!selectedGaushala || assignGaushala.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs rounded-lg"
                      onClick={() => { setEditingVolunteer(null); setSelectedGaushala(""); }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <p className={cn("text-xs", gaushala ? "text-foreground font-medium" : "text-muted-foreground italic")}>
                    {gaushala ? `${gaushala.name}, ${gaushala.city}` : "Not assigned"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <div className="text-center rounded-lg bg-muted/50 p-1.5">
                  <Package className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                  <p className="text-xs font-bold text-foreground">{v.assignedOrders}</p>
                  <p className="text-[9px] text-muted-foreground">Orders</p>
                </div>
                <div className="text-center rounded-lg bg-muted/50 p-1.5">
                  <Package className="h-3 w-3 mx-auto text-secondary mb-0.5" />
                  <p className="text-xs font-bold text-foreground">{v.completedOrders}</p>
                  <p className="text-[9px] text-muted-foreground">Done</p>
                </div>
                <div className="text-center rounded-lg bg-muted/50 p-1.5">
                  <Camera className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                  <p className="text-xs font-bold text-foreground">{v.evidenceCount}</p>
                  <p className="text-[9px] text-muted-foreground">Proof</p>
                </div>
                <div className="text-center rounded-lg bg-muted/50 p-1.5">
                  <MapPin className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                  <p className="text-xs font-bold text-foreground">{v.assignedVisits}</p>
                  <p className="text-[9px] text-muted-foreground">Visits</p>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No volunteers found</p>
      )}
    </div>
  );
};

export default AdminVolunteers;
