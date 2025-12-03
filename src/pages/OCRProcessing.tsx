import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Wand2,
  Languages,
  Eye,
  Trash2,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

type OCRStatus = "pending" | "processing" | "completed" | "error";

interface OCRFile {
  id: string;
  name: string;
  status: OCRStatus;
  progress: number;
  detectedLanguage: string;
  confidence: number;
  extractedText: string;
  isLowQuality: boolean;
  errorMessage?: string;
  processedAt?: string;
}

interface OCREvent {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  fileName?: string;
}

const mockFiles: OCRFile[] = [
  {
    id: "1",
    name: "Contrato_Prestacao_Servicos_2024.pdf",
    status: "completed",
    progress: 100,
    detectedLanguage: "PT-PT",
    confidence: 98.5,
    extractedText: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nEntre as partes:\n\n1. PRIMEIRO OUTORGANTE: Ministério da Administração Interna, com sede na Praça do Comércio, 1100-148 Lisboa, representado pelo Exmo. Sr. Director-Geral...\n\n2. SEGUNDO OUTORGANTE: Empresa de Tecnologias de Informação, Lda., com sede na Av. da República, n.º 50, 1050-196 Lisboa...",
    isLowQuality: false,
    processedAt: "2024-01-15 14:32:15",
  },
  {
    id: "2",
    name: "Despacho_Ministerial_0045.pdf",
    status: "processing",
    progress: 67,
    detectedLanguage: "PT-PT",
    confidence: 0,
    extractedText: "",
    isLowQuality: false,
  },
  {
    id: "3",
    name: "Documento_Digitalizado_Antigo.tiff",
    status: "error",
    progress: 45,
    detectedLanguage: "PT-PT",
    confidence: 0,
    extractedText: "",
    isLowQuality: true,
    errorMessage: "Qualidade de digitalização insuficiente. Resolução detectada: 72 DPI (mínimo recomendado: 300 DPI)",
  },
  {
    id: "4",
    name: "Acta_Reuniao_Conselho.pdf",
    status: "pending",
    progress: 0,
    detectedLanguage: "",
    confidence: 0,
    extractedText: "",
    isLowQuality: false,
  },
  {
    id: "5",
    name: "Relatorio_Financeiro_Q4.pdf",
    status: "completed",
    progress: 100,
    detectedLanguage: "PT-PT",
    confidence: 94.2,
    extractedText: "RELATÓRIO FINANCEIRO - 4º TRIMESTRE 2024\n\nResumo Executivo:\n\nO presente relatório apresenta os resultados financeiros consolidados do quarto trimestre de 2024, demonstrando um crescimento de 12% face ao período homólogo...",
    isLowQuality: true,
    processedAt: "2024-01-15 13:45:22",
  },
  {
    id: "6",
    name: "Circular_Interna_2024_001.pdf",
    status: "pending",
    progress: 0,
    detectedLanguage: "",
    confidence: 0,
    extractedText: "",
    isLowQuality: false,
  },
];

const mockEvents: OCREvent[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:35:42",
    type: "info",
    message: "Processamento em lote iniciado para 6 ficheiros",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:32:15",
    type: "success",
    message: "OCR concluído com sucesso",
    fileName: "Contrato_Prestacao_Servicos_2024.pdf",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:30:08",
    type: "warning",
    message: "Qualidade de digitalização baixa detectada",
    fileName: "Documento_Digitalizado_Antigo.tiff",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:28:45",
    type: "error",
    message: "Falha no processamento OCR - resolução insuficiente",
    fileName: "Documento_Digitalizado_Antigo.tiff",
  },
  {
    id: "5",
    timestamp: "2024-01-15 13:45:22",
    type: "success",
    message: "OCR concluído com sucesso",
    fileName: "Relatorio_Financeiro_Q4.pdf",
  },
  {
    id: "6",
    timestamp: "2024-01-15 13:44:10",
    type: "warning",
    message: "Confiança de reconhecimento abaixo do ideal (94.2%)",
    fileName: "Relatorio_Financeiro_Q4.pdf",
  },
];

const getStatusIcon = (status: OCRStatus) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-info animate-spin" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
  }
};

const getStatusBadge = (status: OCRStatus) => {
  const variants: Record<OCRStatus, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-muted text-muted-foreground" },
    processing: { label: "A processar", className: "bg-info/10 text-info border-info/20" },
    completed: { label: "Concluído", className: "bg-success/10 text-success border-success/20" },
    error: { label: "Erro", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  return variants[status];
};

const getEventIcon = (type: OCREvent["type"]) => {
  switch (type) {
    case "info":
      return <FileText className="h-3.5 w-3.5 text-info" />;
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
    case "error":
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case "success":
      return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  }
};

const OCRProcessing = () => {
  const [files, setFiles] = useState<OCRFile[]>(mockFiles);
  const [events] = useState<OCREvent[]>(mockEvents);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(true);

  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const processingCount = files.filter((f) => f.status === "processing").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;

  const overallProgress = Math.round(
    files.reduce((acc, file) => acc + file.progress, 0) / files.length
  );

  const toggleExpanded = (id: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRetryOCR = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "pending" as OCRStatus, progress: 0, errorMessage: undefined } : f
      )
    );
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <DashboardLayout title="Processamento OCR" subtitle="Reconhecimento óptico de caracteres">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end gap-2">
          {isProcessing ? (
            <Button variant="outline" onClick={() => setIsProcessing(false)}>
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          ) : (
            <Button onClick={() => setIsProcessing(true)}>
              <Play className="h-4 w-4 mr-2" />
              Retomar
            </Button>
          )}
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar Lote
          </Button>
        </div>

        {/* Batch Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Progresso do Lote</CardTitle>
                <CardDescription>
                  {completedCount} de {files.length} ficheiros processados
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-2xl font-semibold text-foreground">{overallProgress}%</span>
                <p className="text-xs text-muted-foreground">concluído</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={overallProgress} className="h-3" />
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Concluídos: {completedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-info animate-pulse" />
                <span className="text-muted-foreground">A processar: {processingCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Pendentes: {pendingCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Erros: {errorCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* File List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ficheiros em Processamento</CardTitle>
                <CardDescription>Lista de documentos submetidos para OCR</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border">
                    {files.map((file) => {
                      const statusBadge = getStatusBadge(file.status);
                      const isExpanded = expandedFiles.has(file.id);

                      return (
                        <div key={file.id} className="p-4">
                          {/* Low Quality Warning */}
                          {file.isLowQuality && (
                            <Alert className="mb-3 border-warning/50 bg-warning/5">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              <AlertTitle className="text-warning text-sm">
                                Qualidade de Digitalização Baixa
                              </AlertTitle>
                              <AlertDescription className="text-xs text-muted-foreground">
                                {file.errorMessage ||
                                  "Este documento pode ter resultados de OCR com menor precisão. Considere redigitalizar com maior resolução."}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* File Header */}
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getStatusIcon(file.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-foreground truncate">
                                  {file.name}
                                </span>
                                <Badge variant="outline" className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>

                              {/* Progress bar for processing files */}
                              {file.status === "processing" && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>A processar...</span>
                                    <span>{file.progress}%</span>
                                  </div>
                                  <Progress value={file.progress} size="sm" variant="info" />
                                </div>
                              )}

                              {/* Completed file info */}
                              {file.status === "completed" && (
                                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Languages className="h-3.5 w-3.5" />
                                    <span>{file.detectedLanguage}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Confiança: {file.confidence}%</span>
                                  </div>
                                  {file.processedAt && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>{file.processedAt}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Extracted Text Preview */}
                              {file.status === "completed" && file.extractedText && (
                                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(file.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5 mr-1" />
                                      )}
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      Pré-visualizar texto extraído
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="mt-2 p-3 bg-muted/50 rounded-md border border-border">
                                      <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                                        {file.extractedText}
                                      </p>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* Actions */}
                              <div className="mt-3 flex items-center gap-2">
                                {file.status === "error" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => handleRetryOCR(file.id)}
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                      Repetir OCR
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                                      Melhorar Qualidade
                                    </Button>
                                  </>
                                )}
                                {file.isLowQuality && file.status === "completed" && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs">
                                    <Wand2 className="h-3.5 w-3.5 mr-1" />
                                    Melhorar Qualidade
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveFile(file.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Event Log */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registo de Eventos</CardTitle>
                <CardDescription>Histórico de actividade OCR</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border">
                    {events.map((event) => (
                      <div key={event.id} className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">{event.message}</p>
                            {event.fileName && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {event.fileName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Language Detection Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Idiomas Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Português (PT-PT)</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Prioritário
                    </Badge>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>PT-PT</span>
                      <span>4 ficheiros</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Não detectado</span>
                      <span>2 ficheiros</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OCRProcessing;
