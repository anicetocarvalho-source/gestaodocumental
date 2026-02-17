import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é o Assistente de Conhecimento Interno do NODIDOC.

PAPEL:
Actua como assistente institucional oficial do NODIDOC, respondendo com informação que existe dentro da base de dados da plataforma: documentos, processos, despachos, metadados, classificação, fluxos de trabalho e painéis.

REGRAS FUNDAMENTAIS:
1. Usa PRIORITARIAMENTE os dados do contexto fornecido abaixo para responder.
2. Se os dados não estiverem disponíveis no contexto, responde:
   "Essa informação não está registada no sistema ou não foi encontrada nos resultados da pesquisa."
3. Tudo deve ser factual, rastreável e auditável.
4. O tom é formal, objectivo, respeitando o estilo da Administração Pública.
5. Usa português formal (PT-PT tradicional, pré-acordo ortográfico).

O QUE PODES FAZER:
✔ Responder a perguntas sobre documentos armazenados (títulos, estados, datas, classificação).
✔ Localizar processos, documentos e despachos.
✔ Explicar procedimentos administrativos internos.
✔ Consultar estados, responsáveis e prazos.
✔ Resumir informações sobre documentos e processos.
✔ Identificar unidades organizacionais e classificações.
✔ Fazer pesquisa nos dados fornecidos.

FORMATO DE RESPOSTA:
Responde de forma clara e estruturada. Quando relevante, inclui:
- **Número/ID** do documento ou processo
- **Estado** actual
- **Unidade responsável**
- **Data** relevante

LIMITAÇÕES:
- Sem extrapolação além do conteúdo do sistema.
- Sem opiniões ou previsões.
- Sem linguagem emocional.`;

async function fetchSystemContext(supabaseAdmin: any, userMessage: string) {
  const context: string[] = [];
  const searchTerms = userMessage.toLowerCase();

  try {
    // Fetch recent documents (last 50, or matching search)
    const { data: documents } = await supabaseAdmin
      .from("documents")
      .select(`
        id, title, entry_number, status, priority, confidentiality, 
        entry_date, due_date, origin, sender_name, sender_institution,
        description, subject, external_reference,
        classification_codes(name, code),
        organizational_units!documents_current_unit_id_fkey(name, code),
        document_types(name, code)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (documents?.length) {
      context.push("=== DOCUMENTOS NO SISTEMA ===");
      for (const doc of documents) {
        const parts = [
          `Nº: ${doc.entry_number}`,
          `Título: ${doc.title}`,
          `Estado: ${doc.status}`,
          `Prioridade: ${doc.priority}`,
          `Data Entrada: ${doc.entry_date}`,
        ];
        if (doc.subject) parts.push(`Assunto: ${doc.subject}`);
        if (doc.description) parts.push(`Descrição: ${doc.description}`);
        if (doc.sender_name) parts.push(`Remetente: ${doc.sender_name}`);
        if (doc.sender_institution) parts.push(`Instituição: ${doc.sender_institution}`);
        if (doc.origin) parts.push(`Origem: ${doc.origin}`);
        if (doc.classification_codes) parts.push(`Classificação: ${doc.classification_codes.code} - ${doc.classification_codes.name}`);
        if (doc.organizational_units) parts.push(`Unidade Actual: ${doc.organizational_units.name}`);
        if (doc.document_types) parts.push(`Tipo: ${doc.document_types.name}`);
        if (doc.due_date) parts.push(`Prazo: ${doc.due_date}`);
        if (doc.confidentiality !== 'normal') parts.push(`Confidencialidade: ${doc.confidentiality}`);
        context.push(parts.join(" | "));
      }
    }

    // Fetch processes
    const { data: processes } = await supabaseAdmin
      .from("processes")
      .select(`
        id, process_number, subject, status, priority, process_type,
        created_at, deadline, interested_party,
        organizational_units!processes_current_unit_id_fkey(name, code)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (processes?.length) {
      context.push("\n=== PROCESSOS NO SISTEMA ===");
      for (const proc of processes) {
        const parts = [
          `Nº: ${proc.process_number}`,
          `Assunto: ${proc.subject}`,
          `Estado: ${proc.status}`,
          `Tipo: ${proc.process_type}`,
          `Prioridade: ${proc.priority}`,
          `Criado: ${proc.created_at?.slice(0, 10)}`,
        ];
        if (proc.deadline) parts.push(`Prazo: ${proc.deadline}`);
        if (proc.interested_party) parts.push(`Interessado: ${proc.interested_party}`);
        if (proc.organizational_units) parts.push(`Unidade: ${proc.organizational_units.name}`);
        context.push(parts.join(" | "));
      }
    }

    // Fetch dispatches
    const { data: dispatches } = await supabaseAdmin
      .from("dispatches")
      .select(`
        id, dispatch_number, subject, status, priority, dispatch_type,
        content, created_at, deadline,
        organizational_units(name, code)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (dispatches?.length) {
      context.push("\n=== DESPACHOS NO SISTEMA ===");
      for (const disp of dispatches) {
        const parts = [
          `Nº: ${disp.dispatch_number}`,
          `Assunto: ${disp.subject}`,
          `Estado: ${disp.status}`,
          `Tipo: ${disp.dispatch_type}`,
          `Prioridade: ${disp.priority}`,
          `Criado: ${disp.created_at?.slice(0, 10)}`,
        ];
        if (disp.content) parts.push(`Conteúdo: ${disp.content.slice(0, 200)}`);
        if (disp.organizational_units) parts.push(`Unidade Origem: ${disp.organizational_units.name}`);
        if (disp.deadline) parts.push(`Prazo: ${disp.deadline}`);
        context.push(parts.join(" | "));
      }
    }

    // Fetch organizational units
    const { data: units } = await supabaseAdmin
      .from("organizational_units")
      .select("id, name, code, level, is_active")
      .eq("is_active", true)
      .order("level", { ascending: true });

    if (units?.length) {
      context.push("\n=== UNIDADES ORGANIZACIONAIS ===");
      for (const unit of units) {
        context.push(`${unit.code} - ${unit.name} (Nível ${unit.level})`);
      }
    }

    // Fetch classification codes
    const { data: classifications } = await supabaseAdmin
      .from("classification_codes")
      .select("id, name, code, level, description, retention_years, final_destination")
      .eq("is_active", true)
      .order("code", { ascending: true });

    if (classifications?.length) {
      context.push("\n=== PLANO DE CLASSIFICAÇÃO ===");
      for (const cls of classifications) {
        const parts = [`${cls.code} - ${cls.name}`];
        if (cls.description) parts.push(`(${cls.description})`);
        if (cls.retention_years) parts.push(`Retenção: ${cls.retention_years} anos`);
        if (cls.final_destination) parts.push(`Destino final: ${cls.final_destination}`);
        context.push(parts.join(" "));
      }
    }

    // Summary stats
    const docCount = documents?.length || 0;
    const procCount = processes?.length || 0;
    const dispCount = dispatches?.length || 0;

    context.unshift(`=== RESUMO DO SISTEMA ===\nDocumentos: ${docCount} (últimos) | Processos: ${procCount} (últimos) | Despachos: ${dispCount} (últimos)\n`);

  } catch (error) {
    console.error("Erro ao buscar contexto do sistema:", error);
    context.push("NOTA: Houve um erro ao consultar alguns dados do sistema.");
  }

  return context.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to fetch system data (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate user auth
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
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
    console.log("Authenticated user:", userId);

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não está configurada");
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Fetch system context based on the latest user message
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    console.log("A buscar contexto do sistema para:", lastUserMessage.slice(0, 100));
    
    const systemContext = await fetchSystemContext(supabaseAdmin, lastUserMessage);
    console.log("Contexto do sistema carregado:", systemContext.length, "caracteres");

    const fullSystemPrompt = `${systemPrompt}\n\n--- DADOS DO SISTEMA NODIDOC ---\n${systemContext}\n--- FIM DOS DADOS ---`;

    console.log("A processar pedido do assistente NODIDOC com", messages.length, "mensagens");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro do AI gateway:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Por favor, tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Pagamento necessário. Por favor, adicione créditos à sua área de trabalho." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Transmissão iniciada com sucesso");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Erro no assistente NODIDOC:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
