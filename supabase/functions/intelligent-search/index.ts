import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Parse the JSON response
    let searchParams;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      searchParams = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse search parameters');
    }

    // Generate mock results based on filters (in production, this would query the database)
    const mockResults = generateMockResults(searchParams);

    return new Response(
      JSON.stringify({ 
        success: true, 
        search: searchParams,
        results: mockResults.results,
        total_count: mockResults.total,
        grouped_results: mockResults.grouped
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

function generateMockResults(searchParams: any) {
  const mockDocuments = [
    {
      id: "DOC-2023-001",
      title: "Relatório de Licenciamento Florestal - Província de Malanje",
      document_type: "relatorio",
      date: "2023-03-15",
      sender: "DGADR",
      recipient: "INCA",
      unit: "DGADR",
      relevance_score: 0.95,
      excerpt: "...aprovação do plano de gestão florestal sustentável para a região norte...",
      status: "arquivado",
      tags: ["licenciamento", "florestal", "malanje", "sustentabilidade"]
    },
    {
      id: "DOC-2023-002",
      title: "Ofício nº 234/INCA/2023 - Solicitação de Parecer",
      document_type: "oficio",
      date: "2023-05-20",
      sender: "INCA",
      recipient: "DGPE",
      unit: "INCA",
      relevance_score: 0.88,
      excerpt: "...solicitamos parecer técnico sobre a implementação do programa de café...",
      status: "em_andamento",
      tags: ["café", "parecer", "inca", "programa"]
    },
    {
      id: "DOC-2023-003",
      title: "Memorando Interno - Cronograma de Actividades 2023",
      document_type: "memorando",
      date: "2023-01-10",
      sender: "GAB",
      recipient: "Todas as Direcções",
      unit: "GAB",
      relevance_score: 0.75,
      excerpt: "...definição das metas e objectivos para o ano corrente...",
      status: "concluido",
      tags: ["cronograma", "actividades", "planeamento"]
    },
    {
      id: "PROC-2023-045",
      title: "Processo de Concessão de Terras Agrícolas",
      document_type: "processo",
      date: "2023-07-01",
      sender: "IDA",
      recipient: "DGADR",
      unit: "IDA",
      relevance_score: 0.82,
      excerpt: "...análise do pedido de concessão para exploração agrícola na província...",
      status: "em_andamento",
      tags: ["concessão", "terras", "agrícola", "ida"]
    },
    {
      id: "DOC-2023-004",
      title: "Parecer Jurídico - Contrato de Fornecimento",
      document_type: "parecer",
      date: "2023-06-15",
      sender: "Assessoria Jurídica",
      recipient: "DGPE",
      unit: "GAB",
      relevance_score: 0.70,
      excerpt: "...opinião favorável à celebração do contrato, com as ressalvas indicadas...",
      status: "concluido",
      tags: ["parecer", "jurídico", "contrato", "fornecimento"]
    }
  ];

  // Filter based on search params
  let filtered = mockDocuments;
  
  if (searchParams.filters_applied?.document_types?.length > 0) {
    filtered = filtered.filter(doc => 
      searchParams.filters_applied.document_types.includes(doc.document_type)
    );
  }

  if (searchParams.filters_applied?.unit) {
    filtered = filtered.filter(doc => 
      doc.unit.toLowerCase().includes(searchParams.filters_applied.unit.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchParams.filters_applied.unit.toLowerCase()) ||
      doc.recipient.toLowerCase().includes(searchParams.filters_applied.unit.toLowerCase())
    );
  }

  // Group results
  const grouped = {
    by_type: {} as Record<string, number>,
    by_unit: {} as Record<string, number>,
    by_year: {} as Record<string, number>,
    by_status: {} as Record<string, number>
  };

  filtered.forEach(doc => {
    grouped.by_type[doc.document_type] = (grouped.by_type[doc.document_type] || 0) + 1;
    grouped.by_unit[doc.unit] = (grouped.by_unit[doc.unit] || 0) + 1;
    const year = doc.date.split('-')[0];
    grouped.by_year[year] = (grouped.by_year[year] || 0) + 1;
    grouped.by_status[doc.status] = (grouped.by_status[doc.status] || 0) + 1;
  });

  return {
    results: filtered.sort((a, b) => b.relevance_score - a.relevance_score),
    total: filtered.length,
    grouped
  };
}
