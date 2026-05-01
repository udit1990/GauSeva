import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Share2, Play, MapPin, User, CheckCircle2, Circle, Clock, Video, Camera } from "lucide-react";
import DailySevaSubscription from "@/components/DailySevaSubscription";
import StoryCard from "@/components/StoryCard";
import ReferralCard from "@/components/ReferralCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { downloadReceipt } from "@/lib/receiptGenerator";
import { getGuestToken } from "@/lib/guestToken";
import { fetchGuestOrder } from "@/lib/fetchGuestOrder";

/* ── Step definitions ── */
interface Step {
  key: string;
  label: string;
  subtitle: string;
  icon: typeof CheckCircle2;
}

const STEPS: Step[] = [
  { key: "paid", label: "Payment Received", subtitle: "Your daan is confirmed", icon: CheckCircle2 },
  { key: "assigned", label: "Seva Assigned", subtitle: "A volunteer has been assigned", icon: User },
  { key: "preparing", label: "Preparing Your Seva", subtitle: "Items are being prepared", icon: Clock },
  { key: "evidence", label: "Live Proof Available", subtitle: "Photos/video uploaded", icon: Camera },
  { key: "completed", label: "Seva Complete", subtitle: "Your daan is fulfilled 🙏", icon: CheckCircle2 },
];

const statusToStepIndex = (status: string, hasEvidence: boolean, hasVolunteer: boolean): number => {
  if (status === "completed" || status === "fulfilled") return 4;
  if (hasEvidence) return 3;
  if (status === "in_progress" || status === "preparing") return 2;
  if (hasVolunteer) return 1;
  if (status === "paid") return 0;
  return -1; // pending — not yet paid
};

const Proof = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const guestToken = orderId ? getGuestToken(orderId) : null;

  const { data: guestData, isLoading: guestOrderLoading } = useQuery({
    queryKey: ["guest-order-rpc", orderId, guestToken],
    queryFn: async () => {
      if (!orderId || !guestToken) return null;
      return fetchGuestOrder(orderId, guestToken);
    },
    enabled: !!orderId && !!guestToken,
    refetchInterval: 5000,
  });

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !guestToken,
    refetchInterval: 5000,
  });

  const resolvedOrder = guestToken ? (guestData?.order as any) : order;
  const isOrderLoading = guestToken ? guestOrderLoading : orderLoading;
  const isOrderMissing = !!orderId && !isOrderLoading && !resolvedOrder;

  const { data: orderItems } = useQuery({
    queryKey: ["order-items", orderId, !!guestToken],
    queryFn: async () => {
      if (!orderId) return [];
      if (guestToken && guestData) {
        return (guestData.order_items || []) as any[];
      }
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && (!guestToken || !!guestData),
  });

  const { data: evidence } = useQuery({
    queryKey: ["order-evidence", orderId, !!guestToken],
    queryFn: async () => {
      if (!orderId) return [];

      let rawEvidence: any[];
      if (guestToken && guestData) {
        rawEvidence = (guestData.order_evidence || []) as any[];
      } else {
        const { data, error } = await supabase
          .from("order_evidence")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at");
        if (error) throw error;
        rawEvidence = data || [];
      }

      if (rawEvidence.length === 0) return [];

      // Fetch signed URLs via edge function
      const paths = rawEvidence.map((e: any) => e.storage_path);
      let urls: Record<string, string> = {};
      try {
        const invokeBody: Record<string, unknown> = { storage_paths: paths };
        if (guestToken && orderId) {
          invokeBody.guest_token = guestToken;
          invokeBody.order_id = orderId;
        }
        const { data: urlData } = await supabase.functions.invoke("evidence-url", {
          body: invokeBody,
        });
        urls = urlData?.urls || {};
      } catch {
        // Bucket is private — no public URL fallback
      }
      return rawEvidence.map((e: any) => ({
        ...e,
        publicUrl: urls[e.storage_path] || "",
      }));
    },
    enabled: !!orderId && (!guestToken || !!guestData),
    refetchInterval: 15000,
  });

  // Volunteer profile
  const { data: volunteer } = useQuery({
    queryKey: ["volunteer-profile", resolvedOrder?.assigned_volunteer],
    queryFn: async () => {
      if (!resolvedOrder?.assigned_volunteer) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone")
        .eq("id", resolvedOrder?.assigned_volunteer)
        .single();
      return data;
    },
    enabled: !!resolvedOrder?.assigned_volunteer,
  });

  // Gaushala info
  const { data: gaushala } = useQuery({
    queryKey: ["gaushala", resolvedOrder?.gaushala_id],
    queryFn: async () => {
      if (!resolvedOrder?.gaushala_id) return null;
      const { data } = await supabase
        .from("gaushalas_list")
        .select("name, city, state")
        .eq("id", resolvedOrder?.gaushala_id)
        .single();
      return data;
    },
    enabled: !!resolvedOrder?.gaushala_id,
  });

  const hasEvidence = (evidence?.length || 0) > 0;
  const hasVolunteer = !!resolvedOrder?.assigned_volunteer;
  const activeStep = resolvedOrder ? statusToStepIndex(resolvedOrder?.status, hasEvidence, hasVolunteer) : -1;

  const handleDownloadReceipt = () => {
    if (!resolvedOrder || !orderId) return;
    downloadReceipt({
      receiptNumber: `DF-${orderId.slice(0, 8).toUpperCase()}`,
      date: new Date(resolvedOrder?.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      donorName: resolvedOrder?.donor_name,
      donorEmail: resolvedOrder?.donor_email || undefined,
      donorPan: resolvedOrder?.donor_pan || undefined,
      amount: Number(resolvedOrder?.total_amount),
      orderId: orderId,
    });
  };

  const handleWhatsAppShare = () => {
    if (!resolvedOrder) return;
    const text = `🙏 I just donated ₹${resolvedOrder?.total_amount} to Dhyan Foundation for Gau Seva! 🐄\n\nTrack my seva live: ${window.location.origin}/proof/${orderId}\n\nJoin me: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (isOrderLoading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Seva Tracker</h1>
          </div>
        </header>
        <div className="px-5">
          <div className="rounded-xl bg-card p-6 shadow-sm border border-border text-center">
            <p className="text-sm text-muted-foreground">Loading your seva details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isOrderMissing) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Seva Tracker</h1>
          </div>
        </header>
        <div className="px-5">
          <div className="rounded-xl bg-card p-6 shadow-sm border border-border text-center space-y-3">
            <p className="text-lg font-semibold text-foreground">Seva not found</p>
            <p className="text-sm text-muted-foreground">
              This tracking link is invalid, expired, or not available for your account.
            </p>
            <Button onClick={() => navigate("/")} className="rounded-lg">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Seva Tracker</h1>
          {orderId && (
            <p className="text-[10px] text-muted-foreground font-mono">
              DF-{orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>
      </header>

      <div className="px-5 space-y-5">
        {/* Amount + Status Hero */}
        <div className="rounded-xl bg-card p-5 shadow-sm border border-border text-center">
          <p className="text-2xl font-bold text-primary">
            ₹{resolvedOrder ? Number(resolvedOrder?.total_amount).toLocaleString("en-IN") : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {order?.donor_name || "Loading..."}
          </p>
          {resolvedOrder && (
            <p className="text-xs font-medium text-secondary mt-2">
              {resolvedOrder?.donor_pan ? "80G Receipt Ready" : "Donation Certificate Ready"}
            </p>
          )}
        </div>

        {/* ── Vertical Progress Stepper ── */}
        <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Seva Progress</h3>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const isComplete = i <= activeStep;
              const isActive = i === activeStep;
              const isFuture = i > activeStep;
              const isLast = i === STEPS.length - 1;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex gap-3">
                  {/* Connector column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isComplete
                          ? "bg-secondary text-secondary-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete && !isActive ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[28px] transition-colors ${
                          isComplete && !isActive ? "bg-secondary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                    <p
                      className={`text-sm font-semibold leading-tight ${
                        isFuture ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {step.label}
                      {isActive && activeStep < 4 && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                          </span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>

                    {/* Inline details for specific steps */}
                    {step.key === "assigned" && isComplete && volunteer && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/20">
                          <User className="h-3.5 w-3.5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{volunteer.full_name || "Volunteer"}</p>
                          <p className="text-[10px] text-muted-foreground">Assigned Sevak</p>
                        </div>
                      </div>
                    )}

                    {step.key === "evidence" && isComplete && (
                      <div className="mt-2 flex items-center gap-2">
                        <Video className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-medium text-primary">
                          {evidence?.length} file{(evidence?.length || 0) > 1 ? "s" : ""} uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gaushala Info */}
        {gaushala && (
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{gaushala.name}</p>
              <p className="text-xs text-muted-foreground">{gaushala.city}, {gaushala.state}</p>
            </div>
          </div>
        )}

        {/* Order Items */}
        {orderItems && orderItems.length > 0 && (
          <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Items</p>
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.sku_name} × {item.quantity}</span>
                  <span className="font-medium text-foreground">₹{Number(item.total_price).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Gallery */}
        {hasEvidence && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Proof of Seva</h3>
            <div className="grid grid-cols-2 gap-2">
              {evidence!.map((e) => (
                <div key={e.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {e.media_type === "video" ? (
                    <div className="relative h-full w-full">
                      <video src={e.publicUrl} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 shadow-lg">
                          <Play className="h-5 w-5 text-primary ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img src={e.publicUrl} alt={e.caption || "Seva proof"} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  {e.caption && (
                    <p className="absolute bottom-0 left-0 right-0 bg-foreground/60 px-2 py-1 text-xs text-primary-foreground truncate">
                      {e.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasEvidence && activeStep >= 0 && activeStep < 3 && (
          <div className="rounded-lg bg-muted/50 p-5 text-center">
            <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Proof will be uploaded soon</p>
            <p className="text-xs text-muted-foreground mt-0.5">Our volunteer team will share photos & videos</p>
          </div>
        )}

        {/* Story Card for Social Sharing */}
        {resolvedOrder && (
          <StoryCard
            donorName={resolvedOrder?.donor_name}
            amount={Number(resolvedOrder?.total_amount)}
            gaushalaName={gaushala?.name}
            orderId={orderId || ""}
            evidenceUrl={evidence?.[0]?.publicUrl}
          />
        )}

        {/* Referral Program */}
        {resolvedOrder && orderId && <ReferralCard orderId={orderId} />}

        {/* Daily Subscription CTA */}
        {resolvedOrder && activeStep >= 0 && (
          <DailySevaSubscription gaushalaId={resolvedOrder?.gaushala_id} />
        )}

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <Button
            onClick={handleWhatsAppShare}
            className="w-full h-12 rounded-lg text-sm font-semibold bg-secondary hover:bg-secondary/90"
            size="lg"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-lg text-sm font-semibold"
            size="lg"
            onClick={handleDownloadReceipt}
          >
            <Download className="h-4 w-4 mr-2" />
            {order?.donor_pan ? "Download 80G Receipt" : "Download Certificate"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Proof;
