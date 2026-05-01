import { Camera, CheckCircle2, Upload, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const OrdersTab = ({
  orders, selectedOrderId, setSelectedOrderId, caption, setCaption,
  fileRef, handleUpload, uploading, evidence, editingNotes, setEditingNotes,
  markCompleteMutation, saveNotesMutation,
}: any) => (
  <div className="space-y-3">
    <h2 className="text-base font-bold text-foreground">Assigned Orders</h2>
    {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No orders assigned yet</p>}
    {orders.map((order: any) => {
      const notesKey = order.id;
      const isEditingNotes = notesKey in editingNotes;
      return (
        <div key={order.id} className="rounded-xl bg-card p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{order.donor_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {" • "}₹{order.total_amount}
              </p>
            </div>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
              order.status === "completed" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
            )}>
              {order.status}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="rounded-lg text-xs"
              onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}>
              <Camera className="h-3.5 w-3.5 mr-1" />
              {selectedOrderId === order.id ? "Hide" : "Evidence"}
            </Button>
            {order.status !== "completed" && (
              <Button size="sm" className="rounded-lg text-xs"
                onClick={() => {
                  if (selectedOrderId !== order.id) {
                    toast.error("Upload at least one photo/video before marking complete");
                    setSelectedOrderId(order.id);
                    return;
                  }
                  if (!evidence || evidence.length === 0) {
                    toast.error("Upload at least one photo/video before marking complete");
                    return;
                  }
                  markCompleteMutation.mutate(order.id);
                }}
                disabled={markCompleteMutation.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Complete
              </Button>
            )}
          </div>

          {selectedOrderId === order.id && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Input placeholder="Caption (optional)" value={caption} onChange={(e: any) => setCaption(e.target.value)} className="h-9" />
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-lg text-xs">
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploading ? "Uploading..." : "Upload Photo/Video"}
              </Button>
              {evidence && evidence.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {evidence.map((e: any) => (
                    <div key={e.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                      {e.media_type === "video" ? (
                        <video src={e.publicUrl} className="h-full w-full object-cover" />
                      ) : (
                        <img src={e.publicUrl} alt={e.caption || ""} className="h-full w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            {isEditingNotes ? (
              <div className="space-y-1.5">
                <Textarea
                  placeholder="Add notes about this order..."
                  value={editingNotes[notesKey]}
                  onChange={(e: any) => setEditingNotes((prev: any) => ({ ...prev, [notesKey]: e.target.value }))}
                  className="min-h-[60px] text-xs"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="rounded-lg text-xs h-7"
                    onClick={() => saveNotesMutation.mutate({ orderId: order.id, notes: editingNotes[notesKey] })}
                    disabled={saveNotesMutation.isPending}>
                    {saveNotesMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-xs h-7"
                    onClick={() => setEditingNotes((prev: any) => { const n = { ...prev }; delete n[notesKey]; return n; })}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                onClick={() => setEditingNotes((prev: any) => ({ ...prev, [notesKey]: order.volunteer_notes || "" }))}
              >
                {order.volunteer_notes
                  ? <span className="text-foreground">📝 {order.volunteer_notes}</span>
                  : <span className="italic">+ Add notes...</span>
                }
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default OrdersTab;
