import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrdersTab from "@/components/volunteer/OrdersTab";
import { OrdersTabSkeleton } from "@/components/volunteer/VolunteerSkeletons";
import BottomNav from "@/components/BottomNav";
import { addToQueue, getQueueLength } from "@/lib/evidenceQueue";
import { VOLUNTEER_ACTIONABLE_ORDER_STATUSES } from "@/lib/volunteerOrderStatus";

const VolunteerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: orders, isLoading } = useQuery({
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

  const { data: evidence, refetch: refetchEvidence } = useQuery({
    queryKey: ["volunteer-evidence", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      const { data } = await supabase.from("order_evidence").select("*").eq("order_id", selectedOrderId).order("created_at");
      if (!data || data.length === 0) return [];
      const paths = data.map((e) => e.storage_path);
      let urls: Record<string, string> = {};
      try {
        const { data: urlData } = await supabase.functions.invoke("evidence-url", {
          body: { storage_paths: paths },
        });
        urls = urlData?.urls || {};
      } catch { /* fallback gracefully */ }
      return data.map((e) => ({
        ...e,
        publicUrl: urls[e.storage_path] || "",
      }));
    },
    enabled: !!selectedOrderId,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-orders"] });
      toast.success("Order marked as completed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveNotesMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes: string }) => {
      const { error } = await supabase.from("orders").update({ volunteer_notes: notes } as any).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-orders"] });
      setEditingNotes((prev) => { const n = { ...prev }; delete n[variables.orderId]; return n; });
      toast.success("Notes saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId || !user) return;
    if (file.size < 10240) { toast.error("File too small (min 10KB)"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
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
        uploaded_by: user.id,
      }).select("id").single();
      if (insertError) throw insertError;
      // Trigger async validation pipeline
      supabase.functions.invoke("evidence-process", {
        body: { evidence_id: inserted.id, order_id: selectedOrderId },
      }).then(({ data }) => {
        if (data?.status === "approved") {
          toast.success("Evidence uploaded and approved");
        } else if (data?.status === "duplicate") {
          toast.error("This file was already uploaded for another order");
        } else if (data?.status === "rejected") {
          toast.error(`Rejected: ${data.reason}`);
        } else {
          toast.success("Evidence uploaded — processing...");
        }
      }).catch(console.error);
      setCaption("");
      refetchEvidence();
      queryClient.invalidateQueries({ queryKey: ["volunteer-all-evidence"] });
    } catch (err: any) {
      await addToQueue(selectedOrderId, file, caption || null, user.id);
      setCaption("");
      toast.info("Saved offline — will sync when connected");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Orders</h1>
        </div>
      </header>
      <div className="px-5 pt-4">
        {isLoading ? (
          <OrdersTabSkeleton />
        ) : (
          <OrdersTab
            orders={orders || []}
            selectedOrderId={selectedOrderId}
            setSelectedOrderId={setSelectedOrderId}
            caption={caption}
            setCaption={setCaption}
            fileRef={fileRef}
            handleUpload={handleUpload}
            uploading={uploading}
            evidence={evidence || []}
            editingNotes={editingNotes}
            setEditingNotes={setEditingNotes}
            markCompleteMutation={markCompleteMutation}
            saveNotesMutation={saveNotesMutation}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default VolunteerOrders;
