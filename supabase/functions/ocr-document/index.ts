import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ocrPrompt = `You are an advanced OCR (Optical Character Recognition) system specialized in extracting text from scanned documents.

Your task:
1. Extract ALL visible text from the image, preserving the original structure as much as possible.
2. Identify the document language.
3. Assess the quality of the OCR extraction (confidence score).

Instructions:
- Preserve paragraph breaks and formatting where possible.
- If text is unclear or illegible, mark it with [ilegível] or [unclear].
- Include headers, footers, stamps, and handwritten annotations if visible.
- For tables, try to maintain a structured format using spaces or tabs.

Output your response as JSON:
{
  "ocr_text": "The complete extracted text from the document",
  "detected_language": "pt | en | es | fr | other",
  "confidence": 0.0 to 1.0,
  "document_characteristics": {
    "has_stamps": boolean,
    "has_signatures": boolean,
    "has_handwriting": boolean,
    "has_tables": boolean,
    "page_quality": "excellent | good | fair | poor"
  },
  "notes": "Any relevant observations about the document or OCR quality"
}

Return ONLY valid JSON.`;

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

    const { documentId, filePath, imageBase64 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let imageData: string;
    let mimeType = 'image/jpeg';

    if (imageBase64) {
      imageData = imageBase64;
    } else if (filePath) {
      console.log('Downloading file from storage:', filePath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('scanned-documents')
        .download(filePath);

      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      imageData = btoa(binary);
      mimeType = fileData.type || 'image/jpeg';
    } else {
      throw new Error('Either imageBase64 or filePath is required');
    }

    if (filePath) {
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'tiff' || ext === 'tif') mimeType = 'image/tiff';
      else if (ext === 'pdf') mimeType = 'application/pdf';
    }

    console.log('Processing OCR for document:', documentId, 'Type:', mimeType);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ocrPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this scanned document image:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageData}`
                }
              }
            ]
          }
        ],
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
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos para continuar.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('OCR response received');

    let ocrResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      ocrResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse OCR response:', content);
      ocrResult = {
        ocr_text: content,
        detected_language: 'unknown',
        confidence: 0.5,
        document_characteristics: {
          has_stamps: false,
          has_signatures: false,
          has_handwriting: false,
          has_tables: false,
          page_quality: 'unknown'
        },
        notes: 'Response parsing failed, raw text extracted'
      };
    }

    if (documentId) {
      const confidencePercent = Math.round((ocrResult.confidence || 0.5) * 100);
      
      const { error: updateError } = await supabase
        .from('scanned_documents')
        .update({
          ocr_text: ocrResult.ocr_text,
          ocr_confidence: confidencePercent,
          detected_language: ocrResult.detected_language,
          quality_score: ocrResult.document_characteristics?.page_quality === 'excellent' ? 100 :
                         ocrResult.document_characteristics?.page_quality === 'good' ? 75 :
                         ocrResult.document_characteristics?.page_quality === 'fair' ? 50 : 25,
          quality_flags: ocrResult.document_characteristics,
          metadata: { notes: ocrResult.notes },
          status: 'quality_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document:', updateError);
      } else {
        console.log('Document updated successfully:', documentId);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ocr: ocrResult,
        documentId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing OCR:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido no OCR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
