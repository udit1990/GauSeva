import { useState } from "react";
import { Repeat, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  gaushalaId?: string | null;
}

const AMOUNTS = [
  { value: 51, label: "₹51/day", desc: "Basic daily seva" },
  { value: 101, label: "₹101/day", desc: "Feed 2 cows daily" },
  { value: 251, label: "₹251/day", desc: "Full day care" },
];

const DailySevaSubscription = ({ gaushalaId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState(101);
  const [subscribing, setSubscribing] = useState(false);

  const { data: existingSub } = useQuery({
    queryKey: ["seva-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any).from("seva_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleSubscribe = async () => {
    if (!user) {
      toast.info("Please sign in to subscribe");
      return;
    }
    setSubscribing(true);
    try {
      const { error } = await (supabase as any).from("seva_subscriptions").upsert(
        {
          user_id: user.id,
          amount: selectedAmount,
          frequency: "daily",
          status: "active",
          gaushala_id: gaushalaId || null,
        },
        { onConflict: "user_id,frequency" }
      );
      if (error) throw error;
      toast.success("Daily Seva subscription started! 🙏");
      queryClient.invalidateQueries({ queryKey: ["seva-subscription"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  if (existingSub) {
    return (
      <div className="rounded-xl bg-secondary/5 border border-secondary/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Check className="h-4 w-4 text-secondary" />
          <p className="text-sm font-semibold text-secondary">Daily Seva Active</p>
        </div>
        <p className="text-xs text-muted-foreground">
          ₹{Number(existingSub.amount).toLocaleString("en-IN")}/day auto-seva is running. You're building karma daily! 🔥
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Repeat className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Daily Seva Subscription</p>
          <p className="text-[11px] text-muted-foreground">Auto-donate every day, build your streak</p>
        </div>
      </div>

      {/* Amount selector */}
      <div className="grid grid-cols-3 gap-2">
        {AMOUNTS.map((a) => (
          <button
            key={a.value}
            onClick={() => setSelectedAmount(a.value)}
            className={`rounded-lg p-2 text-center border transition-colors ${
              selectedAmount === a.value
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <p className={`text-sm font-bold ${
              selectedAmount === a.value ? "text-primary" : "text-foreground"
            }`}>
              {a.label}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={subscribing}
        className="w-full h-11 rounded-lg text-sm font-semibold"
        size="lg"
      >
        {subscribing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Repeat className="h-4 w-4 mr-2" />
        )}
        {subscribing ? "Setting up..." : `Start ₹${selectedAmount}/day Seva`}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        Cancel anytime from your profile. No commitments.
      </p>
    </div>
  );
};

export default DailySevaSubscription;
