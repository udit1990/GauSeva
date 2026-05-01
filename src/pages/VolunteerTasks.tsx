import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskCard, { getPriority } from "@/components/volunteer/TaskCard";
import BottomNav from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  VOLUNTEER_ACTIONABLE_ORDER_STATUSES,
  isVolunteerActiveOrderStatus,
  isVolunteerCompletedOrderStatus,
} from "@/lib/volunteerOrderStatus";

const animalTabs = ["all", "cow", "dog", "others"] as const;
type AnimalTab = typeof animalTabs[number];

const statusFilters = ["all", "paid", "in_progress", "completed"] as const;
type StatusFilter = typeof statusFilters[number];

const VolunteerTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<AnimalTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["volunteer-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("orders")
        .select("id, donor_name, total_amount, status, created_at, updated_at, animal_type, expected_completion_at, volunteer_notes, gaushalas_list(name, city)")
        .eq("assigned_volunteer", user.id)
        .in("status", [...VOLUNTEER_ACTIONABLE_ORDER_STATUSES])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    staleTime: 15_000,
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    let result = orders;

    // Animal tab filter
    if (tab === "cow") result = result.filter(o => o.animal_type === "cow");
    else if (tab === "dog") result = result.filter(o => o.animal_type === "dog");
    else if (tab === "others") result = result.filter(o => o.animal_type !== "cow" && o.animal_type !== "dog");

    // Status filter
    if (statusFilter === "completed") {
      result = result.filter(o => isVolunteerCompletedOrderStatus(o.status));
    } else if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }

    // Sort: overdue first, then urgent, then normal
    return result.sort((a, b) => {
      const pa = getPriority(a);
      const pb = getPriority(b);
      const priority = { overdue: 0, urgent: 1, normal: 2 };
      return priority[pa] - priority[pb];
    });
  }, [orders, tab, statusFilter]);

  const counts = useMemo(() => {
    if (!orders) return { all: 0, cow: 0, dog: 0, others: 0 };
    const pending = orders.filter(o => isVolunteerActiveOrderStatus(o.status));
    return {
      all: pending.length,
      cow: pending.filter(o => o.animal_type === "cow").length,
      dog: pending.filter(o => o.animal_type === "dog").length,
      others: pending.filter(o => o.animal_type !== "cow" && o.animal_type !== "dog").length,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Tasks</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("p-2 rounded-lg transition-colors", showFilters ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Animal Tabs */}
        <div className="flex gap-1.5 mt-3">
          {animalTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {t === "all" ? "All" : t === "cow" ? "🐄 Cow" : t === "dog" ? "🐕 Dog" : "🐾 Others"}
              <span className="ml-1 text-[9px] opacity-75">({counts[t]})</span>
            </button>
          ))}
        </div>

        {/* Status Filters */}
        {showFilters && (
          <div className="flex gap-1.5 mt-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                  statusFilter === s ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {s === "all" ? "All Status" : s === "in_progress" ? "In Progress" : s === "paid" ? "Ready" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-5 pt-4 space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No tasks match your filters</p>
          </div>
        ) : (
          filtered.map((order) => (
            <TaskCard key={order.id} order={order as any} onTap={(id) => navigate(`/volunteer-task/${id}`)} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default VolunteerTasks;
