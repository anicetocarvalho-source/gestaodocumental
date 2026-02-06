import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth validation — require admin or gestor role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user for SLA check:", userId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin/gestor role
    const { data: hasAdminRole } = await supabase.rpc("has_any_role", {
      _user_id: userId,
      _roles: ["admin", "gestor"],
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores ou gestores podem executar esta acção" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting SLA alerts check...");

    const now = new Date();
    const in24Hours = new Date(now);
    in24Hours.setHours(in24Hours.getHours() + 24);

    // Check processes approaching SLA deadline
    const { data: processes, error: processError } = await supabase
      .from("processes")
      .select(`
        id,
        process_number,
        subject,
        status,
        deadline,
        current_unit_id,
        responsible_user_id,
        created_by,
        organizational_units!processes_current_unit_id_fkey (
          name
        )
      `)
      .not("status", "in", '("concluido","arquivado")')
      .not("deadline", "is", null)
      .lte("deadline", in24Hours.toISOString());

    if (processError) {
      console.error("Error fetching processes:", processError);
      throw processError;
    }

    console.log(`Found ${processes?.length || 0} processes with SLA alerts`);

    // Check dispatches approaching SLA deadline
    const { data: dispatches, error: dispatchError } = await supabase
      .from("dispatches")
      .select(`
        id,
        dispatch_number,
        subject,
        status,
        deadline,
        created_by,
        origin_unit_id
      `)
      .not("status", "in", '("concluido","cancelado")')
      .not("deadline", "is", null)
      .lte("deadline", in24Hours.toISOString());

    if (dispatchError) {
      console.error("Error fetching dispatches:", dispatchError);
      throw dispatchError;
    }

    console.log(`Found ${dispatches?.length || 0} dispatches with SLA alerts`);

    let alertsSent = 0;
    const errors: string[] = [];

    for (const process of (processes || [])) {
      try {
        const hoursRemaining = Math.round(
          (new Date(process.deadline).getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        const usersToNotify = new Set<string>();
        if (process.responsible_user_id) usersToNotify.add(process.responsible_user_id);
        if (process.created_by) usersToNotify.add(process.created_by);

        if (process.current_unit_id) {
          const { data: unitUsers } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("unit_id", process.current_unit_id)
            .eq("is_active", true);
          unitUsers?.forEach(u => usersToNotify.add(u.user_id));
        }

        const { data: adminUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "gestor"]);
        adminUsers?.forEach(u => usersToNotify.add(u.user_id));

        for (const uid of usersToNotify) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, user_id")
            .eq("user_id", uid)
            .single();
          if (!profile) continue;

          const { data: prefs } = await supabase
            .from("notification_preferences")
            .select("email_sla_alerts")
            .eq("user_id", uid)
            .single();
          if (prefs?.email_sla_alerts === false) continue;

          const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              type: 'sla_alert',
              recipientUserId: uid,
              data: {
                recipientName: profile.full_name,
                itemType: 'Processo',
                itemNumber: process.process_number,
                subject: process.subject,
                hoursRemaining,
                deadline: new Date(process.deadline).toLocaleDateString('pt-PT', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }),
                referenceType: 'process',
                referenceId: process.id
              }
            })
          });

          if (response.ok) alertsSent++;
          else {
            const error = await response.text();
            errors.push(`Failed SLA alert for process ${process.process_number} to ${profile.email}: ${error}`);
          }
        }
      } catch (error: any) {
        errors.push(`Error SLA alert for process ${process.process_number}: ${error.message}`);
      }
    }

    for (const dispatch of (dispatches || [])) {
      try {
        const hoursRemaining = Math.round(
          (new Date(dispatch.deadline).getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        const usersToNotify = new Set<string>();
        if (dispatch.created_by) usersToNotify.add(dispatch.created_by);

        const { data: adminUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "gestor"]);
        adminUsers?.forEach(u => usersToNotify.add(u.user_id));

        for (const uid of usersToNotify) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, user_id")
            .eq("user_id", uid)
            .single();
          if (!profile) continue;

          const { data: prefs } = await supabase
            .from("notification_preferences")
            .select("email_sla_alerts")
            .eq("user_id", uid)
            .single();
          if (prefs?.email_sla_alerts === false) continue;

          const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              type: 'sla_alert',
              recipientUserId: uid,
              data: {
                recipientName: profile.full_name,
                itemType: 'Despacho',
                itemNumber: dispatch.dispatch_number,
                subject: dispatch.subject,
                hoursRemaining,
                deadline: new Date(dispatch.deadline).toLocaleDateString('pt-PT', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }),
                referenceType: 'dispatch',
                referenceId: dispatch.id
              }
            })
          });

          if (response.ok) alertsSent++;
        }
      } catch (error: any) {
        errors.push(`Error SLA alert for dispatch ${dispatch.dispatch_number}: ${error.message}`);
      }
    }

    console.log(`SLA check completed. Sent ${alertsSent} alerts.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsSent,
        processesChecked: processes?.length || 0,
        dispatchesChecked: dispatches?.length || 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-sla-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
