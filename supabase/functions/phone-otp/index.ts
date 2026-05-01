import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Helper: find the canonical user for a phone number, preferring users with roles
    // Optimized: queries profiles table instead of listing ALL auth users
    const findUserByPhone = async (phone: string, authEmail: string) => {
      // 1. Try profiles table first (indexed, fast)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phone);

      const candidateIds = profiles?.map((p) => p.id) || [];

      // 2. If no profile match, try direct lookup by auth email (fast, no listUsers)
      if (candidateIds.length === 0) {
        try {
          const { data: { users } } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 5,
          });
          const match = users?.find(
            (u) => u.phone === phone || u.email === authEmail
          );
          if (match) candidateIds.push(match.id);
        } catch { /* ignore */ }
      }

      // Deduplicate
      const uniqueIds = [...new Set(candidateIds)];

      if (uniqueIds.length === 0) return null;

      if (uniqueIds.length === 1) {
        const { data: { user } } = await supabase.auth.admin.getUserById(uniqueIds[0]);
        return user;
      }

      // Multiple matches — prefer the one with roles assigned
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("user_id", uniqueIds);

      const usersWithRoles = new Set(rolesData?.map((r) => r.user_id) || []);
      const preferredId = uniqueIds.find((id) => usersWithRoles.has(id)) || uniqueIds[0];
      const { data: { user } } = await supabase.auth.admin.getUserById(preferredId);
      return user;
    };

    const { action, phone, code, purpose, password, full_name, email } = await req.json();

    // --- SEND OTP ---
    if (action === "send_otp") {
      if (!phone || !purpose) {
        return new Response(JSON.stringify({ error: "phone and purpose required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", phone)
        .eq("purpose", purpose);

      const otpCode = "123456";

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error } = await supabase.from("otp_codes").insert({
        phone,
        code: otpCode,
        purpose,
        expires_at: expiresAt,
      });

      if (error) throw error;

      console.log(`[MOCK OTP] Code for ${phone}: ${otpCode}`);

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent (dev: 123456)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- PASSWORD LOGIN ---
    if (action === "password_login") {
      if (!phone || !password) {
        return new Response(JSON.stringify({ error: "phone and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authEmail = `${phone.replace(/\+/g, "")}@otp.local`;

      // Find the canonical user (prefers one with roles)
      const canonicalUser = await findUserByPhone(phone, authEmail);
      console.log(`[password_login] phone=${phone}, authEmail=${authEmail}, canonicalUser=${canonicalUser?.id}, canonicalEmail=${canonicalUser?.email}`);

      if (!canonicalUser) {
        return new Response(JSON.stringify({ error: "No account found for this phone number" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use the canonical user's email for sign-in
      const signInEmail = canonicalUser.email || authEmail;

      // Try user-provided password first
      const { data: session, error: sessErr } =
        await supabase.auth.signInWithPassword({
          email: signInEmail,
          password: password,
        });

      if (!sessErr) {
        return new Response(
          JSON.stringify({ success: true, session: session.session, user: session.user }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[password_login] direct login failed: ${sessErr.message}, trying with canonical email`);

      // If the canonical user's email differs from authEmail, also try authEmail
      if (signInEmail !== authEmail) {
        const { data: session2, error: sessErr2 } =
          await supabase.auth.signInWithPassword({
            email: authEmail,
            password: password,
          });

        if (!sessErr2) {
          return new Response(
            JSON.stringify({ success: true, session: session2.session, user: session2.user }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log(`[password_login] fallback login also failed: ${sessErr2.message}`);
      }

      return new Response(JSON.stringify({ error: "Invalid phone number or password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- VERIFY OTP & LOGIN/SIGNUP ---
    if (action === "verify_otp") {
      if (!phone || !code || !purpose) {
        return new Response(JSON.stringify({ error: "phone, code, and purpose required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: otpRecords } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", phone)
        .eq("code", code)
        .eq("purpose", purpose)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!otpRecords || otpRecords.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("otp_codes")
        .update({ verified: true })
        .eq("id", otpRecords[0].id);

      if (purpose === "login" || purpose === "signup") {
        const authEmail = `${phone.replace(/\+/g, "")}@otp.local`;
        // Use a default internal password for OTP-created accounts; users can set their own via signup
        const defaultPassword = `otp_${phone}_${serviceRoleKey.slice(0, 8)}`;

        const existingUser = await findUserByPhone(phone, authEmail);

        if (existingUser) {
          const { data: session, error: sessErr } =
            await supabase.auth.signInWithPassword({
              email: authEmail,
              password: defaultPassword,
            });

          if (sessErr) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              password: defaultPassword,
            });
            const { data: retrySession, error: retryErr } =
              await supabase.auth.signInWithPassword({
                email: authEmail,
                password: defaultPassword,
              });
            if (retryErr) throw retryErr;
            return new Response(
              JSON.stringify({ success: true, session: retrySession.session, user: retrySession.user }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, session: session.session, user: session.user }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const { data: newUser, error: createErr } =
            await supabase.auth.admin.createUser({
              email: authEmail,
              password: defaultPassword,
              phone: phone,
              email_confirm: true,
              phone_confirm: true,
              user_metadata: {
                full_name: full_name || "",
                phone: phone,
              },
            });

          if (createErr) throw createErr;

          if (email) {
            await supabase
              .from("profiles")
              .update({ email, phone, full_name: full_name || "" })
              .eq("id", newUser.user.id);
          } else {
            await supabase
              .from("profiles")
              .update({ phone, full_name: full_name || "" })
              .eq("id", newUser.user.id);
          }

          const { data: session, error: sessErr } =
            await supabase.auth.signInWithPassword({
              email: authEmail,
              password: defaultPassword,
            });

          if (sessErr) throw sessErr;

          return new Response(
            JSON.stringify({ success: true, session: session.session, user: session.user, isNew: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      if (purpose === "reset") {
        return new Response(
          JSON.stringify({ success: true, verified: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- RESET PASSWORD ---
    if (action === "reset_password") {
      if (!phone || !password) {
        return new Response(JSON.stringify({ error: "phone and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authEmail = `${phone.replace(/\+/g, "")}@otp.local`;
      const user = await findUserByPhone(phone, authEmail);

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Set the user-chosen password
      await supabase.auth.admin.updateUserById(user.id, {
        password: password,
      });

      const { data: session, error: sessErr } =
        await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password,
        });

      if (sessErr) throw sessErr;

      return new Response(
        JSON.stringify({ success: true, session: session.session, user: session.user }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- SET PASSWORD (for new users after OTP signup) ---
    if (action === "set_password") {
      if (!phone || !password) {
        return new Response(JSON.stringify({ error: "phone and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authEmail = `${phone.replace(/\+/g, "")}@otp.local`;
      const user = await findUserByPhone(phone, authEmail);

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.auth.admin.updateUserById(user.id, {
        password: password,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});