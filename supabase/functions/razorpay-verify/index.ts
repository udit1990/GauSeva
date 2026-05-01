import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expectedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Razorpay secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internal_order_id) {
      return new Response(
        JSON.stringify({ error: "Missing required payment details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Payment verification failed", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: orderData, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_method: "razorpay",
        razorpay_order_id,
        razorpay_payment_id,
      })
      .eq("id", internal_order_id)
      .select("*")
      .single();

    if (updateError) {
      console.error("DB update error:", updateError);
    }

    // Generate tax receipt / certificate on successful payment
    if (orderData) {
      const certType = orderData.donor_pan ? "80g" : "general";
      const certNumber = `DF-${internal_order_id.slice(0, 8).toUpperCase()}`;
      const { error: certError } = await supabase.from("certificates").insert({
        order_id: internal_order_id,
        user_id: orderData.user_id,
        certificate_type: certType,
        certificate_number: certNumber,
        donor_name: orderData.donor_name,
        donor_email: orderData.donor_email || null,
        donor_pan: orderData.donor_pan || null,
        amount: orderData.total_amount,
      });
      if (certError) {
        console.error("Certificate generation error:", certError);
      }

      // Trigger gift WhatsApp notification (feature-flagged in the function itself)
      if (orderData.is_gift && orderData.gift_recipient_phone) {
        try {
          const notifyUrl = `${supabaseUrl}/functions/v1/gift-whatsapp-notify`;
          await fetch(notifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({ order_id: internal_order_id }),
          });
        } catch (notifyErr) {
          console.error("Gift WhatsApp notify error:", notifyErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        verified: true,
        razorpay_payment_id,
        order_id: internal_order_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
