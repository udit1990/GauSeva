import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Trash2, WifiOff, CloudUpload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

const STORAGE_KEY = "evidence_upload_queue";

interface QueueItem {
  id: string;
  orderId: string;
  fileName: string;
  mediaType: "image" | "video";
  caption: string | null;
  uploadedBy: string;
  base64: string;
  mimeType: string;
  createdAt: string;
}

function getQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

const VolunteerUploads = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(() => {
    setItems(getQueue());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, [refresh]);

  const handleRetryAll = async () => {
    setRetrying(true);
    try {
      const { processQueue } = await import("@/lib/evidenceQueue");
      const { success, failed } = await processQueue();
      if (success > 0) toast.success(`${success} upload(s) synced`);
      if (failed > 0) toast.error(`${failed} upload(s) still pending`);
      refresh();
    } catch {
      toast.error("Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = (id: string) => {
    const queue = getQueue().filter(i => i.id !== id);
    saveQueue(queue);
    setItems(queue);
    toast.success("Removed from queue");
  };

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Uploads</h1>
          </div>
          {items.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetryAll}
              disabled={retrying || !isOnline}
              className="rounded-lg text-xs h-8"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1", retrying && "animate-spin")} />
              {retrying ? "Syncing..." : "Retry All"}
            </Button>
          )}
        </div>
      </header>

      <div className="px-5 pt-4 space-y-3">
        {/* Online status */}
        <div className={cn(
          "rounded-lg p-2.5 flex items-center gap-2",
          isOnline ? "bg-secondary/5 border border-secondary/20" : "bg-destructive/5 border border-destructive/20"
        )}>
          {isOnline ? (
            <>
              <CloudUpload className="h-4 w-4 text-secondary shrink-0" />
              <p className="text-xs text-secondary font-medium">Online — uploads will sync automatically</p>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">Offline — uploads saved locally</p>
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">All uploads synced</p>
            <p className="text-xs text-muted-foreground mt-1">No pending uploads in queue</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {items.length} pending upload{items.length > 1 ? "s" : ""}
            </p>
            {items.map((item) => (
              <div key={item.id} className="rounded-xl bg-card border border-border p-3.5 flex items-center gap-3">
                {/* Preview thumbnail */}
                <div className="h-12 w-12 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                  {item.mediaType === "image" ? (
                    <img src={item.base64} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">📹</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Order: {item.orderId.slice(0, 8)}…
                    {item.caption && ` • ${item.caption}`}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VolunteerUploads;
