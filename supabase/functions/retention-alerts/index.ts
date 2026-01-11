import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting retention alerts check...");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Fetch notification preferences for all users
    const { data: notificationPrefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, email_retention_alerts, email_retention_urgent_only, email_digest_frequency")
      .in("user_id", allUserIds);

    if (prefsError) {
      console.error("Error fetching notification preferences:", prefsError);
      // Continue anyway, default to sending emails
    }

    // Create a map of user preferences
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

    // Send email to each user
    let alertsSent = 0;
    const errors: string[] = [];

    for (const profile of (profiles || [])) {
      try {
        // Check user's notification preferences
        const userPrefs = userPrefsMap.get(profile.user_id);
        
        // Skip if user has disabled email retention alerts
        if (userPrefs?.email_retention_alerts === false) {
          console.log(`Skipping ${profile.email} - email retention alerts disabled`);
          continue;
        }
        
        // Skip if frequency is set to 'never'
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

        if (urgentDocs.length === 0 && approachingDocs.length === 0) {
          continue;
        }
        
        // If user only wants urgent alerts, skip if no urgent docs
        if (userPrefs?.email_retention_urgent_only && urgentDocs.length === 0) {
          console.log(`Skipping ${profile.email} - only urgent alerts enabled and no urgent docs`);
          continue;
        }
        
        // If user only wants urgent alerts, don't include approaching docs
        const docsToShowApproaching = userPrefs?.email_retention_urgent_only ? [] : approachingDocs;

        const urgentSection = urgentDocs.length > 0 ? `
          <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #DC2626; margin: 0 0 12px 0;">⚠️ Eliminação em menos de 7 dias (${urgentDocs.length} documento${urgentDocs.length > 1 ? 's' : ''})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: rgba(220, 38, 38, 0.1);">
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FECACA;">Nº Entrada</th>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FECACA;">Título</th>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FECACA;">Data Eliminação</th>
                </tr>
              </thead>
              <tbody>
                ${urgentDocs.map((r: any) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.documents?.entry_number || 'N/A'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.documents?.title || 'Sem título'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${new Date(r.scheduled_destruction_date).toLocaleDateString('pt-PT')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '';

        const approachingSection = docsToShowApproaching.length > 0 ? `
          <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #D97706; margin: 0 0 12px 0;">📅 Eliminação em 7-30 dias (${docsToShowApproaching.length} documento${docsToShowApproaching.length > 1 ? 's' : ''})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: rgba(217, 119, 6, 0.1);">
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FDE68A;">Nº Entrada</th>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FDE68A;">Título</th>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #FDE68A;">Data Eliminação</th>
                </tr>
              </thead>
              <tbody>
                ${docsToShowApproaching.map((r: any) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #FDE68A;">${r.documents?.entry_number || 'N/A'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #FDE68A;">${r.documents?.title || 'Sem título'}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #FDE68A;">${new Date(r.scheduled_destruction_date).toLocaleDateString('pt-PT')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Alerta de Eliminação de Documentos</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 MINAGRIF - Alerta de Retenção</h1>
            </div>
            
            <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="margin-top: 0;">Olá <strong>${profile.full_name}</strong>,</p>
              
              <p>Este é um alerta automático sobre documentos que se aproximam da data de eliminação programada.</p>
              
              ${urgentSection}
              ${approachingSection}
              
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1E40AF;">
                  <strong>Ação necessária:</strong> Por favor, reveja estes documentos e tome as ações apropriadas antes da data de eliminação.
                </p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 0;">
                Este é um email automático do sistema MINAGRIF. Por favor, não responda a este email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} MINAGRIF - Sistema de Gestão Documental</p>
            </div>
          </body>
          </html>
        `;

        const totalDocs = urgentDocs.length + docsToShowApproaching.length;
        const subject = urgentDocs.length > 0
          ? `⚠️ URGENTE: ${urgentDocs.length} documento(s) com eliminação próxima`
          : `📅 Alerta: ${totalDocs} documento(s) aproximam-se da data de eliminação`;

        console.log(`Sending email to ${profile.email}...`);

        const emailResponse = await resend.emails.send({
          from: "MINAGRIF <onboarding@resend.dev>",
          to: [profile.email],
          subject: subject,
          html: emailHtml,
        });

        console.log(`Email sent to ${profile.email}:`, emailResponse);
        alertsSent++;

      } catch (emailError: any) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        errors.push(`Failed to send to ${profile.email}: ${emailError.message}`);
      }
    }

    // Log the alert activity
    console.log(`Retention alerts completed. Sent ${alertsSent} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Retention alerts sent successfully`,
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
