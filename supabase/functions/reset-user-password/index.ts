import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create regular client to verify caller is admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Get the calling user
    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: "Utilizador não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem redefinir passwords" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ResetPasswordRequest = await req.json();
    const { user_id, new_password } = body;

    // Validate required fields
    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "ID do utilizador e nova password são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "A password deve ter pelo menos 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from resetting their own password through this endpoint
    if (user_id === caller.id) {
      return new Response(
        JSON.stringify({ error: "Utilize as definições pessoais para alterar a sua própria password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password reset for user ${user_id} by admin ${caller.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password redefinida com sucesso"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
