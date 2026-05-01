import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

interface EvidenceRequest {
  evidence_id: string;
  order_id: string;
}

const autoApprovableOrderStatuses = new Set([
  "paid",
  "assigned",
  "preparing",
  "in_progress",
  "fulfilled",
  "completed",
]);

const isSupportedBasicImage = (file: Blob, storagePath: string, mediaType: string) => {
  if (mediaType !== "image") return false;
  if (file.type.startsWith("image/")) return true;

  const ext = storagePath.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext || "");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth gate: verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const supabase = createClient(supabaseUrl, serviceKey);
    const { evidence_id, order_id }: EvidenceRequest = await req.json();

    if (!evidence_id || !order_id) {
      return new Response(
        JSON.stringify({ error: "evidence_id and order_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch evidence record
    const { data: evidence, error: fetchErr } = await supabase
      .from("order_evidence")
      .select("*")
      .eq("id", evidence_id)
      .single();

    if (fetchErr || !evidence) {
      return new Response(
        JSON.stringify({ error: "Evidence not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1b. Verify caller is the uploader or an admin
    const isUploader = evidence.uploaded_by === user.id;
    const { data: adminCheck } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);
    const isAdmin = (adminCheck?.length || 0) > 0;

    if (!isUploader && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: not uploader or admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Download file and compute SHA-256 hash
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("order-evidence")
      .download(evidence.storage_path);

    if (dlErr || !fileData) {
      await supabase
        .from("order_evidence")
        .update({ status: "rejected", rejection_reason: "File not found in storage" })
        .eq("id", evidence_id);
      return new Response(
        JSON.stringify({ status: "rejected", reason: "File not found in storage" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // 3. File size validation (min 10KB, max 20MB)
    const fileSizeBytes = arrayBuffer.byteLength;
    if (fileSizeBytes < 10240) {
      await supabase
        .from("order_evidence")
        .update({
          status: "rejected",
          rejection_reason: "File too small (min 10KB)",
          file_hash: fileHash,
        })
        .eq("id", evidence_id);
      return new Response(
        JSON.stringify({ status: "rejected", reason: "File too small" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (fileSizeBytes > 20 * 1024 * 1024) {
      await supabase
        .from("order_evidence")
        .update({
          status: "rejected",
          rejection_reason: "File too large (max 20MB)",
          file_hash: fileHash,
        })
        .eq("id", evidence_id);
      return new Response(
        JSON.stringify({ status: "rejected", reason: "File too large" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Deduplication check — same hash in last 30 days (different evidence record)
    const { data: dupes } = await supabase
      .from("order_evidence")
      .select("id, order_id")
      .eq("file_hash", fileHash)
      .neq("id", evidence_id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (dupes && dupes.length > 0) {
      await supabase
        .from("order_evidence")
        .update({
          status: "duplicate",
          rejection_reason: `Duplicate of evidence in order ${dupes[0].order_id}`,
          file_hash: fileHash,
        })
        .eq("id", evidence_id);
      return new Response(
        JSON.stringify({ status: "duplicate", matched_order: dupes[0].order_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Animal-type validation
    const { data: order } = await supabase
      .from("orders")
      .select("animal_type, status")
      .eq("id", order_id)
      .single();

    const animalType = order?.animal_type || "cow";

    // Get all evidence for this order to check completeness
    const { data: allEvidence } = await supabase
      .from("order_evidence")
      .select("media_type, status")
      .eq("order_id", order_id)
      .in("status", ["pending", "validated", "approved"]);

    const mediaTypes = allEvidence?.map((e) => e.media_type) || [];
    let validationWarning: string | null = null;

    if (animalType === "monkey" && evidence.media_type !== "video") {
      const hasVideo = mediaTypes.includes("video");
      if (!hasVideo) {
        validationWarning = "Monkey tasks require at least one video upload";
      }
    }

    const { data: autoApproveFlag } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("id", "auto_approve_basic_evidence")
      .maybeSingle();

    const shouldAutoApprove =
      !!autoApproveFlag?.enabled &&
      !validationWarning &&
      !!order?.status &&
      autoApprovableOrderStatuses.has(order.status) &&
      isSupportedBasicImage(fileData, evidence.storage_path, evidence.media_type);

    const nextStatus = shouldAutoApprove ? "approved" : "validated";

    // 6. Mark as validated or approved
    await supabase
      .from("order_evidence")
      .update({
        status: nextStatus,
        file_hash: fileHash,
      })
      .eq("id", evidence_id);

    return new Response(
      JSON.stringify({
        status: nextStatus,
        file_hash: fileHash,
        warning: validationWarning,
        auto_approved: shouldAutoApprove,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
