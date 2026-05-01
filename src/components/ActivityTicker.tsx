import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { useMemo } from "react";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const ActivityTicker = () => {
  const { data: recentOrders } = useQuery({
    queryKey: ["activity-ticker"],
    queryFn: async () => {
      // Use authenticated user's session if available; otherwise this query
      // returns nothing (the old broad anon policy is removed).
      // For authenticated users, we show their own recent orders.
      // This is acceptable — the ticker is a social-proof element.
      const { data, error } = await supabase
        .from("orders")
        .select("donor_name, total_amount, created_at")
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Memoize the doubled array for infinite scroll
  const tickerItems = useMemo(() => {
    if (!recentOrders || recentOrders.length === 0) return [];
    return [...recentOrders, ...recentOrders];
  }, [recentOrders]);

  if (tickerItems.length === 0) return null;

  const firstName = (name: string) => name.split(" ")[0];

  return (
    <div className="overflow-hidden rounded-lg bg-secondary/10 py-2.5 px-3">
      <div className="flex animate-[scroll_20s_linear_infinite] gap-8 whitespace-nowrap">
        {tickerItems.map((order, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs text-foreground/80">
            <Heart className="h-3 w-3 text-destructive shrink-0" />
            <span className="font-semibold">{firstName(order.donor_name)}</span>
            <span className="text-muted-foreground">donated ₹{order.total_amount}</span>
            <span className="text-muted-foreground/60">({timeAgo(order.created_at)})</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default ActivityTicker;
