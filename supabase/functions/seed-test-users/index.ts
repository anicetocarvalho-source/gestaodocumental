import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "gestor" | "tecnico" | "consulta";

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
}

const TEST_USERS: TestUser[] = [
  { email: "gestor@nodidoc.test", password: "123456", full_name: "Gestor Teste", role: "gestor" },
  { email: "tecnico@nodidoc.test", password: "123456", full_name: "Técnico Teste", role: "tecnico" },
  { email: "consulta@nodidoc.test", password: "123456", full_name: "Consulta Teste", role: "consulta" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Utilizador não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find default organization (MINAGRIF) if exists
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .ilike("name", "MINAGRIF")
      .maybeSingle();
    const orgId: string | null = org?.id ?? null;

    const summary: { created: string[]; existed: string[]; errors: { email: string; error: string }[] } = {
      created: [],
      existed: [],
      errors: [],
    };

    for (const u of TEST_USERS) {
      try {
        // Check if user already exists by listing users (paginated lookup by email)
        const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
        const found = existing?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

        let userId: string;

        if (found) {
          summary.existed.push(u.email);
          userId = found.id;
        } else {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.full_name },
          });

          if (createErr || !created.user) {
            summary.errors.push({ email: u.email, error: createErr?.message ?? "unknown" });
            continue;
          }

          userId = created.user.id;
          summary.created.push(u.email);
          // Wait for trigger to create profile + default 'consulta' role
          await new Promise((r) => setTimeout(r, 600));
        }

        // Update profile: full_name + organization_id
        await supabaseAdmin
          .from("profiles")
          .update({
            full_name: u.full_name,
            organization_id: orgId,
          })
          .eq("user_id", userId);

        // Reset roles to the desired role only
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: u.role });

        if (roleErr) {
          summary.errors.push({ email: u.email, error: `role: ${roleErr.message}` });
        }
      } catch (e) {
        summary.errors.push({ email: u.email, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, summary, organization_id: orgId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seed-test-users error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
