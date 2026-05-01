import { Package, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import TodayDigest from "./TodayDigest";
import { isVolunteerActiveOrderStatus } from "@/lib/volunteerOrderStatus";

interface HomeTabProps {
  completedOrders: number;
  completedVisits: number;
  evidenceCount: number;
  queueCount: number;
  orders: any[];
  visits: any[];
  onGoOrders: () => void;
  onGoVisits: () => void;
}

const HomeTab = ({
  completedOrders, completedVisits, evidenceCount, queueCount,
  orders, visits, onGoOrders, onGoVisits,
}: HomeTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-card p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-primary">{completedOrders}</p>
          <p className="text-[10px] text-muted-foreground">Orders</p>
        </div>
        <div className="rounded-xl bg-card p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-secondary">{completedVisits}</p>
          <p className="text-[10px] text-muted-foreground">Visits</p>
        </div>
        <div className="rounded-xl bg-card p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-foreground">{evidenceCount}</p>
          <p className="text-[10px] text-muted-foreground">Evidence</p>
        </div>
        <div className="rounded-xl bg-card p-3 shadow-sm text-center">
          <p className={cn("text-xl font-bold", queueCount > 0 ? "text-destructive" : "text-muted-foreground")}>{queueCount}</p>
          <p className="text-[10px] text-muted-foreground">Queued</p>
        </div>
      </div>

      <TodayDigest orders={orders} visits={visits} />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onGoOrders}
          className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Orders</p>
            <p className="text-[11px] text-muted-foreground">{orders.filter(o => isVolunteerActiveOrderStatus(o.status)).length} open</p>
          </div>
        </button>
        <button
          onClick={onGoVisits}
          className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10">
            <CalendarDays className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Visits</p>
            <p className="text-[11px] text-muted-foreground">{visits.filter((v: any) => v.status !== "visited" && v.status !== "not_visited").length} upcoming</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HomeTab;
