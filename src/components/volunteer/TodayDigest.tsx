import { Package, Sun, Clock, AlertTriangle } from "lucide-react";
import { isVolunteerActiveOrderStatus } from "@/lib/volunteerOrderStatus";

const TodayDigest = ({ orders, visits }: { orders: any[]; visits: any[] }) => {
  const today = new Date().toISOString().slice(0, 10);
  const pendingOrders = orders.filter((o) => isVolunteerActiveOrderStatus(o.status));
  const todayVisits = visits.filter((v: any) => v.visit_date === today);
  const overdueOrders = pendingOrders.filter((o) => {
    const created = new Date(o.created_at);
    const diffHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return diffHours > 48;
  });

  const totalTasks = pendingOrders.length + todayVisits.length;

  if (totalTasks === 0) {
    return (
      <div className="rounded-xl bg-secondary/5 p-4 flex items-center gap-3">
        <Sun className="h-6 w-6 text-secondary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">All clear today! 🎉</p>
          <p className="text-[11px] text-muted-foreground">No pending tasks. Enjoy your day.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Today's Tasks</p>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{totalTasks}</span>
      </div>

      {overdueOrders.length > 0 && (
        <div className="rounded-lg bg-destructive/5 p-2.5 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-destructive">{overdueOrders.length} overdue order(s)</p>
            <p className="text-[10px] text-muted-foreground">Pending for over 48 hours</p>
          </div>
        </div>
      )}

      {pendingOrders.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Open Orders</p>
          {pendingOrders.slice(0, 3).map((o) => (
            <div key={o.id} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="h-3 w-3 text-primary" />
                <p className="text-xs text-foreground">{o.donor_name}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">₹{Number(o.total_amount).toLocaleString("en-IN")}</p>
            </div>
          ))}
          {pendingOrders.length > 3 && (
            <p className="text-[10px] text-muted-foreground">+{pendingOrders.length - 3} more</p>
          )}
        </div>
      )}

      {todayVisits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today's Visits</p>
          {todayVisits.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-secondary" />
                <p className="text-xs text-foreground">{v.visitor_name}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{v.time_slot}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayDigest;
