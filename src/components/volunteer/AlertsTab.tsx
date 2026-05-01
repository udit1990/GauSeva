import { useNavigate } from "react-router-dom";
import { Package, CalendarDays, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertsTab = ({ notifications, onMarkRead, unreadCount }: { notifications: any[]; onMarkRead: () => void; unreadCount: number }) => {
  const navigate = useNavigate();

  const handleTap = (n: any) => {
    const meta = n.metadata as any;
    if (!meta?.id) return;
    if (n.type === "order" || meta.table === "orders") {
      navigate(`/volunteer-task/${meta.id}`);
    } else if (n.type === "visit" || meta.table === "visit_bookings") {
      navigate("/volunteer-visits");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Notifications</h2>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onMarkRead}>
            Mark all read
          </Button>
        )}
      </div>
      {notifications.length === 0 && (
        <div className="py-12 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">You'll see alerts here when orders or visits are assigned</p>
        </div>
      )}
      {notifications.map((n: any) => (
        <button
          key={n.id}
          onClick={() => handleTap(n)}
          className={cn(
            "w-full text-left rounded-xl bg-card p-3.5 shadow-sm active:scale-[0.98] transition-all",
            !n.read && "ring-1 ring-primary/20"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              n.type === "order" ? "bg-primary/10" : n.type === "visit" ? "bg-secondary/10" : "bg-muted"
            )}>
              {n.type === "order" ? <Package className="h-4 w-4 text-primary" /> :
               n.type === "visit" ? <CalendarDays className="h-4 w-4 text-secondary" /> :
               <Bell className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {" · "}
                {new Date(n.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AlertsTab;
