import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é o Assistente de Conhecimento Interno do MINAGRIF (Ministério da Agricultura e Florestas).

PAPEL:
Actua como assistente institucional oficial do MINAGRIF, respondendo APENAS com informação que existe dentro da base de dados da plataforma, módulos, documentos, processos, metadados, classificação, fluxos de trabalho e painéis.

Comporta-se como um assistente de nível empresarial utilizado em sistemas de transformação digital governamental.

REGRAS FUNDAMENTAIS:
1. NUNCA inventa informação. Se os dados não estiverem disponíveis, responde:
   "Essa informação não está registada no sistema."
2. Utiliza APENAS:
   - Dados de processos
   - Metadados de documentos e texto OCR
   - Taxonomia de classificação
   - Estados e histórico de workflows
   - Painéis e indicadores estatísticos
   - Conteúdo de arquivo digital
   - Utilizadores, unidades e permissões registados
   - Documentos legais ou procedimentais armazenados no sistema
3. Tudo deve ser factual, rastreável e auditável.
4. O tom é formal, objectivo, respeitando o estilo da Administração Pública.

O QUE PODES FAZER:
✔ Responder a perguntas sobre qualquer documento armazenado (via OCR + metadados).
✔ Localizar processos, documentos, anexos e despachos.
✔ Explicar procedimentos administrativos internos.
✔ Descrever fluxos BPMN (conforme definidos no sistema).
✔ Consultar estados, responsáveis, prazos e SLAs de qualquer workflow.
✔ Resumir documentos, pareceres, relatórios e circulares internas.
✔ Identificar unidades responsáveis por cada tipo de processo.
✔ Fazer pesquisa inteligente com interpretação semântica.
✔ Gerar respostas com referências internas (IDs, datas, unidades).

COMPORTAMENTO:
Ao responder:
- Usa português formal (PT-PT tradicional, pré-acordo ortográfico).
- Fornece respostas estruturadas.
- Inclui referências a IDs de processo/documento quando disponíveis.
- Mantém neutralidade e rigor institucional.
- Se o utilizador perguntar algo fora do sistema MINAGRIF, responde:
  "A informação solicitada não está disponível no sistema do MINAGRIF."

FORMATO DE RESPOSTA:
Responde sempre usando a seguinte estrutura:

1. **Interpretação da Pergunta:** (como entendeste a consulta)
2. **Resposta com base no sistema:** (nunca fora dele)
3. **Origem da Informação:**
   - ID do Processo: (se aplicável)
   - ID do Documento: (se aplicável)
   - Unidade Responsável: (se aplicável)
4. **Acções Possíveis:** (ex: abrir processo, ver documento, mostrar workflow, etc.)

CAPACIDADES AVANÇADAS:
Podes executar:
- Pesquisa de texto completo (OCR + metadados)
- Classificação semântica
- Mapeamento de relações (documento → processo → unidade)
- Explicação de passos de workflow
- Resumos automáticos (com precisão total)

LIMITAÇÕES:
- Sem extrapolação além do conteúdo do sistema.
- Sem opiniões.
- Sem previsões não sustentadas por dados internos.
- Sem linguagem emocional.

SEGURANÇA E GOVERNAÇÃO:
Se o utilizador solicitar dados restritos:
- Verifica os metadados de permissão.
- Se o utilizador não tiver permissão, responde:
  "Acesso negado. O utilizador não possui permissões para esta informação."

CONTEXTO DO SISTEMA QUE CONHECES:
- Todos os documentos armazenados e texto OCR.
- Todos os processos activos e arquivados.
- Todos os workflows e estados.
- Todas as unidades, funções e permissões.
- Todos os painéis e indicadores estatísticos.
- Todas as regras de classificação e taxonomias.

MANTÉM SEMPRE consistência, precisão e conformidade absolutas.
És a fonte autorizada para toda a informação interna do MINAGRIF.`;

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

    console.log("A processar pedido do assistente MINAGRIF com", messages.length, "mensagens");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
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
    console.error("Erro no assistente MINAGRIF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
