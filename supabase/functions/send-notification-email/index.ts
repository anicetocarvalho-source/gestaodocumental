import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: 'pending_approval' | 'sla_alert' | 'movement' | 'dispatch_update' | 'process_update';
  recipientUserId?: string;
  recipientEmail?: string;
  data: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any>): { subject: string; html: string } => {
  const baseStyles = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333;`;
  const headerStyle = `background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%); padding: 24px; border-radius: 8px 8px 0 0;`;
  const contentStyle = `background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;`;

  switch (type) {
    case 'pending_approval':
      return {
        subject: `🔔 Aprovação Pendente: ${data.itemType === 'dispatch' ? 'Despacho' : 'Processo'} ${data.itemNumber}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="${headerStyle}"><h1 style="color: white; margin: 0; font-size: 24px;">🔔 Aprovação Pendente</h1></div>
            <div style="${contentStyle}">
              <p>Olá <strong>${data.recipientName}</strong>,</p>
              <p>Tem um ${data.itemType === 'dispatch' ? 'despacho' : 'processo'} a aguardar a sua aprovação:</p>
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0;"><strong>Número:</strong> ${data.itemNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Assunto:</strong> ${data.subject}</p>
                <p style="margin: 0 0 8px 0;"><strong>Solicitante:</strong> ${data.requesterName}</p>
                <p style="margin: 0 0 8px 0;"><strong>Prioridade:</strong> ${data.priority}</p>
                ${data.deadline ? `<p style="margin: 0;"><strong>Prazo:</strong> ${data.deadline}</p>` : ''}
              </div>
              <p style="color: #6B7280; font-size: 14px;">Email automático do sistema NODIXDOC.</p>
            </div>
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;"><p>© ${new Date().getFullYear()} NODIXDOC</p></div>
          </body></html>`
      };

    case 'sla_alert': {
      const isOverdue = data.hoursRemaining <= 0;
      const urgencyColor = isOverdue ? '#DC2626' : data.hoursRemaining <= 24 ? '#D97706' : '#3B82F6';
      const urgencyBg = isOverdue ? '#FEE2E2' : data.hoursRemaining <= 24 ? '#FEF3C7' : '#EFF6FF';
      return {
        subject: isOverdue ? `⚠️ SLA VENCIDO: ${data.itemType} ${data.itemNumber}` : `⏰ Alerta SLA: ${data.itemType} ${data.itemNumber}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${urgencyColor}; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${isOverdue ? '⚠️ SLA VENCIDO' : '⏰ Alerta de SLA'}</h1>
            </div>
            <div style="${contentStyle}">
              <p>Olá <strong>${data.recipientName}</strong>,</p>
              <div style="background-color: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: ${urgencyColor}; font-weight: bold;">${isOverdue ? `Prazo ultrapassado há ${Math.abs(data.hoursRemaining)} horas!` : `Restam ${data.hoursRemaining} horas!`}</p>
                <p style="margin: 0 0 8px 0;"><strong>Tipo:</strong> ${data.itemType}</p>
                <p style="margin: 0 0 8px 0;"><strong>Número:</strong> ${data.itemNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Assunto:</strong> ${data.subject}</p>
                <p style="margin: 0;"><strong>Prazo:</strong> ${data.deadline}</p>
              </div>
              <p style="color: #6B7280; font-size: 14px;">Email automático do sistema NODIXDOC.</p>
            </div>
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;"><p>© ${new Date().getFullYear()} NODIXDOC</p></div>
          </body></html>`
      };
    }

    case 'movement': {
      const actionLabels: Record<string, string> = { 'despacho': 'Despacho', 'encaminhamento': 'Encaminhamento', 'recebimento': 'Recebimento', 'devolucao': 'Devolução', 'arquivamento': 'Arquivamento' };
      return {
        subject: `📄 ${actionLabels[data.actionType] || data.actionType}: ${data.documentNumber}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="${headerStyle}"><h1 style="color: white; margin: 0; font-size: 24px;">📄 Movimentação de Documento</h1></div>
            <div style="${contentStyle}">
              <p>Olá <strong>${data.recipientName}</strong>,</p>
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0;"><strong>Acção:</strong> ${actionLabels[data.actionType] || data.actionType}</p>
                <p style="margin: 0 0 8px 0;"><strong>Documento:</strong> ${data.documentNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Título:</strong> ${data.documentTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>De:</strong> ${data.fromUnit}</p>
                <p style="margin: 0 0 8px 0;"><strong>Para:</strong> ${data.toUnit}</p>
                ${data.observations ? `<p style="margin: 0;"><strong>Observações:</strong> ${data.observations}</p>` : ''}
              </div>
              <p style="color: #6B7280; font-size: 14px;">Email automático do sistema NODIXDOC.</p>
            </div>
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;"><p>© ${new Date().getFullYear()} NODIXDOC</p></div>
          </body></html>`
      };
    }

    case 'dispatch_update': {
      const statusLabels: Record<string, string> = { 'aprovado': 'Aprovado ✅', 'rejeitado': 'Rejeitado ❌', 'devolvido': 'Devolvido 🔄', 'assinado': 'Assinado ✍️', 'enviado': 'Enviado 📤' };
      const statusColors: Record<string, string> = { 'aprovado': '#059669', 'rejeitado': '#DC2626', 'devolvido': '#D97706', 'assinado': '#7C3AED', 'enviado': '#3B82F6' };
      return {
        subject: `📋 Despacho ${statusLabels[data.status] || data.status}: ${data.dispatchNumber}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${statusColors[data.status] || '#1E3A5F'}; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 Actualização de Despacho</h1>
            </div>
            <div style="${contentStyle}">
              <p>Olá <strong>${data.recipientName}</strong>,</p>
              <div style="background-color: #F3F4F6; border-left: 4px solid ${statusColors[data.status] || '#1E3A5F'}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: ${statusColors[data.status] || '#1E3A5F'};">Estado: ${statusLabels[data.status] || data.status}</p>
                <p style="margin: 0 0 8px 0;"><strong>Número:</strong> ${data.dispatchNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Assunto:</strong> ${data.subject}</p>
                ${data.approverName ? `<p style="margin: 0 0 8px 0;"><strong>Por:</strong> ${data.approverName}</p>` : ''}
                ${data.comments ? `<p style="margin: 0;"><strong>Comentários:</strong> ${data.comments}</p>` : ''}
              </div>
              <p style="color: #6B7280; font-size: 14px;">Email automático do sistema NODIXDOC.</p>
            </div>
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;"><p>© ${new Date().getFullYear()} NODIXDOC</p></div>
          </body></html>`
      };
    }

    case 'process_update':
      return {
        subject: `📂 Processo Actualizado: ${data.processNumber}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="${headerStyle}"><h1 style="color: white; margin: 0; font-size: 24px;">📂 Actualização de Processo</h1></div>
            <div style="${contentStyle}">
              <p>Olá <strong>${data.recipientName}</strong>,</p>
              <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0;"><strong>Número:</strong> ${data.processNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Assunto:</strong> ${data.subject}</p>
                <p style="margin: 0 0 8px 0;"><strong>Estado:</strong> ${data.status}</p>
                ${data.updateDescription ? `<p style="margin: 0;"><strong>Alteração:</strong> ${data.updateDescription}</p>` : ''}
              </div>
              <p style="color: #6B7280; font-size: 14px;">Email automático do sistema NODIXDOC.</p>
            </div>
            <div style="text-align: center; padding: 16px; color: #9CA3AF; font-size: 12px;"><p>© ${new Date().getFullYear()} NODIXDOC</p></div>
          </body></html>`
      };

    default:
      return { subject: 'Notificação NODIXDOC', html: `<p>Nova notificação no sistema NODIXDOC.</p>` };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth validation — accept service role or authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the token is valid (either service role or user JWT)
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;

    if (!isServiceRole) {
      const supabaseAuth = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        console.error("Auth error:", claimsError);
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Authenticated user:", claimsData.claims.sub);
    } else {
      console.log("Service role call");
    }

    console.log("Processing notification email request...");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipientUserId, recipientEmail, data }: EmailRequest = await req.json();

    console.log(`Email type: ${type}, recipientUserId: ${recipientUserId}, recipientEmail: ${recipientEmail}`);

    let email = recipientEmail;
    let recipientName = data.recipientName || 'Utilizador';
    let userAuthId = recipientUserId;

    if (recipientUserId && !recipientEmail) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name, user_id")
        .eq("user_id", recipientUserId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error(`Profile not found for user ${recipientUserId}`);
      }

      email = profile.email;
      recipientName = profile.full_name || recipientName;
      userAuthId = profile.user_id;
    }

    if (!email) {
      throw new Error("No recipient email provided");
    }

    // Check user notification preferences
    const preferenceKey = {
      'pending_approval': 'email_pending_approvals',
      'sla_alert': 'email_sla_alerts',
      'movement': 'email_movements',
      'dispatch_update': 'email_dispatch_updates',
      'process_update': 'email_movements'
    }[type];

    if (userAuthId && preferenceKey) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("email_pending_approvals, email_sla_alerts, email_movements, email_dispatch_updates")
        .eq("user_id", userAuthId)
        .single();

      const prefsRecord = prefs as Record<string, boolean> | null;
      if (prefsRecord && prefsRecord[preferenceKey] === false) {
        console.log(`User ${userAuthId} has disabled ${type} emails`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "User has disabled this notification type" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const { subject, html } = getEmailTemplate(type, { ...data, recipientName });

    console.log(`Sending email to ${email}: ${subject}`);

    const emailResponse = await resend.emails.send({
      from: "NODIXDOC <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if ((emailResponse as any).error) {
      const resendError = (emailResponse as any).error;
      console.error("Resend API error:", resendError);
      
      await supabase.from("email_logs").insert({
        recipient_email: email,
        recipient_user_id: userAuthId,
        email_type: type,
        subject,
        reference_type: data.referenceType,
        reference_id: data.referenceId,
        status: 'error',
        error_message: resendError.message || 'Unknown Resend error'
      });

      return new Response(
        JSON.stringify({ success: false, error: resendError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailResponse);

    await supabase.from("email_logs").insert({
      recipient_email: email,
      recipient_user_id: userAuthId,
      email_type: type,
      subject,
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      status: 'sent'
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", emailId: (emailResponse as any).id || 'sent' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
