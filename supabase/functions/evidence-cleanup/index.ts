import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const now = new Date().toISOString();

    // Find expired evidence
    const { data: expired, error: fetchErr } = await supabase
      .from("order_evidence")
      .select("id, storage_path")
      .lt("expires_at", now)
      .limit(100);

    if (fetchErr) throw fetchErr;
    if (!expired || expired.length === 0) {
      return new Response(
        JSON.stringify({ deleted: 0, message: "No expired evidence" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete storage files in batches
    const storagePaths = expired.map((e) => e.storage_path);
    const { error: storageErr } = await supabase.storage
      .from("order-evidence")
      .remove(storagePaths);

    if (storageErr) {
      console.error("Storage deletion error:", storageErr);
    }

    // Delete DB records
    const ids = expired.map((e) => e.id);
    const { error: deleteErr } = await supabase
      .from("order_evidence")
      .delete()
      .in("id", ids);

    if (deleteErr) throw deleteErr;

    return new Response(
      JSON.stringify({ deleted: ids.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
