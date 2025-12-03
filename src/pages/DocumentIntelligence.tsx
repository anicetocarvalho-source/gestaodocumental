import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Tag,
  FolderTree,
  Shield,
  FileSearch,
  Calendar,
  User,
  Building,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  document_type: string;
  confidence: number;
  extracted_fields: {
    title: string | null;
    date: string | null;
    sender: string | null;
    recipient: string | null;
    reference_number: string | null;
    subject: string | null;
    keywords: string[];
  };
  recommended_tags: string[];
  classification_suggestion: {
    code: string;
    category: string;
    subcategory: string;
  };
  sensitivity_level: string;
  sensitive_content: {
    juridico: boolean;
    financeiro: boolean;
    pessoal: boolean;
    details: string;
  };
  summary: string;
}

const documentTypeLabels: Record<string, string> = {
  official_letter: "Ofício",
  internal_memo: "Memorando Interno",
  process_annex: "Anexo de Processo",
  contract: "Contrato",
  technical_report: "Relatório Técnico",
  invoice: "Fatura/Nota Fiscal",
  undefined: "Não Identificado",
};

const sensitivityColors: Record<string, string> = {
  público: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  interno: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  restrito: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  confidencial: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DocumentIntelligence() {
  const [ocrText, setOcrText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!ocrText.trim()) {
      toast.error("Por favor, insira o texto OCR do documento");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { ocrText },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.analysis);
      toast.success("Análise concluída com sucesso!");
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao analisar documento");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyJson = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      toast.success("JSON copiado para a área de transferência");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <DashboardLayout
      title="Inteligência Documental"
      subtitle="Análise automática de documentos com IA"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Texto OCR do Documento
            </CardTitle>
            <CardDescription>
              Cole o texto extraído por OCR do documento para análise automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ocr-text">Conteúdo do Documento</Label>
              <Textarea
                id="ocr-text"
                placeholder="Cole aqui o texto OCR do documento..."
                className="min-h-[400px] font-mono text-sm"
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {ocrText.length} caracteres
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !ocrText.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analisar Documento
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Resultado da Análise
              </CardTitle>
              {result && (
                <Button variant="outline" size="sm" onClick={handleCopyJson}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  JSON
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!result && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <FileSearch className="h-12 w-12 mb-4 opacity-50" />
                <p>Os resultados da análise aparecerão aqui</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Processando documento com IA...</p>
              </div>
            )}

            {result && (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {/* Document Type & Confidence */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                      <p className="text-lg font-semibold">
                        {documentTypeLabels[result.document_type] || result.document_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Confiança</p>
                      <p className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                        {Math.round(result.confidence * 100)}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Extracted Fields */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Campos Extraídos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {result.extracted_fields.title && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Título</p>
                          <p className="font-medium">{result.extracted_fields.title}</p>
                        </div>
                      )}
                      {result.extracted_fields.date && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Data</p>
                            <p>{result.extracted_fields.date}</p>
                          </div>
                        </div>
                      )}
                      {result.extracted_fields.reference_number && (
                        <div className="flex items-start gap-2">
                          <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Referência</p>
                            <p>{result.extracted_fields.reference_number}</p>
                          </div>
                        </div>
                      )}
                      {result.extracted_fields.sender && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Remetente</p>
                            <p>{result.extracted_fields.sender}</p>
                          </div>
                        </div>
                      )}
                      {result.extracted_fields.recipient && (
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Destinatário</p>
                            <p>{result.extracted_fields.recipient}</p>
                          </div>
                        </div>
                      )}
                      {result.extracted_fields.subject && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Assunto</p>
                          <p>{result.extracted_fields.subject}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Classification */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FolderTree className="h-4 w-4" />
                      Classificação Sugerida
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      {result.classification_suggestion.code && (
                        <p className="font-mono text-sm">
                          Código: <strong>{result.classification_suggestion.code}</strong>
                        </p>
                      )}
                      {result.classification_suggestion.category && (
                        <p className="text-sm">
                          Categoria: {result.classification_suggestion.category}
                        </p>
                      )}
                      {result.classification_suggestion.subcategory && (
                        <p className="text-sm text-muted-foreground">
                          Subcategoria: {result.classification_suggestion.subcategory}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags Recomendadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.recommended_tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Sensitivity */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Sensibilidade
                    </h4>
                    <div className="space-y-3">
                      <Badge
                        className={sensitivityColors[result.sensitivity_level] || "bg-gray-100"}
                      >
                        {result.sensitivity_level.toUpperCase()}
                      </Badge>
                      <div className="flex flex-wrap gap-2">
                        {result.sensitive_content.juridico && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Conteúdo Jurídico
                          </Badge>
                        )}
                        {result.sensitive_content.financeiro && (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Conteúdo Financeiro
                          </Badge>
                        )}
                        {result.sensitive_content.pessoal && (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Dados Pessoais
                          </Badge>
                        )}
                      </div>
                      {result.sensitive_content.details && (
                        <p className="text-sm text-muted-foreground">
                          {result.sensitive_content.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {result.summary && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Resumo</h4>
                        <p className="text-sm text-muted-foreground">{result.summary}</p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
