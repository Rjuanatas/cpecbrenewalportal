import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const accounts = [
      { email: "amanjuanatas@gmail.com",          password: "Admin@123", role: "admin",   firstName: "Admin",   lastName: "User" },
      { email: "officer.amanjuanatas@gmail.com",  password: "Admin@123", role: "officer", firstName: "Officer", lastName: "User" },
    ];

    const results = [];

    for (const acc of accounts) {
      // Try to find existing auth user
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find((u: { email: string }) => u.email === acc.email);

      let userId: string;

      if (existing) {
        // Reset password + confirm email
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: acc.password,
          email_confirm: true,
        });
        if (updateErr) {
          results.push({ email: acc.email, status: "update-error", error: updateErr.message });
          continue;
        }
        userId = existing.id;
        results.push({ email: acc.email, role: acc.role, status: "password-reset" });
      } else {
        // Create fresh
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { role: acc.role },
        });
        if (createErr || !created?.user) {
          results.push({ email: acc.email, status: "create-error", error: createErr?.message });
          continue;
        }
        userId = created.user.id;
        results.push({ email: acc.email, role: acc.role, status: "created" });
      }

      // Ensure profile row exists with correct role
      const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          email: acc.email,
          first_name: acc.firstName,
          last_name: acc.lastName,
          role: acc.role,
        },
        { onConflict: "id" }
      );

      if (profileErr) {
        results.push({ email: acc.email, profileStatus: "profile-error", error: profileErr.message });
      } else {
        results[results.length - 1] = { ...results[results.length - 1], profile: "ok" };
      }
    }

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
