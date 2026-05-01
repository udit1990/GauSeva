import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  let words = "";
  if (Math.floor(num / 10000000) > 0) { words += numberToWords(Math.floor(num / 10000000)) + " Crore "; num %= 10000000; }
  if (Math.floor(num / 100000) > 0) { words += numberToWords(Math.floor(num / 100000)) + " Lakh "; num %= 100000; }
  if (Math.floor(num / 1000) > 0) { words += numberToWords(Math.floor(num / 1000)) + " Thousand "; num %= 1000; }
  if (Math.floor(num / 100) > 0) { words += ones[Math.floor(num / 100)] + " Hundred "; num %= 100; }
  if (num > 0) {
    if (words !== "") words += "and ";
    if (num < 20) { words += ones[num]; } else { words += tens[Math.floor(num / 10)]; if (num % 10 > 0) words += "-" + ones[num % 10]; }
  }
  return words.trim();
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = "Rupees " + numberToWords(rupees);
  if (paise > 0) result += " and " + numberToWords(paise) + " Paise";
  return result + " Only";
}

function generateReceiptHTML(data: { receiptNumber: string; date: string; donorName: string; donorEmail?: string; donorPan?: string; amount: number; orderId: string }) {
  return `<!DOCTYPE html><html><head><style>
  body{font-family:'Georgia',serif;color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px}
  .header{text-align:center;border-bottom:3px solid #b45309;padding-bottom:20px;margin-bottom:30px}
  .header h1{font-size:28px;color:#b45309;margin:0}.header p{font-size:12px;color:#666;margin:5px 0}
  .receipt-title{text-align:center;font-size:18px;font-weight:bold;margin:20px 0;text-transform:uppercase;letter-spacing:2px}
  .section-80g{text-align:center;font-size:11px;color:#b45309;margin-bottom:20px;font-weight:bold}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  td{padding:10px 15px;font-size:14px;border-bottom:1px solid #eee}td:first-child{font-weight:bold;color:#444;width:40%}
  .amount-row td{font-size:18px;color:#b45309;font-weight:bold;border-bottom:2px solid #b45309}
  .amount-words{font-style:italic;font-size:13px;color:#666;padding:10px 15px}
  .footer{margin-top:60px;display:flex;justify-content:flex-end}.stamp{text-align:center}
  .stamp p{font-size:11px;color:#888;margin:5px 0}.stamp .line{width:180px;border-top:1px solid #999;margin:0 auto}
  .legal{text-align:center;font-size:10px;color:#999;margin-top:40px;border-top:1px solid #eee;padding-top:15px}
  </style></head><body>
  <div class="header"><h1>Dhyan Foundation</h1><p>Registered Charitable Trust</p><p>PAN: AAATD4460P | 80G Registration: AAATD4460PF2021A01</p></div>
  <div class="receipt-title">Donation Receipt</div>
  <div class="section-80g">Tax Exemption under Section 80G of the Income Tax Act, 1961</div>
  <table>
    <tr><td>Receipt No.</td><td>${data.receiptNumber}</td></tr>
    <tr><td>Date</td><td>${data.date}</td></tr>
    <tr><td>Donor Name</td><td>${data.donorName}</td></tr>
    ${data.donorEmail ? `<tr><td>Email</td><td>${data.donorEmail}</td></tr>` : ""}
    ${data.donorPan ? `<tr><td>PAN</td><td>${data.donorPan.toUpperCase()}</td></tr>` : ""}
    <tr class="amount-row"><td>Amount (₹)</td><td>₹${data.amount.toLocaleString("en-IN")}</td></tr>
  </table>
  <div class="amount-words">${amountInWords(data.amount)}</div>
  <div class="footer"><div class="stamp"><div class="line"></div><p>Authorized Signatory</p><p>Dhyan Foundation</p></div></div>
  <div class="legal">This receipt is issued for the purpose of claiming tax exemption under Section 80G of the Income Tax Act, 1961.<br/>Order Reference: ${data.orderId.slice(0, 8).toUpperCase()}</div>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin access required");

    // Check feature flag
    const { data: flag } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("id", "email_receipts")
      .single();

    if (!flag?.enabled) {
      return new Response(
        JSON.stringify({ error: "Email receipts are currently disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { certificate_id } = await req.json();
    if (!certificate_id) throw new Error("certificate_id required");

    const { data: cert, error: certErr } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificate_id)
      .single();
    if (certErr || !cert) throw new Error("Certificate not found");
    if (!cert.donor_email) throw new Error("No donor email on this certificate");

    const html = generateReceiptHTML({
      receiptNumber: cert.certificate_number,
      date: new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      donorName: cert.donor_name,
      donorEmail: cert.donor_email,
      donorPan: cert.donor_pan || undefined,
      amount: Number(cert.amount),
      orderId: cert.order_id,
    });

    const subject = cert.certificate_type === "80g"
      ? `Your 80G Tax Receipt – ${cert.certificate_number}`
      : `Your Donation Certificate – ${cert.certificate_number}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Dhyan Foundation <noreply@dhyanfoundation.com>",
        to: [cert.donor_email],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    await supabase.from("certificates").update({ emailed_at: new Date().toISOString() }).eq("id", certificate_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
