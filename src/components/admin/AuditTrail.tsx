import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditTrailProps {
  entityType: "order" | "visit";
  entityId: string;
  volunteers: { id: string; full_name: string | null; phone: string | null }[];
}

const AuditTrail = ({ entityType, entityId, volunteers }: AuditTrailProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-log", entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("assignment_audit_log" as any)
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const getVolName = (id: string | null) => {
    if (!id) return "Unassigned";
    const v = volunteers.find((vol) => vol.id === id);
    return v?.full_name || v?.phone || id.slice(0, 8);
  };

  if (isLoading || !logs?.length) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <History className="h-3 w-3" /> Assignment History
      </p>
      <div className="space-y-1">
        {logs.map((log: any) => (
          <div key={log.id} className="flex items-start gap-2 text-[10px]">
            <div className={cn(
              "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
              log.change_type === "auto" ? "bg-secondary" : "bg-primary"
            )} />
            <div className="min-w-0">
              <span className="text-muted-foreground">
                {log.previous_volunteer
                  ? <>{getVolName(log.previous_volunteer)} → <span className="text-foreground font-medium">{getVolName(log.new_volunteer)}</span></>
                  : <>Assigned to <span className="text-foreground font-medium">{getVolName(log.new_volunteer)}</span></>
                }
              </span>
              <span className="text-muted-foreground ml-1.5">
                · {log.change_type === "auto" ? "⚡ Auto" : "✋ Manual"}
                {log.changed_by && ` by ${getVolName(log.changed_by)}`}
              </span>
              <p className="text-muted-foreground">
                {new Date(log.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {" "}
                {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;
