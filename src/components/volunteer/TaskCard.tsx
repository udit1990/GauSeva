import { Clock, MapPin, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskOrder {
  id: string;
  donor_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  animal_type: string | null;
  expected_completion_at: string | null;
  volunteer_notes: string | null;
  gaushalas_list?: { name: string; city?: string } | null;
}

interface TaskCardProps {
  order: TaskOrder;
  onTap: (orderId: string) => void;
}

const animalEmoji: Record<string, string> = {
  cow: "🐄",
  dog: "🐕",
  cat: "🐈",
  monkey: "🐒",
};

const getTimeElapsed = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `${Math.floor(diff / 60000)}m`;
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const isOverdue = (order: TaskOrder) => {
  if (order.expected_completion_at) {
    return new Date(order.expected_completion_at) < new Date();
  }
  // Fallback: >48h since creation
  return (Date.now() - new Date(order.created_at).getTime()) > 48 * 3600000;
};

const getPriority = (order: TaskOrder): "overdue" | "urgent" | "normal" => {
  if (order.status === "completed") return "normal";
  if (isOverdue(order)) return "overdue";
  const hrs = (Date.now() - new Date(order.created_at).getTime()) / 3600000;
  if (hrs > 24) return "urgent";
  return "normal";
};

const TaskCard = ({ order, onTap }: TaskCardProps) => {
  const priority = getPriority(order);
  const animal = order.animal_type || "cow";
  const emoji = animalEmoji[animal] || "🐾";
  const gaushala = order.gaushalas_list;

  return (
    <button
      onClick={() => onTap(order.id)}
      className={cn(
        "w-full rounded-xl bg-card border p-3.5 text-left active:scale-[0.98] transition-all",
        priority === "overdue" ? "border-destructive/40 bg-destructive/5" :
        priority === "urgent" ? "border-primary/30" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Animal Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: donor + priority */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{order.donor_name}</p>
            {priority === "overdue" && (
              <span className="flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[9px] font-bold text-destructive shrink-0">
                <AlertTriangle className="h-2.5 w-2.5" /> OVERDUE
              </span>
            )}
            {priority === "urgent" && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary shrink-0">
                URGENT
              </span>
            )}
          </div>

          {/* Details row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground capitalize">{animal}</span>
            <span className="text-[10px] text-muted-foreground">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
            {gaushala && (
              <span className="flex items-center gap-0.5 text-[10px] text-primary">
                <MapPin className="h-2.5 w-2.5" />
                {gaushala.name}
              </span>
            )}
          </div>

          {/* Time elapsed */}
          <div className="flex items-center gap-1 mt-1.5">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{getTimeElapsed(order.created_at)} ago</span>
            <span className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[9px] font-medium",
              order.status === "completed" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
            )}>
              {order.status}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-3" />
      </div>
    </button>
  );
};

export { getPriority, isOverdue };
export default TaskCard;
