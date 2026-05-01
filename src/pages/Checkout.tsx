import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CreditCard, Smartphone, Gift, Heart, MessageSquare, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { usePersona } from "@/hooks/usePersona";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const GIFT_MESSAGES = [
  "May this daan bring blessings to you and your family 🙏",
  "A seva in your name — wishing you peace and prosperity 🙏",
  "This gift of daan is made with love, for your well-being 🐄",
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart, gaushalaId } = useCart();
  const { user } = useAuth();
  const { persona } = usePersona();
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPan, setDonorPan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [panError, setPanError] = useState("");
  const [showPanWarning, setShowPanWarning] = useState(false);

  // Gift state
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientPhone, setGiftRecipientPhone] = useState("");
  const [giftMessage, setGiftMessage] = useState(GIFT_MESSAGES[0]);
  const [customGiftMessage, setCustomGiftMessage] = useState(false);

  // Auto-fill from saved profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, email, pan")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      if (profile.full_name && !donorName) setDonorName(profile.full_name);
      if (profile.phone && !donorPhone) setDonorPhone(profile.phone);
      if (profile.email && !donorEmail) setDonorEmail(profile.email);
      if (profile.pan && !donorPan) {
        const upper = profile.pan.toUpperCase();
        setDonorPan(upper);
        if (!PAN_REGEX.test(upper)) setPanError("Invalid PAN format (e.g. ABCDE1234F)");
      }
    }
  }, [profile]);

  const handlePanChange = (value: string) => {
    const upper = value.toUpperCase();
    setDonorPan(upper);
    if (upper && !PAN_REGEX.test(upper)) {
      setPanError("Invalid PAN format (e.g. ABCDE1234F)");
    } else {
      setPanError("");
    }
  };
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <p className="text-lg font-semibold text-foreground mb-2">No items to checkout</p>
        <Button onClick={() => navigate("/")} className="rounded-lg">Browse Daan</Button>
      </div>
    );
  }

  const handleInitiateDonate = () => {
    if (!donorName.trim() || !donorPhone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    if (!PHONE_REGEX.test(donorPhone.trim())) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }
    if (donorEmail && !EMAIL_REGEX.test(donorEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (isGift && !giftRecipientName.trim()) {
      toast.error("Please enter the recipient's name");
      return;
    }
    if (isGift && giftRecipientPhone && !PHONE_REGEX.test(giftRecipientPhone.trim())) {
      toast.error("Please enter a valid 10-digit phone for the recipient");
      return;
    }
    if (donorPan && !PAN_REGEX.test(donorPan)) {
      toast.error("Please enter a valid PAN (e.g. ABCDE1234F)");
      return;
    }
    if (!donorPan) {
      setShowPanWarning(true);
      return;
    }
    handleDonate();
  };

  const handleDonate = async () => {
    setShowPanWarning(false);
    if (submitting) return;
    setSubmitting(true);
    try {
      // Derive animal_type from cart items
      const categoryAnimalMap: Record<string, string> = {
        annapurna: 'cow', dhanwantry: 'cow', bajrang: 'cow', vishwakarma: 'cow',
        'dog-feed': 'dog', 'dog-rescue': 'dog',
        'cat-care': 'cat',
        'monkey-feed': 'monkey',
      };
      const animalTypes = [...new Set(items.map(i => categoryAnimalMap[i.categoryId] || 'cow'))];
      const derivedAnimalType = animalTypes.length === 1 ? animalTypes[0] : 'mixed';

      const guestToken = !user?.id ? crypto.randomUUID() : null;
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          donor_name: donorName,
          donor_phone: donorPhone,
          donor_email: donorEmail || null,
          donor_pan: donorPan || null,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: "pending",
          gaushala_id: gaushalaId || null,
          is_gift: isGift,
          gift_recipient_name: isGift ? giftRecipientName : null,
          gift_recipient_phone: isGift ? giftRecipientPhone || null : null,
          gift_message: isGift ? giftMessage : null,
          guest_token: guestToken,
          animal_type: derivedAnimalType,
          persona: persona,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Store guest token for later access to order
      if (guestToken) {
        localStorage.setItem(`guest_token_${order.id}`, guestToken);
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        sku_id: item.isCustomAmount ? null : item.skuId,
        sku_name: item.name,
        category_id: item.categoryId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        is_custom_amount: item.isCustomAmount || false,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Link referral if present
      const refCode = localStorage.getItem("df_referral_code");
      if (refCode && user) {
        await (supabase as any)
          .from("referrals")
          .update({
            referred_user_id: user.id,
            referred_order_id: order.id,
            status: "converted",
            converted_at: new Date().toISOString(),
          })
          .eq("referral_code", refCode)
          .eq("status", "pending");
        localStorage.removeItem("df_referral_code");
      }

      // Certificate is now generated server-side upon payment verification

      clearCart();
      toast.success("Order created! Redirecting to payment...");
      navigate(`/payment?order_id=${order.id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Checkout</h1>
      </header>

      <div className="px-5 space-y-5">
        {/* Order Summary */}
        <div className="rounded-lg bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Order Summary</p>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.skuId} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium text-foreground">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">₹{totalAmount}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-secondary">
            <Lock className="h-3 w-3" />
            <span>80G Tax Exemption Eligible</span>
          </div>
        </div>

        {/* Gift Toggle */}
        <div className="rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Gift this Daan</p>
                <p className="text-xs text-muted-foreground">Make this donation in someone's name</p>
              </div>
            </div>
            <Switch checked={isGift} onCheckedChange={setIsGift} />
          </div>

          {/* Gift Recipient Details */}
          {isGift && (
            <div className="mt-4 space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-semibold text-foreground">Recipient Details</h3>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Recipient's Name *"
                  value={giftRecipientName}
                  onChange={(e) => setGiftRecipientName(e.target.value)}
                  className="h-12 pl-10 rounded-lg bg-background"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Recipient's Phone (optional)"
                  type="tel"
                  value={giftRecipientPhone}
                  onChange={(e) => setGiftRecipientPhone(e.target.value)}
                  className="h-12 pl-10 rounded-lg bg-background"
                />
              </div>

              {/* Gift Message Presets */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Gift Message</p>
                </div>

                {!customGiftMessage && (
                  <div className="space-y-2">
                    {GIFT_MESSAGES.map((msg) => (
                      <button
                        key={msg}
                        onClick={() => setGiftMessage(msg)}
                        className={`w-full text-left text-xs p-3 rounded-lg border-2 transition-all ${
                          giftMessage === msg
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {msg}
                      </button>
                    ))}
                    <button
                      onClick={() => { setCustomGiftMessage(true); setGiftMessage(""); }}
                      className="text-xs text-primary font-medium"
                    >
                      Write custom message
                    </button>
                  </div>
                )}

                {customGiftMessage && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write your heartfelt message…"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="rounded-lg bg-background text-sm min-h-[80px]"
                      maxLength={200}
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setCustomGiftMessage(false); setGiftMessage(GIFT_MESSAGES[0]); }}
                        className="text-xs text-primary font-medium"
                      >
                        Use preset message
                      </button>
                      <span className="text-xs text-muted-foreground">{giftMessage.length}/200</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Donor Form */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            {isGift ? "Your Details (Donor)" : "Your Details"}
          </h3>
          <Input
            placeholder="Full Name *"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="h-12 rounded-lg bg-card"
          />
          <Input
            placeholder="Phone Number *"
            type="tel"
            value={donorPhone}
            onChange={(e) => setDonorPhone(e.target.value)}
            className="h-12 rounded-lg bg-card"
          />
          <Input
            placeholder="Email (for receipt)"
            type="email"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="h-12 rounded-lg bg-card"
          />
          <div>
            <Input
              placeholder="PAN (optional, for 80G receipt)"
              value={donorPan}
              onChange={(e) => handlePanChange(e.target.value)}
              className={`h-12 rounded-lg bg-card ${panError ? "border-destructive" : ""}`}
              maxLength={10}
            />
            {panError && <p className="text-xs text-destructive mt-1">{panError}</p>}
            <p className="text-[11px] text-muted-foreground mt-1">
              Name on PAN must match donor name for valid 80G receipt
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("upi")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${
                paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <Smartphone className={`h-5 w-5 ${paymentMethod === "upi" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${paymentMethod === "upi" ? "text-primary" : "text-foreground"}`}>UPI</span>
            </button>
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${paymentMethod === "card" ? "text-primary" : "text-foreground"}`}>Card</span>
            </button>
          </div>
        </div>

        <Button
          onClick={handleInitiateDonate}
          disabled={submitting}
          className="w-full h-12 rounded-lg text-base font-semibold shadow-lg mt-4"
          size="lg"
        >
          {isGift ? <Gift className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
          {submitting
            ? "Processing..."
            : isGift
              ? `Gift Daan — ₹${totalAmount}`
              : `Donate Securely — ₹${totalAmount}`}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Your donation is secured with 256-bit encryption
        </p>
      </div>

      {/* No-PAN Warning Dialog */}
      <AlertDialog open={showPanWarning} onOpenChange={setShowPanWarning}>
        <AlertDialogContent className="mx-4 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>No 80G Tax Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              You have not entered your PAN. Without PAN, you will <strong>not</strong> receive an 80G tax-deductible receipt for this donation. Do you wish to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleDonate}>Continue Without 80G</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Checkout;
