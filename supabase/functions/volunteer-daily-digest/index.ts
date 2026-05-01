import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check feature flag
    const { data: flag } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("id", "daily_volunteer_digest")
      .single();

    if (!flag?.enabled) {
      return new Response(
        JSON.stringify({ error: "Daily volunteer digest is currently disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all volunteers
    const { data: volunteerRoles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "volunteer");
    if (rolesErr) throw rolesErr;
    if (!volunteerRoles || volunteerRoles.length === 0) {
      return new Response(JSON.stringify({ message: "No volunteers found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const volunteerIds = volunteerRoles.map((r: any) => r.user_id);
    const today = new Date().toISOString().slice(0, 10);
    let emailsSent = 0;

    for (const volunteerId of volunteerIds) {
      // Get profile with email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, is_available")
        .eq("id", volunteerId)
        .single();

      if (!profile?.email || !(profile as any).is_available) continue;

      // Get pending orders
      const { data: pendingOrders } = await supabase
        .from("orders")
        .select("id, donor_name, total_amount, created_at")
        .eq("assigned_volunteer", volunteerId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      // Get today's visits
      const { data: todayVisits } = await supabase
        .from("visit_bookings")
        .select("id, visitor_name, time_slot, visitor_phone, gaushalas_list(name, city)")
        .eq("assigned_volunteer", volunteerId)
        .eq("visit_date", today)
        .order("time_slot", { ascending: true });

      const orderCount = pendingOrders?.length || 0;
      const visitCount = todayVisits?.length || 0;

      if (orderCount === 0 && visitCount === 0) continue;

      // Build email HTML
      const overdueOrders = (pendingOrders || []).filter((o: any) => {
        const diffHours = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
        return diffHours > 48;
      });

      const html = buildDigestEmail({
        volunteerName: profile.full_name || "Volunteer",
        pendingOrders: pendingOrders || [],
        todayVisits: todayVisits || [],
        overdueOrders,
        date: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Dhyan Foundation <noreply@dhyanfoundation.com>",
          to: [profile.email],
          subject: `🌅 Your tasks for today — ${orderCount} orders, ${visitCount} visits`,
          html,
        }),
      });

      if (res.ok) emailsSent++;
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildDigestEmail(data: {
  volunteerName: string;
  pendingOrders: any[];
  todayVisits: any[];
  overdueOrders: any[];
  date: string;
}) {
  const orderRows = data.pendingOrders
    .map(
      (o: any) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe4;font-size:14px;color:#1a1a1a">${o.donor_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe4;font-size:14px;color:#b45309;font-weight:600;text-align:right">₹${Number(o.total_amount).toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  const visitRows = data.todayVisits
    .map(
      (v: any) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe4;font-size:14px;color:#1a1a1a">${v.visitor_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe4;font-size:14px;color:#666">${v.time_slot}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe4;font-size:14px;color:#666">${v.visitor_phone}</td>
        </tr>`
    )
    .join("");

  const overdueAlert =
    data.overdueOrders.length > 0
      ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#dc2626;font-weight:600">⚠️ ${data.overdueOrders.length} order(s) pending for over 48 hours</p>
          <p style="margin:4px 0 0;font-size:12px;color:#666">Please prioritize these for fulfillment today.</p>
        </div>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:'Georgia',serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:30px;background:#faf8f5">
  <div style="text-align:center;border-bottom:3px solid #b45309;padding-bottom:16px;margin-bottom:24px">
    <h1 style="font-size:24px;color:#b45309;margin:0">Dhyan Foundation</h1>
    <p style="font-size:12px;color:#888;margin:4px 0">Daily Volunteer Digest</p>
  </div>

  <p style="font-size:16px;margin-bottom:4px">🙏 Jai Gurudev, <strong>${data.volunteerName}</strong></p>
  <p style="font-size:13px;color:#888;margin-bottom:20px">${data.date}</p>

  ${overdueAlert}

  ${
    data.pendingOrders.length > 0
      ? `<h2 style="font-size:15px;color:#b45309;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">📦 Pending Orders (${data.pendingOrders.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fff;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#fdf6ee">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600">Donor</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888;font-weight:600">Amount</th>
          </tr></thead>
          <tbody>${orderRows}</tbody>
        </table>`
      : ""
  }

  ${
    data.todayVisits.length > 0
      ? `<h2 style="font-size:15px;color:#b45309;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">🏛️ Today's Visits (${data.todayVisits.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fff;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#fdf6ee">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600">Visitor</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600">Time</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600">Phone</th>
          </tr></thead>
          <tbody>${visitRows}</tbody>
        </table>`
      : ""
  }

  <div style="text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #eee">
    <p style="font-size:11px;color:#999">This is an automated daily digest from Dhyan Foundation.<br/>You're receiving this because you're an active volunteer.</p>
  </div>
</body></html>`;
}
