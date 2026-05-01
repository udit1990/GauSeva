import { Trophy, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ReferralLeaderboard = () => {
  // Check feature flag
  const { data: flagEnabled } = useQuery({
    queryKey: ["flag-referral-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("id", "referral_leaderboard")
        .single();
      return data?.enabled ?? false;
    },
  });

  // Fetch top referrers using referrals table
  const { data: leaders } = useQuery({
    queryKey: ["referral-leaderboard"],
    enabled: !!flagEnabled,
    queryFn: async () => {
      // Get converted referrals grouped by referrer
      const { data: referrals } = await (supabase as any)
        .from("referrals")
        .select("referrer_id")
        .eq("status", "converted");

      if (!referrals?.length) return [];

      // Count per referrer
      const counts: Record<string, number> = {};
      for (const r of referrals) {
        counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
      }

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Fetch profile names
      const ids = sorted.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.id] = p.full_name || "Sevak";
      });

      return sorted.map(([id, count], i) => ({
        rank: i + 1,
        name: nameMap[id] || "Sevak",
        count,
      }));
    },
  });

  if (!flagEnabled || !leaders?.length) return null;

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Top Seva Ambassadors</h3>
      </div>
      <div className="space-y-2">
        {leaders.map((l) => (
          <div key={l.rank} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center">
              {l.rank <= 3 ? (
                <Medal className={`h-5 w-5 ${medalColors[l.rank - 1]}`} />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">#{l.rank}</span>
              )}
            </div>
            <p className="flex-1 text-sm font-medium text-foreground truncate">{l.name}</p>
            <p className="text-xs font-semibold text-primary">{l.count} referral{l.count > 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferralLeaderboard;
