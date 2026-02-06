import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const systemPrompt = `You are the Intelligent Search Engine of the MINAGRIF Archive - a government document management system.

Your goals:
- Interpret complex queries in Portuguese (e.g., "mostre processos sobre licenciamento florestal enviados ao INCA em 2023").
- Extract search filters from natural language: document type, date range, sender, recipient, unit, keywords, subject.
- Generate search understanding explanation in Portuguese.
- Suggest query refinements to help users narrow or expand their search.

Output structure (JSON only):
{
  "query_understanding": "Explicação em português do que o usuário está buscando",
  "filters_applied": {
    "document_types": [],
    "date_range": { "start": null, "end": null },
    "sender": null,
    "recipient": null,
    "unit": null,
    "keywords": [],
    "subject": null,
    "status": null,
    "priority": null
  },
  "search_terms": [],
  "suggested_refinements": [
    { "label": "", "query": "" }
  ],
  "empty_result_message": "Nenhum documento correspondente encontrado."
}

Document types available:
- oficio (official letter)
- memorando (internal memo)
- processo (process)
- contrato (contract)
- parecer (legal opinion)
- despacho (dispatch)
- relatorio (technical report)
- nota_fiscal (invoice)
- ata (meeting minutes)
- portaria (ordinance)

Units available:
- DGPE - Direcção Geral de Planificação e Estatística
- DGADR - Direcção Geral de Agricultura e Desenvolvimento Rural
- DGPESC - Direcção Geral das Pescas
- INCA - Instituto Nacional do Café de Angola
- IDA - Instituto de Desenvolvimento Agrário
- GAB - Gabinete do Ministro

Rules:
- Always respond in Portuguese.
- Extract as many relevant filters as possible from the query.
- Provide 3-5 suggested refinements to help narrow or expand the search.
- If the query is vague, ask for clarification in the suggested_refinements.
- Return ONLY valid JSON, no additional text.`;

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

    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing search query:', query);

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
          { role: 'user', content: `Parse this search query and extract filters:\n\n"${query}"` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
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

    let searchParams;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      searchParams = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse search parameters');
    }

    // Query real database for results using user's auth context
    const { data: documents, error: docsError } = await supabaseAuth
      .from('documents')
      .select('id, title, entry_number, entry_date, status, priority, origin, subject, sender_name, sender_institution')
      .limit(20);

    const results = documents || [];

    return new Response(
      JSON.stringify({ 
        success: true, 
        search: searchParams,
        results: results,
        total_count: results.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
