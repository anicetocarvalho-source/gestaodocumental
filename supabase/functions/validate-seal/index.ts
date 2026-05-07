import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? "").trim();
    const pdfHash =
      typeof body?.pdf_hash === "string" ? body.pdf_hash.toLowerCase() : null;

    if (!UUID_RE.test(token)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Token inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: seal, error } = await supabase
      .from("physical_seals")
      .select(
        "id, protocol_number, protocol_type, document_title, subject, sender_name, recipient_name, pdf_hash, status, created_at, organization_id",
      )
      .eq("validation_token", token)
      .maybeSingle();

    if (error) throw error;

    // Best-effort log
    const ipHeader =
      req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null;
    const ip = ipHeader ? ipHeader.split(",")[0].trim() : null;
    const ua = req.headers.get("user-agent") ?? null;

    let pdfHashMatch: boolean | null = null;
    if (seal && pdfHash !== null) {
      pdfHashMatch = !!seal.pdf_hash && seal.pdf_hash.toLowerCase() === pdfHash;
    }

    await supabase.from("seal_validation_log").insert({
      seal_id: seal?.id ?? null,
      validation_token: token,
      ip_address: ip,
      user_agent: ua,
      pdf_uploaded: pdfHash !== null,
      pdf_hash_match: pdfHashMatch,
    });

    if (!seal) {
      return new Response(
        JSON.stringify({ valid: false, error: "Selo não encontrado" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get organization name (public-safe info)
    let orgName: string | null = null;
    if (seal.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", seal.organization_id)
        .maybeSingle();
      orgName = (org as any)?.name ?? null;
    }

    return new Response(
      JSON.stringify({
        valid: seal.status === "active",
        status: seal.status,
        seal: {
          protocol_number: seal.protocol_number,
          protocol_type: seal.protocol_type,
          document_title: seal.document_title,
          subject: seal.subject,
          sender_name: seal.sender_name,
          recipient_name: seal.recipient_name,
          created_at: seal.created_at,
          has_pdf_hash: !!seal.pdf_hash,
          organization_name: orgName,
        },
        pdf_hash_match: pdfHashMatch,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ valid: false, error: e?.message ?? "Erro" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
