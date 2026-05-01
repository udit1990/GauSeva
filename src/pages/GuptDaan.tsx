import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeOff, Sparkles, Heart, Lock, Smartphone, CreditCard, MapPin, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useGaushalas } from "@/hooks/useGaushalas";
import { useAuth } from "@/hooks/useAuth";
import { usePersona } from "@/hooks/usePersona";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const presetAmounts = [251, 501, 1100, 2100, 5100, 11000];

const GuptDaan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isHindi } = usePersona();
  const { data: gaushalas } = useGaushalas(true);
  const [step, setStep] = useState<"amount" | "confirm">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [gaushalaId, setGaushalaId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [submitting, setSubmitting] = useState(false);

  const amount = selectedAmount || Number(customAmount) || 0;

  const handleAmountSelect = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount("");
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const handleProceed = () => {
    if (amount < 1) {
      toast.error(t("Please select or enter an amount", "कृपया राशि चुनें या दर्ज करें"));
      return;
    }
    if (!gaushalaId) {
      toast.error(t("Please select a gaushala", "कृपया गौशाला चुनें"));
      return;
    }
    setStep("confirm");
  };

  const handleDonate = async () => {
    setSubmitting(true);
    try {
      const guestToken = user ? null : crypto.randomUUID();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          donor_name: "Gupt Daata",
          donor_phone: "anonymous",
          total_amount: amount,
          payment_method: paymentMethod,
          status: "pending",
          gaushala_id: gaushalaId,
          guest_token: guestToken,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      await supabase.from("order_items").insert({
        order_id: order.id,
        sku_name: "Gupt Daan",
        quantity: 1,
        unit_price: amount,
        total_price: amount,
        is_custom_amount: true,
      });

      // Store guest token for later access
      if (guestToken) {
        localStorage.setItem(`guest_token_${order.id}`, guestToken);
      }

      toast.success(t("Redirecting to payment...", "पेमेंट पर भेज रहे हैं…"));
      navigate(`/payment?order_id=${order.id}`);
    } catch (err: any) {
      toast.error(err.message || t("Something went wrong", "कुछ गलत हो गया"));
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="relative px-5 pt-12 pb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
          <Gift className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground" {...(isHindi ? { lang: "hi" } : {})}>
          {t("Gupt Daan", "गुप्त दान")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto" {...(isHindi ? { lang: "hi" } : {})}>
          {t(
            "Anonymous donation — no personal details recorded. Pure silent seva.",
            "गुमनाम दान — कोई जानकारी नहीं ली जाएगी। शुद्ध मौन सेवा।"
          )}
        </p>
      </header>

      <div className="px-5 space-y-5">
        {step === "amount" ? (
          <>
            {/* Vedic quote */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 leading-relaxed" lang="hi">
                <span className="font-semibold text-foreground">गुप्त दान</span> —{" "}
                {t(
                  "The highest form of charity. Your identity remains hidden, only the blessing flows.",
                  "दान का सबसे ऊँचा रूप। आपकी पहचान छिपी रहती है, बस आशीर्वाद बहता है।"
                )}
              </p>
            </div>

            {/* Amount selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground" {...(isHindi ? { lang: "hi" } : {})}>
                {t("Select Amount", "राशि चुनें")}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAmountSelect(val)}
                    className={cn(
                      "rounded-xl border-2 py-3 text-center transition-all",
                      selectedAmount === val
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card"
                    )}
                  >
                    <p className={cn(
                      "text-base font-bold",
                      selectedAmount === val ? "text-primary" : "text-foreground"
                    )}>
                      ₹{val.toLocaleString("en-IN")}
                    </p>
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder={t("Enter custom amount", "अपनी राशि दर्ज करें")}
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="h-12 pl-8 rounded-lg bg-card text-base"
                />
              </div>
            </div>

            {/* Gaushala selection */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5" {...(isHindi ? { lang: "hi" } : {})}>
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {t("Select Gaushala", "गौशाला चुनें")}
              </h3>
              <Select value={gaushalaId} onValueChange={setGaushalaId}>
                <SelectTrigger className="h-12 rounded-lg bg-card text-sm">
                  <SelectValue placeholder={t("Choose a gaushala", "गौशाला चुनें")} />
                </SelectTrigger>
                <SelectContent>
                  {gaushalas?.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-sm">
                      {g.name} — {g.city}, {g.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CTA */}
            <Button
              onClick={handleProceed}
              disabled={amount < 1}
              className="w-full h-12 rounded-lg text-base font-semibold shadow-lg"
              size="lg"
            >
              <Heart className="h-4 w-4 mr-2" />
              {amount > 0
                ? t(`Proceed — ₹${amount.toLocaleString("en-IN")}`, `आगे बढ़ें — ₹${amount.toLocaleString("en-IN")}`)
                : t("Select Amount", "राशि चुनें")}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground" {...(isHindi ? { lang: "hi" } : {})}>
              <EyeOff className="inline h-3 w-3 mr-1" />
              {t("No name, phone, or email will be recorded", "कोई नाम, फ़ोन या ईमेल रिकॉर्ड नहीं होगा")}
            </p>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-destructive">80G Notice:</span>{" "}
                Anonymous donations are <span className="font-medium">not eligible</span> for 80G tax-deduction receipts under Indian Income Tax rules.
              </p>
            </div>
          </>
        ) : (
          /* Confirm step */
          <>
            <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider" {...(isHindi ? { lang: "hi" } : {})}>
                {t("Gupt Daan Summary", "गुप्त दान सारांश")}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground" {...(isHindi ? { lang: "hi" } : {})}>
                  {t("Anonymous Donation", "गुमनाम दान")}
                </span>
                <span className="text-lg font-bold text-primary">₹{amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span {...(isHindi ? { lang: "hi" } : {})}>{t("Gaushala", "गौशाला")}</span>
                <span className="font-medium text-foreground">
                  {gaushalas?.find((g) => g.id === gaushalaId)?.name}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex items-center gap-1 text-xs text-muted-foreground" {...(isHindi ? { lang: "hi" } : {})}>
                <EyeOff className="h-3 w-3" />
                <span>{t("Identity will remain anonymous", "पहचान गुमनाम रहेगी")}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground" {...(isHindi ? { lang: "hi" } : {})}>
                {t("Payment Method", "पेमेंट का तरीका")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all",
                    paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <Smartphone className={cn("h-5 w-5", paymentMethod === "upi" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", paymentMethod === "upi" ? "text-primary" : "text-foreground")}>UPI</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all",
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <CreditCard className={cn("h-5 w-5", paymentMethod === "card" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", paymentMethod === "card" ? "text-primary" : "text-foreground")}>Card</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("amount")}
                className="flex-1 h-12 rounded-lg"
              >
                {t("Back", "वापस")}
              </Button>
              <Button
                onClick={handleDonate}
                disabled={submitting}
                className="flex-1 h-12 rounded-lg text-base font-semibold shadow-lg"
              >
                <Lock className="h-4 w-4 mr-2" />
                {submitting ? t("Processing…", "प्रोसेसिंग…") : t("Donate", "दान करें")}
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Secured with 256-bit encryption
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default GuptDaan;
