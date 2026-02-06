import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    console.log("Authenticated user for retention alerts:", userId);

    // Verify admin/gestor role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    console.log("Starting retention alerts check...");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Calculate date ranges
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    // Fetch documents approaching destruction (within 30 days)
    const { data: retentions, error: retentionsError } = await supabase
      .from("document_retention")
      .select(`
        id,
        document_id,
        scheduled_destruction_date,
        destruction_reason,
        legal_basis,
        status,
        documents (
          id,
          title,
          entry_number,
          responsible_user_id
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_destruction_date", in30Days.toISOString().split("T")[0])
      .gte("scheduled_destruction_date", now.toISOString().split("T")[0]);

    if (retentionsError) {
      console.error("Error fetching retentions:", retentionsError);
      throw retentionsError;
    }

    console.log(`Found ${retentions?.length || 0} documents approaching destruction`);

    if (!retentions || retentions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No documents approaching destruction date",
          alertsSent: 0 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get unique responsible user IDs
    const userIds = [...new Set(
      retentions
        .filter((r: any) => r.documents?.responsible_user_id)
        .map((r: any) => r.documents!.responsible_user_id)
    )].filter(Boolean) as string[];

    // Fetch admin users to also notify them
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "gestor"]);

    const adminUserIds = adminRoles?.map((r: any) => r.user_id) || [];
    const allUserIds = [...new Set([...userIds, ...adminUserIds])];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, user_id")
      .in("user_id", allUserIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Fetch notification preferences
    const { data: notificationPrefs } = await supabase
      .from("notification_preferences")
      .select("user_id, email_retention_alerts, email_retention_urgent_only, email_digest_frequency")
      .in("user_id", allUserIds);

    const userPrefsMap = new Map(
      (notificationPrefs || []).map((p: any) => [p.user_id, p])
    );

    console.log(`Found ${profiles?.length || 0} users to notify`);

    // Group documents by urgency
    const urgent = retentions.filter((r: any) => {
      const date = new Date(r.scheduled_destruction_date);
      return date <= in7Days;
    });

    const approaching = retentions.filter((r: any) => {
      const date = new Date(r.scheduled_destruction_date);
      return date > in7Days && date <= in30Days;
    });

    let alertsSent = 0;
    const errors: string[] = [];

    for (const profile of (profiles || [])) {
      try {
        const userPrefs = userPrefsMap.get(profile.user_id);
        
        if (userPrefs?.email_retention_alerts === false) {
          console.log(`Skipping ${profile.email} - email retention alerts disabled`);
          continue;
        }
        
        if (userPrefs?.email_digest_frequency === 'never') {
          console.log(`Skipping ${profile.email} - digest frequency set to never`);
          continue;
        }

        const urgentDocs = urgent.filter((r: any) => 
          r.documents?.responsible_user_id === profile.user_id || 
          adminUserIds.includes(profile.user_id)
        );
        
        const approachingDocs = approaching.filter((r: any) => 
          r.documents?.responsible_user_id === profile.user_id || 
          adminUserIds.includes(profile.user_id)
        );

        if (urgentDocs.length === 0 && approachingDocs.length === 0) continue;
        
        if (userPrefs?.email_retention_urgent_only && urgentDocs.length === 0) continue;
        
        const docsToShowApproaching = userPrefs?.email_retention_urgent_only ? [] : approachingDocs;

        const urgentSection = urgentDocs.length > 0 ? `
          <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #DC2626; margin: 0 0 12px 0;">⚠️ Eliminação em menos de 7 dias (${urgentDocs.length} documento${urgentDocs.length > 1 ? 's' : ''})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background-color: rgba(220, 38, 38, 0.1);">
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FECACA;">Nº Entrada</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FECACA;">Título</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FECACA;">Data Eliminação</th>
              </tr></thead>
              <tbody>${urgentDocs.map((r: any) => `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.documents?.entry_number || 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.documents?.title || 'Sem título'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${new Date(r.scheduled_destruction_date).toLocaleDateString('pt-PT')}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>` : '';

        const approachingSection = docsToShowApproaching.length > 0 ? `
          <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #D97706; margin: 0 0 12px 0;">📅 Eliminação em 7-30 dias (${docsToShowApproaching.length} documento${docsToShowApproaching.length > 1 ? 's' : ''})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background-color: rgba(217, 119, 6, 0.1);">
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FDE68A;">Nº Entrada</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FDE68A;">Título</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FDE68A;">Data Eliminação</th>
              </tr></thead>
              <tbody>${docsToShowApproaching.map((r: any) => `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #FDE68A;">${r.documents?.entry_number || 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #FDE68A;">${r.documents?.title || 'Sem título'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #FDE68A;">${new Date(r.scheduled_destruction_date).toLocaleDateString('pt-PT')}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>` : '';

        const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Alerta de Eliminação</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 MINAGRIF - Alerta de Retenção</h1>
            </div>
            <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Olá <strong>${profile.full_name}</strong>,</p>
              <p>Alerta automático sobre documentos que se aproximam da data de eliminação.</p>
              ${urgentSection}${approachingSection}
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 0;">Email automático do sistema MINAGRIF.</p>
            </div>
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} MINAGRIF</p>
            </div>
          </body></html>`;

        const totalDocs = urgentDocs.length + docsToShowApproaching.length;
        const subject = urgentDocs.length > 0
          ? `⚠️ URGENTE: ${urgentDocs.length} documento(s) com eliminação próxima`
          : `📅 Alerta: ${totalDocs} documento(s) aproximam-se da data de eliminação`;

        console.log(`Sending email to ${profile.email}...`);

        const emailResponse = await resend.emails.send({
          from: "MINAGRIF <onboarding@resend.dev>",
          to: [profile.email],
          subject,
          html: emailHtml,
        });

        console.log(`Email sent to ${profile.email}:`, emailResponse);
        alertsSent++;

      } catch (emailError: any) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        errors.push(`Failed to send to ${profile.email}: ${emailError.message}`);
      }
    }

    console.log(`Retention alerts completed. Sent ${alertsSent} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsSent,
        totalDocuments: retentions.length,
        urgentCount: urgent.length,
        approachingCount: approaching.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in retention-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
