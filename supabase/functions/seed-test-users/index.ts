import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "admin@test.com", password: "Admin@123", fullName: "Test Admin", role: "admin" },
  { email: "volunteer@test.com", password: "Volunteer@123", fullName: "Test Volunteer", role: "volunteer" },
  { email: "user@test.com", password: "User@123", fullName: "Test User", role: "user" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = [];

    for (const u of TEST_USERS) {
      // Create user (or get existing)
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName },
        });

      if (authError && !authError.message.includes("already been registered")) {
        results.push({ email: u.email, error: authError.message });
        continue;
      }

      let userId = authData?.user?.id;

      // If user already exists, look up their id
      if (!userId) {
        const { data: listData } =
          await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((x: any) => x.email === u.email);
        userId = existing?.id;
      }

      if (!userId) {
        results.push({ email: u.email, error: "Could not resolve user id" });
        continue;
      }

      // Ensure profile exists
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        full_name: u.fullName,
        email: u.email,
      });

      // Assign role
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: userId, role: u.role },
        { onConflict: "user_id,role" }
      );

      results.push({ email: u.email, role: u.role, userId, status: "ok" });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
