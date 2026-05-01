import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check feature flag from database
    const { data: flag } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("id", "gift_whatsapp_notify")
      .single();

    if (!flag?.enabled) {
      return new Response(
        JSON.stringify({ sent: false, reason: "feature_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Missing order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order.is_gift || !order.gift_recipient_phone) {
      return new Response(
        JSON.stringify({ sent: false, reason: "not_a_gift_or_no_phone" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compose message
    const giftMessage = order.gift_message || "A seva donation has been made in your name 🙏";
    const amount = Number(order.total_amount).toLocaleString("en-IN");
    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", "");

    const whatsappBody = [
      `🎁 *Gift Daan Notification*`,
      ``,
      `Namaste ${order.gift_recipient_name}! 🙏`,
      ``,
      `${order.donor_name} has made a Seva Daan of *₹${amount}* in your name through Dhyan Foundation.`,
      ``,
      `💌 "${giftMessage}"`,
      ``,
      `🐄 Your gift contributes to the care and protection of Gau Mata.`,
      ``,
      `View your gift card: ${siteUrl}/gift/${order_id}`,
    ].join("\n");

    // TODO: Integrate with Twilio/WhatsApp Business API
    // For now, log the message that would be sent
    console.log(`[GIFT_WHATSAPP] Would send to ${order.gift_recipient_phone}:`, whatsappBody);

    // Placeholder for actual API call:
    // const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    // const TWILIO_AUTH = Deno.env.get("TWILIO_AUTH_TOKEN");
    // const TWILIO_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM"); // e.g. "whatsapp:+14155238886"
    // const response = await fetch(
    //   `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Basic ${btoa(`${TWILIO_SID}:${TWILIO_AUTH}`)}`,
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //       From: TWILIO_FROM,
    //       To: `whatsapp:${order.gift_recipient_phone}`,
    //       Body: whatsappBody,
    //     }),
    //   }
    // );

    return new Response(
      JSON.stringify({ sent: false, reason: "api_not_configured", message_preview: whatsappBody }),
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
