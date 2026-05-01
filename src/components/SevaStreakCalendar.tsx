import { useMemo } from "react";
import { Flame, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STREAK_LABELS: Record<number, { label: string; icon: typeof Flame }> = {
  3: { label: "Niyam Mode 🔥", icon: Flame },
  7: { label: "Sadhana Mode ⚡", icon: Zap },
  21: { label: "Tapasya Mode 🌟", icon: Star },
  108: { label: "Siddhi Unlocked ✨", icon: Star },
};

const getStreakTitle = (streak: number) => {
  const thresholds = Object.keys(STREAK_LABELS).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (streak >= t) return STREAK_LABELS[t];
  }
  return null;
};

const SevaStreakCalendar = () => {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["streak-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 34);
      const { data, error } = await supabase
        .from("orders")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { donationDays, currentStreak, last35Days } = useMemo(() => {
    const donationSet = new Set<string>();
    orders?.forEach((o) => {
      const day = new Date(o.created_at).toISOString().split("T")[0];
      donationSet.add(day);
    });

    // Generate last 35 days (5 weeks)
    const days: Date[] = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    // Calculate streak going backwards from today
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (donationSet.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return { donationDays: donationSet, currentStreak: streak, last35Days: days };
  }, [orders]);

  const streakInfo = getStreakTitle(currentStreak);
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  // Pad to start on Sunday
  const firstDay = last35Days[0]?.getDay() || 0;
  const paddedDays = [...Array(firstDay).fill(null), ...last35Days];

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
      {/* Streak header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Seva Streak</p>
          <p className="text-xs text-muted-foreground">
            {currentStreak > 0
              ? `${currentStreak} day${currentStreak > 1 ? "s" : ""} consecutive`
              : "Start your streak today!"}
          </p>
        </div>
        {currentStreak > 0 && (
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5",
            currentStreak >= 21 ? "bg-accent" : currentStreak >= 7 ? "bg-primary/10" : "bg-secondary/10"
          )}>
            {streakInfo ? (
              <>
                <streakInfo.icon className={cn(
                  "h-4 w-4",
                  currentStreak >= 21 ? "text-accent-foreground" : currentStreak >= 7 ? "text-primary" : "text-secondary"
                )} />
                <span className={cn(
                  "text-xs font-bold",
                  currentStreak >= 21 ? "text-accent-foreground" : currentStreak >= 7 ? "text-primary" : "text-secondary"
                )}>
                  {streakInfo.label}
                </span>
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 text-secondary" />
                <span className="text-xs font-bold text-secondary">{currentStreak}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => (
          <div key={`h-${i}`} className="flex items-center justify-center h-6">
            <span className="text-[10px] font-medium text-muted-foreground">{d}</span>
          </div>
        ))}
        {paddedDays.map((day, i) => {
          if (!day) {
            return <div key={`pad-${i}`} className="aspect-square" />;
          }
          const key = day.toISOString().split("T")[0];
          const hasDonation = donationDays.has(key);
          const isToday = key === new Date().toISOString().split("T")[0];

          return (
            <div
              key={key}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors",
                hasDonation
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted/40 text-muted-foreground",
                isToday && !hasDonation && "ring-1 ring-primary/50",
                isToday && hasDonation && "ring-1 ring-secondary"
              )}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-secondary" />
          <span className="text-[10px] text-muted-foreground">Seva done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-muted/40" />
          <span className="text-[10px] text-muted-foreground">No seva</span>
        </div>
      </div>
    </div>
  );
};

export default SevaStreakCalendar;
