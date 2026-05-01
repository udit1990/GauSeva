import { useState, useEffect } from "react";
import { Copy, Users, Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReferralCardProps {
  orderId: string;
}

const ReferralCard = ({ orderId }: ReferralCardProps) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const code = `DF${user.id.slice(0, 6).toUpperCase()}`;
    setReferralCode(code);

    // Check if referral entry exists, create if not
    const initReferral = async () => {
      const { data: existing } = await (supabase as any)
        .from("referrals")
        .select("id")
        .eq("referrer_id", user.id)
        .eq("referral_code", code)
        .maybeSingle();

      if (!existing) {
        await (supabase as any).from("referrals").insert({
          referrer_id: user.id,
          referral_code: code,
        });
      }

      // Count conversions
      const { count } = await (supabase as any)
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .eq("status", "converted");

      setReferralCount(count || 0);
    };

    initReferral();
  }, [user]);

  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppReferral = () => {
    const text = `🙏 I just completed a Gau Seva through Dhyan Foundation!\n\nJoin me and contribute: ${referralLink}\n\nEvery donation gets live photo/video proof 🐄`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!user) return null;

  return (
    <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Gift className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Refer & Earn Punya</p>
          <p className="text-[10px] text-muted-foreground">Share seva with friends & family</p>
        </div>
      </div>

      {/* Referral stats */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 mb-3">
        <Users className="h-4 w-4 text-secondary" />
        <div>
          <p className="text-xs font-semibold text-foreground">
            {referralCount} friend{referralCount !== 1 ? "s" : ""} joined
          </p>
          <p className="text-[10px] text-muted-foreground">through your referral</p>
        </div>
      </div>

      {/* Referral code display */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 mb-3">
        <p className="flex-1 text-xs font-mono text-foreground truncate">{referralLink}</p>
        <button
          onClick={handleCopy}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0"
        >
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-primary" />
          )}
        </button>
      </div>

      {/* Share button */}
      <Button
        onClick={handleWhatsAppReferral}
        className="w-full h-10 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/90"
      >
        Share via WhatsApp
      </Button>
    </div>
  );
};

export default ReferralCard;
