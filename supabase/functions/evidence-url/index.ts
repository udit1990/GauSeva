import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { storage_paths }: { storage_paths: string[] } = body;

    if (!storage_paths || !Array.isArray(storage_paths) || storage_paths.length === 0) {
      return new Response(
        JSON.stringify({ error: "storage_paths array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is authenticated OR has a valid guest token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Guest path: verify guest_token matches the order
      const guestToken = body.guest_token;
      const orderId = body.order_id;

      if (!guestToken || !orderId) {
        return new Response(
          JSON.stringify({ error: "Authorization or guest_token+order_id required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify guest token matches order (using service role)
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .eq("guest_token", guestToken)
        .is("user_id", null)
        .single();

      if (orderErr || !order) {
        return new Response(
          JSON.stringify({ error: "Invalid guest token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Authenticated path: verify JWT
      const anonClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await anonClient.auth.getUser();
      if (authErr || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Limit batch size
    const paths = storage_paths.slice(0, 50);

    const urls: Record<string, string> = {};
    for (const path of paths) {
      const { data, error } = await supabase.storage
        .from("order-evidence")
        .createSignedUrl(path, 600); // 10-minute expiry

      if (data?.signedUrl) {
        urls[path] = data.signedUrl;
      }
    }

    return new Response(
      JSON.stringify({ urls }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
