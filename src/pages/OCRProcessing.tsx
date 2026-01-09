import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDigitizationBatch, useScannedDocuments, useUpdateBatch, useDeleteScannedDocument, type ScannedDocument } from "@/hooks/useDigitization";
import { useProcessOcr, useProcessMultipleOcr } from "@/hooks/useScannedDocumentUpload";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type OCRStatus = "pending" | "scanning" | "ocr_processing" | "quality_review" | "completed" | "error" | "approved" | "rejected";

interface OCREvent {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  fileName?: string;
}

const getStatusIcon = (status: OCRStatus) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "scanning":
    case "ocr_processing":
      return <Loader2 className="h-4 w-4 text-info animate-spin" />;
    case "quality_review":
      return <Eye className="h-4 w-4 text-warning" />;
    case "completed":
    case "approved":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "error":
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: OCRStatus) => {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-muted text-muted-foreground" },
    scanning: { label: "A digitalizar", className: "bg-info/10 text-info border-info/20" },
    ocr_processing: { label: "OCR em curso", className: "bg-info/10 text-info border-info/20" },
    quality_review: { label: "Em revisão", className: "bg-warning/10 text-warning border-warning/20" },
    completed: { label: "Concluído", className: "bg-success/10 text-success border-success/20" },
    approved: { label: "Aprovado", className: "bg-success/10 text-success border-success/20" },
    error: { label: "Erro", className: "bg-destructive/10 text-destructive border-destructive/20" },
    rejected: { label: "Rejeitado", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  return variants[status] || variants.pending;
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');
  const queryClient = useQueryClient();
  
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [events, setEvents] = useState<OCREvent[]>([]);
  const [processingDocIds, setProcessingDocIds] = useState<Set<string>>(new Set());

  const { data: batch, isLoading: batchLoading } = useDigitizationBatch(batchId || undefined);
  const { data: documents, isLoading: documentsLoading } = useScannedDocuments(batchId || undefined, statusFilter !== "all" ? statusFilter : undefined);
  const updateBatch = useUpdateBatch();
  const deleteDocument = useDeleteScannedDocument();
  const processOcr = useProcessOcr();
  const processMultipleOcr = useProcessMultipleOcr();

  const isLoading = batchLoading || documentsLoading;

  // Filter documents
  const filteredDocuments = documents?.filter(doc => {
    if (statusFilter === "all") return true;
    if (statusFilter === "processing") return doc.status === "scanning" || doc.status === "ocr_processing";
    return doc.status === statusFilter;
  }) || [];

  // Calculate stats - using string comparison to avoid type issues
  const completedCount = documents?.filter(f => (f.status as string) === "completed" || (f.status as string) === "approved").length || 0;
  const errorCount = documents?.filter(f => f.status === "error" || f.status === "rejected").length || 0;
  const processingCount = documents?.filter(f => f.status === "scanning" || f.status === "ocr_processing").length || 0;
  const pendingCount = documents?.filter(f => f.status === "pending").length || 0;
  const reviewCount = documents?.filter(f => f.status === "quality_review").length || 0;
  const totalCount = documents?.length || 0;

  const overallProgress = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // Calculate language stats
  const languageStats = documents?.reduce((acc, doc) => {
    const lang = doc.detected_language || "Não detectado";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const toggleExpanded = (id: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addEvent = (type: OCREvent["type"], message: string, fileName?: string) => {
    const event: OCREvent = {
      id: crypto.randomUUID(),
      timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss", { locale: pt }),
      type,
      message,
      fileName,
    };
    setEvents(prev => [event, ...prev].slice(0, 50));
  };

  const handleProcessOcr = async (doc: ScannedDocument) => {
    if (!doc.file_path) {
      toast.error("Documento não tem ficheiro associado");
      return;
    }

    setProcessingDocIds(prev => new Set(prev).add(doc.id));
    addEvent("info", "A iniciar processamento OCR", doc.title || doc.document_number);

    try {
      // Update status to ocr_processing
      await supabase
        .from('scanned_documents')
        .update({ status: 'ocr_processing' })
        .eq('id', doc.id);

      await processOcr.mutateAsync({
        documentId: doc.id,
        filePath: doc.file_path,
      });

      addEvent("success", "OCR concluído com sucesso", doc.title || doc.document_number);
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
    } catch (error) {
      console.error("OCR error:", error);
      addEvent("error", "Falha no processamento OCR", doc.title || doc.document_number);
      
      await supabase
        .from('scanned_documents')
        .update({ status: 'error' })
        .eq('id', doc.id);
    } finally {
      setProcessingDocIds(prev => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  const handleProcessAllPending = async () => {
    const pendingDocs = documents?.filter(d => d.status === "pending" && d.file_path) || [];
    
    if (pendingDocs.length === 0) {
      toast.info("Nenhum documento pendente com ficheiro para processar");
      return;
    }

    addEvent("info", `A iniciar processamento em lote de ${pendingDocs.length} ficheiro(s)`);

    // Update batch status
    if (batchId) {
      await updateBatch.mutateAsync({
        id: batchId,
        status: 'processing',
        started_at: new Date().toISOString(),
      });
    }

    for (const doc of pendingDocs) {
      await handleProcessOcr(doc);
    }

    addEvent("success", `Processamento em lote concluído para ${pendingDocs.length} ficheiro(s)`);
  };

  const handlePauseBatch = async () => {
    if (!batchId) return;
    
    await updateBatch.mutateAsync({
      id: batchId,
      status: 'paused',
    });
    
    addEvent("warning", "Processamento do lote pausado");
    toast.info("Processamento pausado");
  };

  const handleResumeBatch = async () => {
    if (!batchId) return;
    
    await updateBatch.mutateAsync({
      id: batchId,
      status: 'processing',
    });
    
    addEvent("info", "Processamento do lote retomado");
    toast.success("Processamento retomado");
  };

  const handleRetryOcr = async (doc: ScannedDocument) => {
    await supabase
      .from('scanned_documents')
      .update({ status: 'pending', ocr_text: null, ocr_confidence: null })
      .eq('id', doc.id);
    
    queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
    addEvent("info", "Documento marcado para reprocessamento", doc.title || doc.document_number);
    toast.success("Documento será reprocessado");
  };

  const handleRemoveFile = async (id: string) => {
    const doc = documents?.find(d => d.id === id);
    await deleteDocument.mutateAsync(id);
    addEvent("warning", "Documento removido do lote", doc?.title || doc?.document_number);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!batchId) return;

    const channel = supabase
      .channel(`ocr-processing-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scanned_documents',
          filter: `batch_id=eq.${batchId}`,
        },
        (payload) => {
          const newDoc = payload.new as ScannedDocument;
          const oldDoc = payload.old as Partial<ScannedDocument>;
          
          if (newDoc.status !== oldDoc.status) {
            const statusLabel = getStatusBadge(newDoc.status as OCRStatus).label;
            addEvent(
              newDoc.status === 'error' ? 'error' : 
              (newDoc.status as string) === 'completed' || (newDoc.status as string) === 'approved' ? 'success' : 'info',
              `Estado alterado para: ${statusLabel}`,
              newDoc.title || newDoc.document_number
            );
          }
          
          queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, queryClient]);

  if (!batchId) {
    return (
      <DashboardLayout title="Processamento OCR" subtitle="Reconhecimento óptico de caracteres">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">Nenhum lote selecionado.</p>
          <Button onClick={() => navigate('/digitization')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Centro de Digitalização
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isProcessing = batch?.status === 'processing';
  const isPaused = batch?.status === 'paused';

  return (
    <DashboardLayout 
      title="Processamento OCR" 
      subtitle={batch ? `Lote: ${batch.batch_number} • ${batch.name}` : "A carregar..."}
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/digitization')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button onClick={handleProcessAllPending} disabled={processOcr.isPending}>
                <Wand2 className="h-4 w-4 mr-2" />
                Processar Todos ({pendingCount})
              </Button>
            )}
            {isProcessing ? (
              <Button variant="outline" onClick={handlePauseBatch}>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            ) : isPaused ? (
              <Button onClick={handleResumeBatch}>
                <Play className="h-4 w-4 mr-2" />
                Retomar
              </Button>
            ) : null}
          </div>
        </div>

        {/* Batch Progress */}
        {isLoading ? (
          <Card>
            <CardContent className="py-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Progresso do Lote</CardTitle>
                  <CardDescription>
                    {completedCount} de {totalCount} ficheiros processados
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
                  <div className="h-2.5 w-2.5 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Em revisão: {reviewCount}</span>
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
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* File List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Ficheiros em Processamento</CardTitle>
                    <CardDescription>Lista de documentos submetidos para OCR</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue placeholder="Filtrar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos ({totalCount})</SelectItem>
                        <SelectItem value="pending">Pendentes ({pendingCount})</SelectItem>
                        <SelectItem value="processing">Em processamento ({processingCount})</SelectItem>
                        <SelectItem value="quality_review">Em revisão ({reviewCount})</SelectItem>
                        <SelectItem value="completed">Concluídos ({completedCount})</SelectItem>
                        <SelectItem value="error">Com erros ({errorCount})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum documento encontrado</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredDocuments.map((doc) => {
                        const statusBadge = getStatusBadge(doc.status as OCRStatus);
                        const isExpanded = expandedFiles.has(doc.id);
                        const isDocProcessing = processingDocIds.has(doc.id);
                        const isLowQuality = doc.ocr_confidence !== null && doc.ocr_confidence < 85;

                        return (
                          <div key={doc.id} className="p-4">
                            {/* Low Quality Warning */}
                            {isLowQuality && doc.status !== "pending" && (
                              <Alert className="mb-3 border-warning/50 bg-warning/5">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                <AlertTitle className="text-warning text-sm">
                                  Qualidade de OCR Baixa
                                </AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                  Confiança de {doc.ocr_confidence}% - Considere redigitalizar ou rever manualmente.
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* File Header */}
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {isDocProcessing ? (
                                  <Loader2 className="h-4 w-4 text-info animate-spin" />
                                ) : (
                                  getStatusIcon(doc.status as OCRStatus)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-foreground truncate">
                                    {doc.title || doc.document_number}
                                  </span>
                                  <Badge variant="outline" className={cn("text-xs", statusBadge.className)}>
                                    {isDocProcessing ? "A processar..." : statusBadge.label}
                                  </Badge>
                                </div>

                                {/* Progress bar for processing files */}
                                {isDocProcessing && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                      <span>A processar OCR...</span>
                                    </div>
                                    <Progress value={undefined} className="h-1.5" />
                                  </div>
                                )}

                                {/* Completed file info */}
                                {((doc.status as string) === "completed" || (doc.status as string) === "approved" || doc.status === "quality_review") && doc.ocr_confidence !== null && (
                                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                    {doc.detected_language && (
                                      <div className="flex items-center gap-1">
                                        <Languages className="h-3.5 w-3.5" />
                                        <span>{doc.detected_language}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <span className={cn(
                                        doc.ocr_confidence >= 95 ? "text-success" :
                                        doc.ocr_confidence >= 85 ? "text-warning" :
                                        "text-destructive"
                                      )}>
                                        Confiança: {doc.ocr_confidence}%
                                      </span>
                                    </div>
                                    {doc.updated_at && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{format(new Date(doc.updated_at), "dd/MM HH:mm")}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Extracted Text Preview */}
                                {doc.ocr_text && (
                                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(doc.id)}>
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
                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-auto">
                                          {doc.ocr_text}
                                        </p>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}

                                {/* Actions */}
                                <div className="mt-3 flex items-center gap-2">
                                  {doc.status === "pending" && doc.file_path && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => handleProcessOcr(doc)}
                                      disabled={isDocProcessing}
                                    >
                                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                                      Processar OCR
                                    </Button>
                                  )}
                                  {doc.status === "error" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => handleRetryOcr(doc)}
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                      Repetir OCR
                                    </Button>
                                  )}
                                  {doc.status === "quality_review" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => navigate(`/quality-review?batchId=${batchId}`)}
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      Rever Documento
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveFile(doc.id)}
                                    disabled={isDocProcessing}
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
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Event Log & Language Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registo de Eventos</CardTitle>
                <CardDescription>Histórico de actividade OCR</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {events.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      Nenhum evento registado ainda
                    </div>
                  ) : (
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
                  )}
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
                {Object.keys(languageStats).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum idioma detectado ainda</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(languageStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([lang, count], index) => (
                        <div key={lang}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{lang}</span>
                            {index === 0 && lang !== "Não detectado" && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                                Prioritário
                              </Badge>
                            )}
                            {lang === "Não detectado" && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                                {count} ficheiro{count !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          {index === 0 && <Separator className="mt-2" />}
                          <div className="text-xs text-muted-foreground mt-1">
                            <div className="flex justify-between">
                              <span>{lang}</span>
                              <span>{count} ficheiro{count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Acções Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-9"
                  onClick={() => navigate(`/quality-review?batchId=${batchId}`)}
                  disabled={reviewCount === 0 && completedCount === 0 && documents?.length === 0}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ir para Revisão de Qualidade
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-9"
                  onClick={() => navigate('/digitization')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Centro de Digitalização
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OCRProcessing;
