import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Search, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSignedEvidenceUrls } from "@/hooks/useSignedEvidenceUrls";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  validated: "bg-accent/20 text-accent-foreground",
  approved: "bg-secondary/10 text-secondary",
  rejected: "bg-destructive/10 text-destructive",
  duplicate: "bg-destructive/10 text-destructive",
};

const REJECTION_REASONS = [
  "Blurry or unclear image",
  "Wrong animal type in photo",
  "Photo does not match order",
  "Duplicate submission",
  "Inappropriate content",
  "Cannot verify seva completion",
];

const AdminEvidence = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { getSignedUrls } = useSignedEvidenceUrls();
  const [searchOrderId, setSearchOrderId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: orders } = useQuery({
    queryKey: ["admin-orders-for-evidence"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, donor_name, total_amount, created_at, animal_type").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: evidence, refetch: refetchEvidence } = useQuery({
    queryKey: ["admin-evidence", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      const { data } = await supabase
        .from("order_evidence")
        .select("*")
        .eq("order_id", selectedOrderId)
        .order("created_at");
      if (data && data.length > 0) {
        const paths = data.map((e) => e.storage_path);
        const urls = await getSignedUrls(paths);
        setSignedUrls((prev) => ({ ...prev, ...urls }));
      }
      return data || [];
    },
    enabled: !!selectedOrderId,
  });

  // Stats
  const stats = useMemo(() => {
    if (!evidence) return { pending: 0, validated: 0, approved: 0, rejected: 0, duplicate: 0 };
    const initial: Record<string, number> = { pending: 0, validated: 0, approved: 0, rejected: 0, duplicate: 0 };
    return evidence.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      initial
    );
  }, [evidence]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId) return;

    // Client-side validation
    if (file.size < 10240) {
      toast.error("File too small (min 10KB)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedOrderId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("order-evidence").upload(path, file);
      if (uploadError) throw uploadError;

      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const { data: inserted, error: insertError } = await supabase.from("order_evidence").insert({
        order_id: selectedOrderId,
        storage_path: path,
        media_type: mediaType,
        caption: caption || null,
        uploaded_by: user?.id,
      }).select("id").single();
      if (insertError) throw insertError;

      // Trigger async processing
      supabase.functions.invoke("evidence-process", {
        body: { evidence_id: inserted.id, order_id: selectedOrderId },
      }).catch(console.error);

      setCaption("");
      refetchEvidence();
      toast.success("Evidence uploaded — processing...");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const approveMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      const { error } = await supabase
        .from("order_evidence")
        .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq("id", evidenceId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchEvidence();
      toast.success("Evidence approved");
      // Trigger donor notification (best-effort)
      if (selectedOrderId) {
        supabase.functions
          .invoke("gift-whatsapp-notify", {
            body: { order_id: selectedOrderId, type: "evidence_approved" },
          })
          .catch(() => {});
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("order_evidence")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchEvidence();
      setRejectingId(null);
      setSelectedRejectionReason(null);
      toast.success("Evidence rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from("order-evidence").remove([storagePath]);
      const { error } = await supabase.from("order_evidence").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchEvidence();
      toast.success("Evidence deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredOrders = searchOrderId
    ? orders?.filter((o) => o.id.includes(searchOrderId) || o.donor_name.toLowerCase().includes(searchOrderId.toLowerCase()))
    : orders;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or order ID..."
          value={searchOrderId}
          onChange={(e) => setSearchOrderId(e.target.value)}
          className="h-10 pl-9"
        />
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1">
        {filteredOrders?.map((order) => (
          <button
            key={order.id}
            onClick={() => setSelectedOrderId(order.id)}
            className={`w-full text-left rounded-md px-3 py-2 text-xs transition-colors ${
              selectedOrderId === order.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
            }`}
          >
            <span className="font-medium">{order.donor_name}</span>
            <span className="text-muted-foreground"> • ₹{order.total_amount} • {order.animal_type || "cow"} • {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          </button>
        ))}
      </div>

      {/* Upload */}
      {selectedOrderId && (
        <div className="rounded-lg bg-card p-3 shadow-sm space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Upload Evidence</h4>
          <Input
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="h-9"
          />
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} size="sm" className="rounded-lg">
            <Upload className="h-3.5 w-3.5 mr-1" />
            {uploading ? "Uploading..." : "Upload Photo/Video"}
          </Button>
        </div>
      )}

      {/* Stats Bar */}
      {selectedOrderId && evidence && evidence.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(stats).map(([status, count]) =>
            (count as number) > 0 ? (
              <span key={status} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[status] || ""}`}>
                {status}: {count as number}
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Evidence Gallery with Approval */}
      {selectedOrderId && evidence && evidence.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Evidence Pipeline</h4>
          <div className="space-y-2">
            {evidence.map((e) => {
              const url = signedUrls[e.storage_path] || "";
              return (
                <div key={e.id} className="rounded-lg bg-card border border-border p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
                      {e.media_type === "video" ? (
                        <video src={url} className="h-full w-full object-cover" />
                      ) : (
                        <img src={url} alt={e.caption || ""} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[e.status] || ""}`}>
                          {e.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{e.media_type}</span>
                      </div>
                      {e.caption && <p className="text-xs text-foreground mt-1 truncate">{e.caption}</p>}
                      {e.file_hash && <p className="text-[9px] text-muted-foreground font-mono truncate">hash: {e.file_hash?.slice(0, 16)}…</p>}
                      {e.rejection_reason && (
                        <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {e.rejection_reason}
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {e.expires_at && ` • expires ${new Date(e.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(e.status === "pending" || e.status === "validated") && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-7"
                          onClick={() => approveMutation.mutate(e.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1 text-secondary" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs h-7"
                          onClick={() => setRejectingId(rejectingId === e.id ? null : e.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1 text-destructive" /> Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-xs h-7 text-destructive"
                      onClick={() => deleteMutation.mutate({ id: e.id, storagePath: e.storage_path })}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>

                  {/* Rejection reason selector */}
                  {rejectingId === e.id && (
                    <div className="space-y-1.5 pt-1 border-t border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Select reason:</p>
                      <div className="flex flex-wrap gap-1">
                        {REJECTION_REASONS.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => setSelectedRejectionReason(reason)}
                            className={`rounded-md px-2 py-1 text-[10px] border transition-colors ${
                              selectedRejectionReason === reason
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      {selectedRejectionReason && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-lg text-xs h-7"
                          onClick={() => rejectMutation.mutate({ id: e.id, reason: selectedRejectionReason })}
                          disabled={rejectMutation.isPending}
                        >
                          Confirm Rejection
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvidence;
