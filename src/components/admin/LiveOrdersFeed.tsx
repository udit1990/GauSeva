import { useAdminOrders, AdminOrder } from "@/hooks/useAdminOrders";
import { useCallback, useRef } from "react";
import { ShoppingBag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveOrdersFeedProps {
  onOrderClick?: (orderId: string) => void;
}

const LiveOrdersFeed = ({ onOrderClick }: LiveOrdersFeedProps) => {
  const { liveFeed, isLoading } = useAdminOrders();
  const containerRef = useRef<HTMLDivElement>(null);

  const timeAgo = useCallback((dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5" />
          Live Orders
        </h3>
        <span className="text-[10px] text-muted-foreground">{liveFeed.length} recent</span>
      </div>
      <div ref={containerRef} className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-hide">
        {liveFeed.map((order) => (
          <button
            key={order.id}
            onClick={() => onOrderClick?.(order.id)}
            className="w-full rounded-lg bg-card border border-border p-2.5 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {order.donor_name}
                  <span className="text-muted-foreground font-normal"> — ₹{order.total_amount}</span>
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {order.animal_type && (
                    <span className="text-[9px] text-muted-foreground capitalize">{order.animal_type}</span>
                  )}
                  {order.gaushalas_list?.name && (
                    <span className="text-[9px] text-primary">{order.gaushalas_list.name}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                  order.status === "completed" ? "bg-secondary/10 text-secondary"
                    : order.assigned_volunteer ? "bg-accent/10 text-accent-foreground"
                    : "bg-primary/10 text-primary"
                )}>
                  {order.status === "completed" ? "done" : order.assigned_volunteer ? "active" : "pending"}
                </span>
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo(order.updated_at)}
                </span>
              </div>
            </div>
          </button>
        ))}
        {liveFeed.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No orders match filters</p>
        )}
      </div>
    </div>
  );
};

export default LiveOrdersFeed;
