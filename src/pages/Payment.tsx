import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, Loader2, CheckCircle2, XCircle, Smartphone, CreditCard, Landmark, Download, Share2, Gift, Heart, Eye, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadReceipt } from "@/lib/receiptGenerator";
import { getGuestToken } from "@/lib/guestToken";
import { fetchGuestOrder } from "@/lib/fetchGuestOrder";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success" | "failed">("loading");
  const [order, setOrder] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Fetch order items for success view — must be before any early returns (Rules of Hooks)
  const guestTokenForItems = orderId ? getGuestToken(orderId) : null;
  const { data: orderItems } = useQuery({
    queryKey: ["payment-order-items", orderId, !!guestTokenForItems],
    queryFn: async () => {
      if (!orderId) return [];
      if (guestTokenForItems) {
        const result = await fetchGuestOrder(orderId, guestTokenForItems);
        return (result?.order_items || []) as any[];
      }
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && status === "success",
  });

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById("razorpay-script")) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(script);
  }, []);

  // Fetch order details
  useEffect(() => {
    if (!orderId) {
      toast.error("No order found");
      navigate("/");
      return;
    }

    const fetchOrder = async () => {
      const guestToken = getGuestToken(orderId);

      let data: any = null;
      let error: any = null;

      if (guestToken) {
        // Use secure RPC for guest orders
        const result = await fetchGuestOrder(orderId, guestToken);
        if (result) {
          data = result.order;
        } else {
          error = { message: "Invalid guest token" };
        }
      } else {
        // Authenticated user — direct query via RLS
        const res = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();
        data = res.data;
        error = res.error;
      }

      if (error || !data) {
        toast.error("Order not found");
        navigate("/");
        return;
      }

      if (data.status === "paid") {
        setStatus("success");
        setOrder(data);
        return;
      }

      setOrder(data);
      setStatus("ready");
    };
    fetchOrder();
  }, [orderId, navigate]);

  const initiatePayment = useCallback(async () => {
    if (!order || !razorpayLoaded) return;
    setStatus("processing");

    try {
      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke("razorpay-order", {
        body: {
          amount: Math.round(order.total_amount * 100), // Convert to paise
          order_id: order.id,
          donor_name: order.donor_name,
          donor_email: order.donor_email,
          donor_phone: order.donor_phone,
        },
      });

      if (error || !data?.razorpay_order_id) {
        throw new Error(data?.error || "Failed to create payment order");
      }

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Dhyan Foundation",
        description: `Seva Daan — Order ${order.id.slice(0, 8)}`,
        order_id: data.razorpay_order_id,
        prefill: {
          name: order.donor_name,
          email: order.donor_email || "",
          contact: order.donor_phone || "",
        },
        theme: {
          color: "#D97706", // primary amber
        },
        handler: async (response: any) => {
          // Verify payment
          setStatus("processing");
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("razorpay-verify", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internal_order_id: order.id,
              },
            });

            if (verifyError || !verifyData?.verified) {
              throw new Error("Payment verification failed");
            }

            setStatus("success");
            toast.success("Payment successful! 🙏");
          } catch {
            setStatus("failed");
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("ready");
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        setStatus("failed");
        toast.error(response.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment init error:", err);
      setStatus("failed");
      toast.error(err.message || "Payment failed to initialize");
    }
  }, [order, razorpayLoaded]);

  const handleDownloadReceipt = () => {
    if (!order || !orderId) return;
    downloadReceipt({
      receiptNumber: `DF-${orderId.slice(0, 8).toUpperCase()}`,
      date: new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      donorName: order.donor_name,
      donorEmail: order.donor_email || undefined,
      donorPan: order.donor_pan || undefined,
      amount: Number(order.total_amount),
      orderId: orderId,
    });
  };

  const handleWhatsAppShare = () => {
    if (!order) return;
    const text = order.is_gift
      ? `🎁 I just gifted a Seva Daan of ₹${order.total_amount} to ${order.gift_recipient_name} through Dhyan Foundation! 🙏🐄\n\nJoin me in making a difference: ${window.location.origin}`
      : `🙏 I just donated ₹${order.total_amount} to Dhyan Foundation for Gau Seva! 🐄\n\nEvery contribution counts. Join me: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background pb-8">
        {/* Celebration header */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary/15 to-background px-5 pt-14 pb-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent shadow-md mb-4">
            {order?.is_gift ? (
              <Gift className="h-10 w-10 text-primary" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-primary" />
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {order?.is_gift ? "Gift Daan Successful! 🎁" : "Daan Successful! 🙏"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Thank you <span className="font-semibold text-foreground">{order?.donor_name}</span> for your generous contribution
          </p>
          <p className="text-2xl font-bold text-primary mt-3">₹{Number(order?.total_amount).toLocaleString("en-IN")}</p>
        </div>

        <div className="px-5 space-y-4 mt-2">
          {/* Gift message */}
          {order?.is_gift && (
            <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-destructive" />
                <p className="text-xs font-semibold text-foreground">Gift for {order.gift_recipient_name}</p>
              </div>
              {order.gift_message && (
                <p className="text-xs text-muted-foreground italic">"{order.gift_message}"</p>
              )}
            </div>
          )}

          {/* Order items */}
          {orderItems && orderItems.length > 0 && (
            <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
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

          {/* Certificate info */}
          <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
            <p className="text-sm font-semibold text-foreground">
              {order?.donor_pan
                ? "✅ 80G Tax Receipt Generated"
                : "📄 Donation Certificate Generated"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {order?.donor_pan
                ? "Your 80G tax-deductible receipt is ready for download."
                : "A general donation certificate has been issued for your records."}
            </p>
          </div>

          {/* Guest upsell — create account prompt */}
          {!order?.user_id && (
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/30 p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <UserPlus className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Create an account to unlock more</p>
                  <ul className="text-xs text-muted-foreground mt-1.5 space-y-1">
                    <li>📍 Track your seva in real-time</li>
                    <li>📜 Download 80G tax receipts anytime</li>
                    <li>🔔 Get notified when your seva goes live</li>
                  </ul>
                  <Button
                    onClick={() => navigate("/auth?redirect=/my-contributions")}
                    size="sm"
                    className="mt-3 h-9 rounded-lg text-xs font-semibold"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Create Free Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <Button onClick={handleDownloadReceipt} className="w-full h-12 rounded-lg text-sm font-semibold" size="lg">
              <Download className="h-4 w-4 mr-2" />
              {order?.donor_pan ? "Download 80G Receipt" : "Download Certificate"}
            </Button>

            <Button onClick={handleWhatsAppShare} variant="secondary" className="w-full h-12 rounded-lg text-sm font-semibold" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>

            <Button
              onClick={() => navigate(order?.is_gift ? `/gift/${order.id}` : `/proof/${order.id}`)}
              variant="outline"
              className="w-full h-12 rounded-lg text-sm font-semibold"
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" />
              {order?.is_gift ? "View Gift Card" : "View Daan Proof"}
            </Button>

            <Button variant="ghost" onClick={() => navigate("/")} className="w-full h-10 rounded-lg text-sm text-muted-foreground">
              Back to Home
            </Button>
          </div>

          {/* Reference */}
          <p className="text-center text-[11px] text-muted-foreground">
            Order Ref: DF-{orderId?.slice(0, 8).toUpperCase()} • {new Date(order?.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Payment Failed</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Something went wrong with your payment. Your donation has not been charged.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
          <Button onClick={() => setStatus("ready")} className="w-full rounded-lg">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/checkout")} className="w-full rounded-lg">
            Back to Checkout
          </Button>
        </div>
      </div>
    );
  }

  // Ready state — show order summary + pay button
  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate("/checkout")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Payment</h1>
      </header>

      <div className="px-5 space-y-5">
        {/* Order Summary Card */}
        <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Order Summary</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Donor</span>
            <span className="text-sm font-medium text-foreground">{order?.donor_name}</span>
          </div>
          {order?.is_gift && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Gift To</span>
              <span className="text-sm font-medium text-foreground">{order?.gift_recipient_name}</span>
            </div>
          )}
          <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">₹{order?.total_amount}</span>
          </div>
        </div>

        {/* Payment Methods Info */}
        <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Accepted Methods</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-background">
              <Smartphone className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">UPI</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-background">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">Card</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-background">
              <Landmark className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">NetBanking</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          onClick={initiatePayment}
          disabled={status === "processing" || !razorpayLoaded}
          className="w-full h-14 rounded-xl text-base font-semibold shadow-lg"
          size="lg"
        >
          {status === "processing" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Pay ₹{order?.total_amount}
            </>
          )}
        </Button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>Secured by Razorpay · 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};

export default Payment;
