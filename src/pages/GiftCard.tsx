import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Gift, Heart, Share2, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import dhyanText from "@/assets/dhyan-flag.png";

const GiftCard = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const { data: order } = useQuery({
    queryKey: ["gift-order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const { data: orderItems } = useQuery({
    queryKey: ["gift-order-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const giftRecipientName = (order as any)?.gift_recipient_name || "Someone Special";
  const giftMessage = (order as any)?.gift_message || "";
  const donorName = order?.donor_name || "A well-wisher";

  const shareUrl = `${window.location.origin}/gift/${orderId}`;

  const shareText = `🎁 ${donorName} has gifted a Daan in your name!\n\n"${giftMessage}"\n\n₹${order?.total_amount || 0} donated to Dhyan Foundation's Gaushala.\n\nView your gift: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const handleWhatsAppShare = () => {
    const recipientPhone = (order as any)?.gift_recipient_phone;
    const whatsappUrl = recipientPhone
      ? `https://wa.me/${recipientPhone.replace(/\+/g, "")}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Gift Daan — Dhyan Foundation",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Gift Daan</h1>
      </header>

      <div className="px-5 space-y-5">
        {/* Success Banner */}
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
          <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground">Gift Daan Sent! 🎁</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Share this gift card with {giftRecipientName}
            </p>
          </div>
        </div>

        {/* Gift Card Preview */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
          {/* Card Header */}
          <div className="bg-gradient-to-br from-primary/20 via-accent to-primary/10 p-6 text-center relative">
            <div className="absolute top-3 right-3 opacity-20">
              <Heart className="h-16 w-16 text-primary" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-md mx-auto mb-3">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">A Gift of Daan</p>
            <h2 className="text-xl font-bold text-foreground">
              For {giftRecipientName}
            </h2>
          </div>

          {/* Card Body */}
          <div className="bg-card p-5 space-y-4">
            {/* Gift Message */}
            {giftMessage && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm italic text-foreground leading-relaxed">
                  "{giftMessage}"
                </p>
              </div>
            )}

            {/* Amount & Items */}
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">₹{order?.total_amount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">donated to Gau Seva</p>
            </div>

            {orderItems && orderItems.length > 0 && (
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.sku_name} × {item.quantity}</span>
                    <span className="font-medium text-foreground">₹{item.total_price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* From */}
            <div className="text-center pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">With love from</p>
              <p className="text-sm font-semibold text-foreground">{donorName}</p>
            </div>

            {/* Branding */}
            <div className="flex items-center justify-center gap-1 pt-2">
              <img src={dhyanText} alt="Dhyan Foundation" className="h-5 object-contain opacity-60" />
            </div>
          </div>
        </div>

        {/* Share Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground text-center">Share with {giftRecipientName}</h3>

          <Button
            onClick={handleWhatsAppShare}
            className="w-full h-12 rounded-lg text-base font-semibold bg-secondary hover:bg-secondary/90"
            size="lg"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Send via WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="w-full h-12 rounded-lg text-base font-semibold"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Share Link
          </Button>

          <Button
            variant="ghost"
            onClick={handleCopyLink}
            className="w-full h-10 rounded-lg text-sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* View Proof */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/proof/${orderId}`)}
          className="w-full text-sm text-muted-foreground"
        >
          View Daan Proof →
        </Button>
      </div>
    </div>
  );
};

export default GiftCard;
