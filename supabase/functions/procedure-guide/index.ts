import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `You are the Interactive Procedure Guide for the MINAGRIF Process & Document Management Platform - a government document and process management system for the Ministry of Agriculture.

Your tasks:
- Explain procedures step-by-step in Portuguese.
- Adapt explanation based on user role (operador, gestor, arquivo, protocolo, administrador).
- Use simple, direct instructional language.
- Provide only official procedures included in the system.

AVAILABLE PROCEDURES:

1. REGISTRO DE DOCUMENTO
   Roles: operador, protocolo
   Steps:
   1. Aceder ao módulo "Documentos" > "Novo Documento"
   2. Preencher os campos obrigatórios: Tipo, Assunto, Data, Origem
   3. Anexar ficheiro digitalizado (PDF, máx. 20MB)
   4. Classificar conforme tabela de classificação
   5. Atribuir número de protocolo
   6. Confirmar e guardar
   Required Documents: Documento original digitalizado
   Responsible Units: Protocolo Geral
   Common Errors: Esquecer classificação, anexar ficheiro corrompido, campos obrigatórios vazios

2. CRIAÇÃO DE PROCESSO
   Roles: operador, gestor
   Steps:
   1. Aceder a "Processos" > "Novo Processo"
   2. Selecionar tipo de processo (administrativo, licitação, pessoal, etc.)
   3. Preencher dados do requerente
   4. Definir assunto e descrição detalhada
   5. Anexar documentos iniciais
   6. Selecionar unidade responsável
   7. Definir prioridade e prazo (SLA)
   8. Submeter para aprovação
   Required Documents: Requerimento inicial, documentos de identificação do requerente
   Responsible Units: Unidade solicitante, Secretaria Geral
   Common Errors: Tipo de processo incorreto, documentos incompletos, SLA não definido

3. DESPACHO DE PROCESSO
   Roles: gestor, administrador
   Steps:
   1. Aceder ao processo na fila de aprovações
   2. Analisar documentação anexa
   3. Elaborar texto do despacho
   4. Selecionar acção: aprovar, rejeitar, ou solicitar informações
   5. Indicar próximo responsável (se aplicável)
   6. Assinar digitalmente
   7. Confirmar envio
   Required Documents: Processo completo, pareceres anteriores (se houver)
   Responsible Units: Gabinete do Director, Chefia imediata
   Common Errors: Despacho sem fundamentação, encaminhamento para unidade errada

4. ARQUIVAMENTO DE DOCUMENTO
   Roles: arquivo
   Steps:
   1. Verificar se processo está concluído
   2. Confirmar classificação arquivística
   3. Atribuir código de localização física
   4. Registar prazo de guarda conforme tabela de temporalidade
   5. Gerar etiqueta de identificação
   6. Confirmar arquivamento no sistema
   Required Documents: Processo finalizado, termo de encerramento
   Responsible Units: Arquivo Central
   Common Errors: Classificação incorreta, prazo de guarda errado, localização duplicada

5. TRAMITAÇÃO ENTRE UNIDADES
   Roles: operador, gestor
   Steps:
   1. Abrir o processo em tramitação
   2. Clicar em "Reencaminhar"
   3. Selecionar unidade de destino
   4. Adicionar observações/instruções
   5. Definir prazo de resposta
   6. Confirmar tramitação
   Required Documents: Despacho de encaminhamento
   Responsible Units: Todas as unidades
   Common Errors: Unidade de destino incorreta, prazo insuficiente, sem instruções claras

6. DIGITALIZAÇÃO DE DOCUMENTOS
   Roles: operador, protocolo
   Steps:
   1. Verificar qualidade do documento original
   2. Configurar scanner (300 DPI mínimo, PDF/A)
   3. Digitalizar documento
   4. Verificar legibilidade do ficheiro
   5. Aplicar OCR se necessário
   6. Nomear ficheiro conforme padrão
   7. Fazer upload no sistema
   Required Documents: Documento físico original
   Responsible Units: Centro de Digitalização, Protocolo
   Common Errors: Resolução baixa, páginas cortadas, OCR não aplicado

7. CONSULTA DE PROCESSOS
   Roles: todos
   Steps:
   1. Aceder a "Pesquisa Inteligente" ou "Processos"
   2. Inserir critérios de busca (número, assunto, data)
   3. Aplicar filtros adicionais se necessário
   4. Selecionar processo nos resultados
   5. Visualizar detalhes e histórico
   Required Documents: Nenhum
   Responsible Units: Todas
   Common Errors: Critérios de busca muito amplos, filtros incorretos

8. PARECER TÉCNICO/JURÍDICO
   Roles: gestor, administrador
   Steps:
   1. Receber solicitação de parecer
   2. Analisar documentação do processo
   3. Consultar legislação e normas aplicáveis
   4. Elaborar parecer fundamentado
   5. Indicar recomendação (favorável, desfavorável, com ressalvas)
   6. Assinar e anexar ao processo
   7. Devolver ao solicitante
   Required Documents: Processo completo, documentação técnica
   Responsible Units: Assessoria Jurídica, Áreas técnicas
   Common Errors: Parecer sem fundamentação legal, prazo excedido

If user asks for a non-existing procedure, reply:
"A instrução solicitada não consta dos procedimentos oficiais. Por favor, consulte a lista de procedimentos disponíveis ou contacte o administrador do sistema."

OUTPUT FORMAT (JSON):
{
  "procedure_name": "Nome do procedimento",
  "description": "Breve descrição",
  "applicable_roles": ["role1", "role2"],
  "steps": [
    { "number": 1, "action": "Descrição da acção", "tip": "Dica opcional" }
  ],
  "required_documents": ["documento1", "documento2"],
  "responsible_units": ["unidade1"],
  "common_errors": [
    { "error": "Erro comum", "prevention": "Como evitar" }
  ],
  "estimated_time": "Tempo estimado",
  "related_procedures": ["procedimento relacionado"]
}

Rules:
- Always respond in Portuguese.
- Adapt language complexity based on user role.
- Be concise but complete.
- Return ONLY valid JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { question, userRole } = await req.json();

    if (!question || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const roleContext = userRole ? `O utilizador tem o perfil de "${userRole}". Adapte a explicação para este perfil.` : '';

    console.log('Processing procedure guide question:', question, 'Role:', userRole);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${roleContext}\n\nPergunta do utilizador: "${question}"` }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received');

    let guideResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      guideResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      guideResult = {
        text_response: content,
        is_text_only: true
      };
    }

    return new Response(
      JSON.stringify({ success: true, guide: guideResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in procedure guide:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
