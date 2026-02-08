import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AISuggestion {
  label: string;
  confidence: number;
}

interface AIAnalysisResult {
  document_type?: string;
  confidence?: number;
  recommended_tags?: string[];
  classification_suggestion?: {
    code?: string;
    category?: string;
    subcategory?: string;
  };
  sensitivity_level?: string;
  summary?: string;
  extracted_fields?: {
    title?: string;
    subject?: string;
    sender?: string;
    keywords?: string[];
  };
}

interface WizardAISuggestionsProps {
  uploadedFiles: File[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
  disabled?: boolean;
}

export function WizardAISuggestions({
  uploadedFiles,
  selectedTags,
  onTagToggle,
  onAnalysisComplete,
  disabled,
}: WizardAISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFiles.length === 0) {
      setSuggestions([]);
      setHasAnalyzed(false);
      setError(null);
      return;
    }

    // Only analyze when files are first added
    if (hasAnalyzed) return;

    const analyzeFile = async () => {
      setIsAnalyzing(true);
      setError(null);
      
      try {
        const file = uploadedFiles[0];
        
        // Read file text content for analysis
        let ocrText = "";
        if (file.type === "application/pdf" || file.type.startsWith("text/")) {
          ocrText = await file.text();
        } else {
          // For non-text files, use the filename and basic metadata
          ocrText = `Ficheiro: ${file.name}\nTipo: ${file.type}\nTamanho: ${file.size} bytes`;
        }

        if (ocrText.trim().length < 10) {
          ocrText = `Documento carregado: ${file.name}. Tipo MIME: ${file.type}`;
        }

        const { data, error: fnError } = await supabase.functions.invoke("analyze-document", {
          body: { ocrText: ocrText.slice(0, 5000) }, // Limit to 5000 chars
        });

        if (fnError) {
          console.error("AI analysis error:", fnError);
          setError("Não foi possível analisar o documento");
          return;
        }

        if (data?.analysis) {
          const analysis = data.analysis as AIAnalysisResult;
          
          // Build suggestions from analysis
          const tags: AISuggestion[] = [];
          
          if (analysis.recommended_tags) {
            analysis.recommended_tags.slice(0, 6).forEach((tag: string, index: number) => {
              tags.push({
                label: tag,
                confidence: Math.max(60, 95 - index * 7),
              });
            });
          }

          if (analysis.extracted_fields?.keywords) {
            analysis.extracted_fields.keywords.slice(0, 3).forEach((kw: string) => {
              if (!tags.find(t => t.label.toLowerCase() === kw.toLowerCase())) {
                tags.push({ label: kw, confidence: 70 });
              }
            });
          }

          if (analysis.classification_suggestion?.category) {
            const cat = analysis.classification_suggestion.category;
            if (!tags.find(t => t.label.toLowerCase() === cat.toLowerCase())) {
              tags.push({ label: cat, confidence: 85 });
            }
          }

          setSuggestions(tags.slice(0, 8));
          setHasAnalyzed(true);
          onAnalysisComplete?.(analysis);
        }
      } catch (err) {
        console.error("Analysis failed:", err);
        setError("Erro ao processar análise IA");
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeFile();
  }, [uploadedFiles, hasAnalyzed, onAnalysisComplete]);

  // If no files and no suggestions, show placeholder
  if (uploadedFiles.length === 0 && suggestions.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Sugestões IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Carregue um ficheiro no passo 2 para obter sugestões automáticas de classificação e tags.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning" />
          Sugestões IA
          {isAnalyzing && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              A analisar...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {!isAnalyzing && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag.label}
                onClick={() => onTagToggle(tag.label)}
                disabled={disabled}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-colors",
                  selectedTags.includes(tag.label)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <span>{tag.label}</span>
                <span className="opacity-70">{tag.confidence}%</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
