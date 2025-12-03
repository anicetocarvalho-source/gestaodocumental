import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are the Internal Document Intelligence Engine of the MINAGRIF Process & Document Management Platform.

Your role:
- Read OCR text from uploaded documents.
- Extract structured metadata: title, date, type, sender, recipient, keywords, classification code (if possible).
- Identify whether the document is: official letter, internal memo, process annex, contract, technical report, invoice, or undefined.
- Suggest 5–10 relevant tags.
- Suggest the correct classification category according to hierarchical taxonomy.
- Identify sensitive content (jurídico, financeiro, pessoal).

Output structure (JSON only):
{
  "document_type": "official_letter | internal_memo | process_annex | contract | technical_report | invoice | undefined",
  "confidence": 0.0-1.0,
  "extracted_fields": {
    "title": "",
    "date": "",
    "sender": "",
    "recipient": "",
    "reference_number": "",
    "subject": "",
    "keywords": []
  },
  "recommended_tags": [],
  "classification_suggestion": {
    "code": "",
    "category": "",
    "subcategory": ""
  },
  "sensitivity_level": "público | interno | restrito | confidencial",
  "sensitive_content": {
    "juridico": false,
    "financeiro": false,
    "pessoal": false,
    "details": ""
  },
  "summary": ""
}

Rules:
- No assumptions if OCR is unclear. Mark uncertain fields with null.
- Always include a confidence score between 0 and 1.
- Be strict and conservative in classification.
- Return ONLY valid JSON, no additional text.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ocrText } = await req.json();

    if (!ocrText || ocrText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'OCR text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing document with OCR text length:', ocrText.length);

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
          { role: 'user', content: `Analyze the following OCR text and extract structured metadata:\n\n${ocrText}` }
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
    let analysisResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse analysis result');
    }

    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
