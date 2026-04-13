import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      org_name,
      org_code,
      domain,
      contact_email,
      contact_phone,
      plan,
      admin_email,
      admin_password,
      admin_full_name,
    } = body;

    if (!org_name || !org_code || !admin_email || !admin_password || !admin_full_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: org_name, org_code, admin_email, admin_password, admin_full_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: org_name,
        code: org_code,
        domain: domain || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        plan: plan || "standard",
      })
      .select()
      .single();

    if (orgError) {
      return new Response(JSON.stringify({ error: "Failed to create organization: " + orgError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create admin user
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_full_name },
    });

    if (userError) {
      // Rollback org
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      return new Response(JSON.stringify({ error: "Failed to create user: " + userError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update profile with organization_id
    await supabaseAdmin
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("user_id", newUser.user.id);

    // 4. Assign admin role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newUser.user.id, role: "admin" }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({
        organization: org,
        admin_user: { id: newUser.user.id, email: admin_email },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
