import { useAdminOrders } from "@/hooks/useAdminOrders";
import { Clock, UserPlus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  onKpiClick?: (filter: string) => void;
}

const KpiCards = ({ onKpiClick }: KpiCardsProps) => {
  const { kpis } = useAdminOrders();

  const cards = [
    {
      id: "pending",
      label: "Pending",
      value: kpis.pending,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      desc: "Not assigned to volunteer",
    },
    {
      id: "active",
      label: "Active",
      value: kpis.active,
      icon: UserPlus,
      color: "text-accent-foreground",
      bg: "bg-accent/10 border-accent/20",
      desc: "Assigned, not completed",
    },
    {
      id: "delayed",
      label: "Delayed",
      value: kpis.delayed,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
      desc: "SLA breached",
    },
    {
      id: "completed",
      label: "Completed",
      value: kpis.completedToday,
      icon: CheckCircle2,
      color: "text-secondary",
      bg: "bg-secondary/10 border-secondary/20",
      desc: "Completed today",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((kpi) => (
        <button
          key={kpi.id}
          onClick={() => onKpiClick?.(kpi.id)}
          className={cn(
            "rounded-xl border p-3 text-left transition-all active:scale-[0.97]",
            kpi.bg
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
            <span className="text-[10px] text-muted-foreground font-medium">{kpi.label}</span>
          </div>
          <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{kpi.desc}</p>
        </button>
      ))}
    </div>
  );
};

export default KpiCards;
