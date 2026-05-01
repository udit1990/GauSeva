import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, AlertTriangle, Info, ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertsPanelProps {
  onAction?: (action: string, metadata?: Record<string, unknown>) => void;
}

const severityConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10" },
  info: { icon: Info, color: "text-accent-foreground", bg: "bg-accent/10" },
};

const AlertsPanel = ({ onAction }: AlertsPanelProps) => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["admin-command-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!alerts?.length) {
    return (
      <div className="rounded-xl bg-secondary/5 border border-secondary/20 p-4 text-center">
        <Bell className="h-5 w-5 text-secondary mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">All clear — no active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        Active Alerts ({alerts.length})
      </h3>
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity] || severityConfig.info;
        const Icon = config.icon;
        const alertType = alert.alert_type;

        return (
          <div
            key={alert.id}
            className={cn(
              "rounded-lg border p-3 space-y-1.5",
              config.bg,
              alert.severity === "critical" ? "border-destructive/30" : "border-border"
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{alert.body}</p>
              </div>
            </div>
            <div className="flex gap-2 pl-6">
              {alertType === "unassigned_orders" && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 text-[10px] px-2.5"
                  onClick={() => onAction?.("navigate", { tab: "assignments" })}
                >
                  Assign Now
                </Button>
              )}
              {alertType === "sla_breach" && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 text-[10px] px-2.5"
                  onClick={() => onAction?.("navigate", { tab: "orders", filter: "delayed" })}
                >
                  View Delayed
                </Button>
              )}
              {alertType !== "unassigned_orders" && alertType !== "sla_breach" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2.5"
                  onClick={() => onAction?.("view_alert", { alertId: alert.id })}
                >
                  View Details <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertsPanel;
