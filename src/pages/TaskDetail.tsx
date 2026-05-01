import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Video, Hash, Loader2, AlertTriangle, MapPin, Clock, WifiOff, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addToQueue } from "@/lib/evidenceQueue";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { VOLUNTEER_ACTIONABLE_ORDER_STATUSES } from "@/lib/volunteerOrderStatus";

/**
 * Fallback evidence rules per animal type (used when seva_categories.evidence_requirements is missing).
 */
const defaultEvidenceConfig: Record<string, { photo: boolean; video: boolean; videoRequired?: boolean; count?: boolean; label: string }> = {
  cow: { photo: true, video: false, label: "Upload photo evidence" },
  dog: { photo: true, video: false, count: true, label: "Upload photo + enter count" },
  monkey: { photo: false, video: true, videoRequired: true, label: "Upload video evidence (mandatory)" },
  cat: { photo: true, video: false, label: "Upload photo evidence" },
};

const TaskDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [animalCount, setAnimalCount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["task-detail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, gaushalas_list(name, city, state, lat, lng), order_items(id, sku_name, quantity, total_price, category_id)")
        .eq("id", orderId)
        .in("status", [...VOLUNTEER_ACTIONABLE_ORDER_STATUSES])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch category evidence requirements + instructions
  const categoryId = useMemo(() => {
    const items = (order?.order_items as any[]) || [];
    return items.length > 0 ? items[0].category_id : null;
  }, [order]);

  const { data: category } = useQuery({
    queryKey: ["seva-category-detail", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const { data } = await supabase
        .from("seva_categories")
        .select("id, title, description, evidence_requirements")
        .eq("id", categoryId)
        .single();
      return data;
    },
    enabled: !!categoryId,
  });

  const { data: evidence, refetch: refetchEvidence } = useQuery({
    queryKey: ["task-evidence", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data } = await supabase
        .from("order_evidence")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at");
      if (!data || data.length === 0) return [];
      // Fetch signed URLs
      const paths = data.map((e) => e.storage_path);
      let urls: Record<string, string> = {};
      try {
        const { data: urlData } = await supabase.functions.invoke("evidence-url", {
          body: { storage_paths: paths },
        });
        urls = urlData?.urls || {};
      } catch {
        // fallback — won't work now that bucket is private, but graceful
      }
      return data.map((e) => ({
        ...e,
        publicUrl: urls[e.storage_path] || "",
      }));
    },
    enabled: !!orderId,
  });

  const animalType = order?.animal_type || "cow";

  // Build evidence config from backend or fallback
  const config = useMemo(() => {
    const evReq = category?.evidence_requirements as any;
    if (evReq && typeof evReq === "object") {
      return {
        photo: !!evReq.photo,
        video: !!evReq.video,
        videoRequired: !!evReq.video_required,
        count: !!evReq.count,
        label: evReq.label || defaultEvidenceConfig[animalType]?.label || "Upload evidence",
      };
    }
    return defaultEvidenceConfig[animalType] || defaultEvidenceConfig.cow;
  }, [category, animalType]);

  const acceptType = config.videoRequired ? "video/*" : config.video ? "image/*,video/*" : "image/*";

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    const ev = evidence || [];

    if (config.photo && !config.videoRequired) {
      const hasPhoto = ev.some(e => e.media_type === "image");
      if (!hasPhoto) errors.push("At least one photo is required");
    }
    if (config.videoRequired) {
      const hasVideo = ev.some(e => e.media_type === "video");
      if (!hasVideo) errors.push("Video evidence is mandatory");
    }
    if (config.count && !animalCount) {
      errors.push("Animal count is required");
    }

    return { valid: errors.length === 0, errors };
  }, [evidence, config, animalCount]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId || !user) return;
    if (file.size < 10240) { toast.error("File too small (min 10KB)"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orderId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("order-evidence").upload(path, file);
      if (uploadError) throw uploadError;
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const { data: inserted, error: insertError } = await supabase.from("order_evidence").insert({
        order_id: orderId,
        storage_path: path,
        media_type: mediaType,
        caption: caption || null,
        uploaded_by: user.id,
      }).select("id").single();
      if (insertError) throw insertError;
      // Trigger async validation pipeline
      supabase.functions.invoke("evidence-process", {
        body: { evidence_id: inserted.id, order_id: orderId },
      }).then(({ data }) => {
        if (data?.status === "approved") {
          toast.success("Evidence uploaded and approved");
        } else if (data?.status === "duplicate") {
          toast.error("This file was already uploaded for another order");
        } else if (data?.status === "rejected") {
          toast.error(`Rejected: ${data.reason}`);
        } else if (data?.warning) {
          toast.warning(data.warning);
        } else {
          toast.success("Evidence uploaded — validating...");
        }
        refetchEvidence();
      }).catch(console.error);
      setCaption("");
      refetchEvidence();
    } catch (err: any) {
      await addToQueue(orderId, file, caption || null, user.id);
      setCaption("");
      toast.info("Saved offline — will sync when connected", { icon: <WifiOff className="h-4 w-4" /> });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) return;
      const notesPayload: Record<string, unknown> = { status: "completed" };
      if (notes !== null) notesPayload.volunteer_notes = notes;
      if (config.count && animalCount) {
        notesPayload.volunteer_notes = `${notes || ""}\n[Animal count: ${animalCount}]`.trim();
      }
      const { error } = await supabase.from("orders").update(notesPayload).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-orders"] });
      toast.success("Task completed! ✅");
      navigate(-1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isOverdue = order?.expected_completion_at
    ? new Date(order.expected_completion_at) < new Date()
    : (Date.now() - new Date(order?.created_at || 0).getTime()) > 48 * 3600000;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="bg-card border-b border-border px-5 pt-12 pb-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 pt-4 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    );
  }

  const gaushala = order.gaushalas_list as any;
  const emoji = { cow: "🐄", dog: "🐕", cat: "🐈", monkey: "🐒" }[animalType] || "🐾";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{order.donor_name}</h1>
            <p className="text-xs text-muted-foreground">{emoji} {animalType} • ₹{Number(order.total_amount).toLocaleString("en-IN")}</p>
          </div>
          <span className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0",
            order.status === "completed" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
          )}>
            {order.status}
          </span>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-4">
        {/* Overdue Alert */}
        {isOverdue && order.status !== "completed" && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div>
              <p className="text-xs font-semibold text-destructive">This task is overdue</p>
              <p className="text-[10px] text-muted-foreground">Please complete ASAP</p>
            </div>
          </div>
        )}

        {/* Instructions from category */}
        {category?.description && order.status !== "completed" && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <h3 className="text-xs font-bold text-primary">Instructions</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{category.description}</p>
          </div>
        )}

        {/* Task Info */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Task Details</h3>

          {gaushala && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{gaushala.name}</p>
                <p className="text-xs text-muted-foreground">{gaushala.city}, {gaushala.state}</p>
                {gaushala.lat && gaushala.lng && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${gaushala.lat},${gaushala.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-primary underline mt-0.5 inline-block"
                  >
                    Get Directions →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Assigned {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Order Items */}
          {order.order_items && (order.order_items as any[]).length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Items</p>
              {(order.order_items as any[]).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <p className="text-xs text-foreground">{item.sku_name} × {item.quantity}</p>
                  <p className="text-[10px] text-muted-foreground">₹{item.total_price}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence Section */}
        {order.status !== "completed" && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Evidence Required
            </h3>
            <p className="text-[11px] text-muted-foreground">{config.label}</p>

            {/* Uploaded evidence */}
            {evidence && evidence.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {evidence.map((e: any) => (
                  <div key={e.id} className={cn(
                    "aspect-square overflow-hidden rounded-lg bg-muted relative",
                    e.status === "rejected" && "ring-2 ring-destructive/50",
                    e.status === "duplicate" && "ring-2 ring-destructive/50 opacity-60"
                  )}>
                    {e.publicUrl ? (
                      e.media_type === "video" ? (
                        <video src={e.publicUrl} className="h-full w-full object-cover" />
                      ) : (
                        <img src={e.publicUrl} alt={e.caption || ""} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">Loading…</div>
                    )}
                    {/* Status badge */}
                    <span className={cn(
                      "absolute top-0.5 left-0.5 rounded px-1 py-0.5 text-[7px] font-bold uppercase",
                      e.status === "rejected" ? "bg-destructive text-destructive-foreground" :
                      e.status === "duplicate" ? "bg-destructive text-destructive-foreground" :
                      e.status === "validated" ? "bg-accent text-accent-foreground" :
                      e.status === "approved" ? "bg-secondary text-secondary-foreground" :
                      "bg-muted-foreground text-background"
                    )}>
                      {e.status}
                    </span>
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-foreground/70 px-1 py-0.5 text-[8px] text-background">
                      {e.media_type === "video" ? "📹" : "📷"}
                    </span>
                    {/* Rejection reason tooltip */}
                    {e.rejection_reason && (
                      <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 px-1.5 py-0.5">
                        <p className="text-[7px] text-destructive-foreground truncate">{e.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload controls */}
            <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} className="h-9 text-xs" />
            <input ref={fileRef} type="file" accept={acceptType} onChange={handleUpload} className="hidden" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg text-xs h-10"
            >
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...</>
              ) : config.videoRequired ? (
                <><Video className="h-3.5 w-3.5 mr-1.5" /> Record / Upload Video</>
              ) : (
                <><Camera className="h-3.5 w-3.5 mr-1.5" /> Upload Photo</>
              )}
            </Button>

            {/* Count input for dogs */}
            {config.count && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="number"
                  placeholder="Number of animals"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(e.target.value)}
                  className="h-9 text-xs"
                  min={1}
                />
              </div>
            )}

            {/* Validation errors */}
            {!validation.valid && (
              <div className="space-y-1">
                {validation.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" /> {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {order.status !== "completed" && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Notes</h3>
            <Textarea
              placeholder="Add notes about this task..."
              value={notes ?? order.volunteer_notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>
        )}

        {/* Completed Evidence View */}
        {order.status === "completed" && evidence && evidence.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Submitted Evidence</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {evidence.map((e: any) => (
                <div key={e.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                  {e.media_type === "video" ? (
                    <video src={e.publicUrl} className="h-full w-full object-cover" controls />
                  ) : (
                    <img src={e.publicUrl} alt={e.caption || ""} className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
            {order.volunteer_notes && (
              <p className="text-xs text-foreground">📝 {order.volunteer_notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      {order.status !== "completed" && (
        <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-30">
          <Button
            onClick={() => {
              if (!validation.valid) {
                validation.errors.forEach(err => toast.error(err));
                return;
              }
              markCompleteMutation.mutate();
            }}
            disabled={markCompleteMutation.isPending}
            className="w-full h-12 rounded-xl text-sm font-semibold"
          >
            {markCompleteMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Task</>
            )}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default TaskDetail;
