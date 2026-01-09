import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  FileText,
  Maximize2,
  Download,
  Loader2,
  ImageOff,
  Save,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getScannedDocumentUrl, useDownloadScannedDocument } from "@/hooks/useScannedDocumentUpload";
import { toast } from "sonner";

interface ScannedDocument {
  id: string;
  document_number: string;
  title: string | null;
  status: string;
  file_path: string | null;
  ocr_text: string | null;
  quality_score: number | null;
  priority: string;
  page_count: number;
  metadata: Record<string, unknown> | null;
  rejection_reason: string | null;
}

interface BatchInfo {
  id: string;
  batch_number: string;
  name: string;
  total_pages: number;
}

const classificationOptions = [
  { value: "confidencial", label: "Confidencial" },
  { value: "interno", label: "Interno" },
  { value: "publico", label: "Público" },
  { value: "reservado", label: "Reservado" },
];

const documentTypes = [
  { value: "oficio", label: "Ofício" },
  { value: "memorando", label: "Memorando" },
  { value: "relatorio", label: "Relatório" },
  { value: "contrato", label: "Contrato" },
  { value: "factura", label: "Factura" },
  { value: "outro", label: "Outro" },
];

const QualityReview = () => {
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');
  
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRejectDocumentDialog, setShowRejectDocumentDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [documentRejectReason, setDocumentRejectReason] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isApprovingDocument, setIsApprovingDocument] = useState(false);
  const [isRejectingDocument, setIsRejectingDocument] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  const queryClient = useQueryClient();
  const downloadDocument = useDownloadScannedDocument();

  // Metadata state
  const [metadata, setMetadata] = useState({
    titulo: "",
    autor: "",
    dataDocumento: "",
    numeroReferencia: "",
    descricao: "",
    classificacao: "interno",
    tipoDocumento: "outro",
  });

  // Fetch batch info
  const { data: batch } = useQuery({
    queryKey: ['batch-info', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const { data, error } = await supabase
        .from('digitization_batches')
        .select('id, batch_number, name, total_pages')
        .eq('id', batchId)
        .single();
      
      if (error) throw error;
      return data as BatchInfo;
    },
    enabled: !!batchId,
  });

  // Fetch documents in batch
  const { data: documents, isLoading } = useQuery({
    queryKey: ['batch-documents', batchId],
    queryFn: async () => {
      if (!batchId) return [];
      const { data, error } = await supabase
        .from('scanned_documents')
        .select('id, document_number, title, status, file_path, ocr_text, quality_score, priority, page_count, metadata, rejection_reason')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ScannedDocument[];
    },
    enabled: !!batchId,
  });

  // Filter documents based on status
  const filteredDocuments = documents?.filter(doc => {
    if (statusFilter === "all") return true;
    return doc.status === statusFilter;
  });

  // Get selected document
  const selectedDocument = documents?.find(d => d.id === selectedDocumentId) || filteredDocuments?.[0];

  // Select first document when documents load or filter changes
  useEffect(() => {
    if (filteredDocuments && filteredDocuments.length > 0) {
      const isCurrentInFilter = filteredDocuments.some(d => d.id === selectedDocumentId);
      if (!selectedDocumentId || !isCurrentInFilter) {
        setSelectedDocumentId(filteredDocuments[0].id);
      }
    }
  }, [filteredDocuments, selectedDocumentId]);

  // Update metadata when document changes
  useEffect(() => {
    if (selectedDocument) {
      const docMetadata = selectedDocument.metadata as Record<string, string> | null;
      const newMetadata = {
        titulo: selectedDocument.title || "",
        autor: docMetadata?.autor || "",
        dataDocumento: docMetadata?.dataDocumento || "",
        numeroReferencia: selectedDocument.document_number || "",
        descricao: docMetadata?.descricao || selectedDocument.ocr_text?.substring(0, 200) || "",
        classificacao: docMetadata?.classificacao || "interno",
        tipoDocumento: docMetadata?.tipoDocumento || "outro",
      };
      setMetadata(newMetadata);
      const existingTags = Array.isArray(docMetadata?.tags) ? docMetadata.tags as string[] : [];
      setTags(existingTags.length > 0 ? existingTags : [selectedDocument.document_number]);
      
      // Reset save state when document changes
      lastSavedRef.current = JSON.stringify({ metadata: newMetadata, tags: existingTags });
      setHasUnsavedChanges(false);
    }
  }, [selectedDocument?.id]);

  // Auto-save function
  const saveMetadata = useCallback(async () => {
    if (!selectedDocument) return;
    
    const currentState = JSON.stringify({ metadata, tags });
    if (currentState === lastSavedRef.current) return;
    
    setIsSaving(true);
    try {
      const updatedMetadata = {
        ...(selectedDocument.metadata as Record<string, unknown> || {}),
        titulo: metadata.titulo,
        autor: metadata.autor,
        dataDocumento: metadata.dataDocumento,
        descricao: metadata.descricao,
        classificacao: metadata.classificacao,
        tipoDocumento: metadata.tipoDocumento,
        tags: tags,
      };

      const { error } = await supabase
        .from('scanned_documents')
        .update({ 
          title: metadata.titulo || selectedDocument.title,
          metadata: updatedMetadata,
        })
        .eq('id', selectedDocument.id);
      
      if (error) throw error;
      
      lastSavedRef.current = currentState;
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['batch-documents', batchId] });
    } catch (error) {
      console.error('Error saving metadata:', error);
      toast.error('Erro ao guardar metadados');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDocument, metadata, tags, batchId, queryClient]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!selectedDocument) return;
    
    const currentState = JSON.stringify({ metadata, tags });
    if (currentState !== lastSavedRef.current) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (2 seconds after last change)
      saveTimeoutRef.current = setTimeout(() => {
        saveMetadata();
      }, 2000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [metadata, tags, selectedDocument, saveMetadata]);

  // Load image URLs for documents with file paths
  useEffect(() => {
    const loadImageUrls = async () => {
      if (!documents) return;

      for (const doc of documents) {
        if (doc.file_path && !imageUrls[doc.id] && !loadingImages[doc.id]) {
          setLoadingImages(prev => ({ ...prev, [doc.id]: true }));
          
          try {
            const url = await getScannedDocumentUrl(doc.file_path);
            if (url) {
              setImageUrls(prev => ({ ...prev, [doc.id]: url }));
              setImageErrors(prev => ({ ...prev, [doc.id]: false }));
            } else {
              setImageErrors(prev => ({ ...prev, [doc.id]: true }));
            }
          } catch {
            setImageErrors(prev => ({ ...prev, [doc.id]: true }));
          } finally {
            setLoadingImages(prev => ({ ...prev, [doc.id]: false }));
          }
        }
      }
    };

    loadImageUrls();
  }, [documents]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleApproveBatch = async () => {
    if (!batchId) return;
    
    try {
      await supabase
        .from('digitization_batches')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', batchId);
      
      await supabase
        .from('scanned_documents')
        .update({ status: 'approved' })
        .eq('batch_id', batchId);
      
      toast.success('Lote aprovado com sucesso');
    } catch (error) {
      toast.error('Erro ao aprovar lote');
    }
  };

  const handleRejectBatch = async () => {
    if (!batchId || !rejectReason.trim()) return;
    
    try {
      await supabase
        .from('digitization_batches')
        .update({ status: 'rejected', notes: rejectReason })
        .eq('id', batchId);
      
      await supabase
        .from('scanned_documents')
        .update({ status: 'rejected', rejection_reason: rejectReason })
        .eq('batch_id', batchId);
      
      toast.success('Lote rejeitado');
      setShowRejectDialog(false);
      setRejectReason("");
    } catch (error) {
      toast.error('Erro ao rejeitar lote');
    }
  };

  const handleDownload = () => {
    if (selectedDocument?.file_path && selectedDocument.title) {
      downloadDocument.mutate({
        filePath: selectedDocument.file_path,
        fileName: selectedDocument.title + (selectedDocument.file_path.split('.').pop() ? '.' + selectedDocument.file_path.split('.').pop() : ''),
      });
    }
  };

  const handleApproveDocument = async () => {
    if (!selectedDocument) return;
    
    setIsApprovingDocument(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save metadata along with approval
      const updatedMetadata = {
        ...(selectedDocument.metadata as Record<string, unknown> || {}),
        titulo: metadata.titulo,
        autor: metadata.autor,
        dataDocumento: metadata.dataDocumento,
        descricao: metadata.descricao,
        classificacao: metadata.classificacao,
        tipoDocumento: metadata.tipoDocumento,
        tags: tags,
      };

      const { error } = await supabase
        .from('scanned_documents')
        .update({ 
          status: 'approved',
          title: metadata.titulo || selectedDocument.title,
          metadata: updatedMetadata,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedDocument.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['batch-documents', batchId] });
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Documento aprovado com sucesso');
      
      // Navigate to next document if available
      if (filteredDocuments && currentIndex < filteredDocuments.length - 1) {
        setSelectedDocumentId(filteredDocuments[currentIndex + 1].id);
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Erro ao aprovar documento');
    } finally {
      setIsApprovingDocument(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedDocument || !documentRejectReason.trim()) return;
    
    setIsRejectingDocument(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('scanned_documents')
        .update({ 
          status: 'rejected',
          rejection_reason: documentRejectReason,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedDocument.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['batch-documents', batchId] });
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['digitization-stats'] });
      toast.success('Documento rejeitado');
      setShowRejectDocumentDialog(false);
      setDocumentRejectReason("");
      
      // Navigate to next document if available
      if (filteredDocuments && currentIndex < filteredDocuments.length - 1) {
        setSelectedDocumentId(filteredDocuments[currentIndex + 1].id);
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Erro ao rejeitar documento');
    } finally {
      setIsRejectingDocument(false);
    }
  };

  const navigateDocument = (direction: "prev" | "next") => {
    if (!filteredDocuments || !selectedDocument) return;
    const currentIdx = filteredDocuments.findIndex(d => d.id === selectedDocument.id);
    if (direction === "prev" && currentIdx > 0) {
      setSelectedDocumentId(filteredDocuments[currentIdx - 1].id);
      setRotation(0);
    } else if (direction === "next" && currentIdx < filteredDocuments.length - 1) {
      setSelectedDocumentId(filteredDocuments[currentIdx + 1].id);
      setRotation(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/20 border-emerald-500";
      case "rejected": return "bg-destructive/20 border-destructive";
      case "completed": return "bg-emerald-500/20 border-emerald-500";
      default: return "bg-muted border-border";
    }
  };

  const currentIndex = filteredDocuments?.findIndex(d => d.id === selectedDocument?.id) ?? 0;

  if (!batchId) {
    return (
      <DashboardLayout title="Revisão de Qualidade" subtitle="Seleccione um lote para revisar">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum lote seleccionado. Volte ao Centro de Digitalização para seleccionar um lote.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Revisão de Qualidade" 
      subtitle={batch ? `Lote: ${batch.batch_number} • ${batch.name} • ${documents?.length || 0} documento(s)` : "A carregar..."}
    >
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => setShowRejectDialog(true)}
            >
              <X className="h-4 w-4 mr-2" />
              Rejeitar Lote
            </Button>
            <Button onClick={handleApproveBatch} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4 mr-2" />
              Aprovar Lote
            </Button>
          </div>
        </div>

        {/* Main Content - Three Panel Layout */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
          {/* Left Panel - Thumbnails */}
          <Card className="col-span-2 flex flex-col">
            <CardHeader className="py-3 px-4 space-y-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos ({documents?.length || 0})</SelectItem>
                  <SelectItem value="pending">Pendentes ({documents?.filter(d => d.status === 'pending').length || 0})</SelectItem>
                  <SelectItem value="approved">Aprovados ({documents?.filter(d => d.status === 'approved').length || 0})</SelectItem>
                  <SelectItem value="rejected">Rejeitados ({documents?.filter(d => d.status === 'rejected').length || 0})</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="w-full aspect-[3/4]" />
                    ))
                  ) : filteredDocuments?.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum documento encontrado
                    </p>
                  ) : filteredDocuments?.map((doc, index) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocumentId(doc.id);
                        setRotation(0);
                      }}
                      className={cn(
                        "w-full p-2 rounded-lg border-2 transition-all hover:border-primary/50",
                        selectedDocument?.id === doc.id 
                          ? "border-primary bg-primary/5" 
                          : getStatusColor(doc.status)
                      )}
                    >
                      <div className="aspect-[3/4] bg-muted rounded mb-2 flex items-center justify-center overflow-hidden relative">
                        {loadingImages[doc.id] ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : imageUrls[doc.id] && !imageErrors[doc.id] ? (
                          <img
                            src={imageUrls[doc.id]}
                            alt={doc.title || `Documento ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={() => setImageErrors(prev => ({ ...prev, [doc.id]: true }))}
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[80%]">
                          {doc.title || `Doc. ${index + 1}`}
                        </span>
                        {doc.status === "approved" && (
                          <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        )}
                        {doc.status === "rejected" && (
                          <X className="h-3 w-3 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Center Panel - Document Viewer */}
          <Card className="col-span-6 flex flex-col">
            <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => navigateDocument("prev")}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Documento {currentIndex + 1} de {filteredDocuments?.length || 0}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => navigateDocument("next")}
                  disabled={!filteredDocuments || currentIndex === filteredDocuments.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRotateLeft}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRotateRight}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleDownload}
                  disabled={!selectedDocument?.file_path || downloadDocument.isPending}
                >
                  {downloadDocument.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-auto bg-muted/30">
              <div className="h-full flex items-center justify-center">
                {selectedDocument && loadingImages[selectedDocument.id] ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">A carregar imagem...</p>
                  </div>
                ) : selectedDocument && imageUrls[selectedDocument.id] && !imageErrors[selectedDocument.id] ? (
                  <div 
                    className="transition-transform"
                    style={{ 
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "center center"
                    }}
                  >
                    <img
                      src={imageUrls[selectedDocument.id]}
                      alt={selectedDocument.title || "Documento digitalizado"}
                      className="max-w-full max-h-[calc(100vh-20rem)] shadow-lg rounded-lg"
                      onError={() => setImageErrors(prev => ({ ...prev, [selectedDocument.id]: true }))}
                    />
                  </div>
                ) : (
                  <div 
                    className="bg-background shadow-lg rounded-lg overflow-hidden transition-transform"
                    style={{ 
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "center center"
                    }}
                  >
                    <div className="w-[500px] aspect-[3/4] flex items-center justify-center bg-card border">
                      <div className="text-center text-muted-foreground">
                        {imageErrors[selectedDocument?.id || ''] ? (
                          <>
                            <ImageOff className="h-16 w-16 mx-auto mb-4" />
                            <p className="text-sm">Erro ao carregar imagem</p>
                            <p className="text-xs">Ficheiro indisponível</p>
                          </>
                        ) : (
                          <>
                            <FileText className="h-16 w-16 mx-auto mb-4" />
                            <p className="text-sm">Documento Digitalizado</p>
                            <p className="text-xs">{selectedDocument?.title || "Sem título"}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Metadata & Tags */}
          <Card className="col-span-4 flex flex-col">
            <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Metadados do Documento</CardTitle>
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>A guardar...</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-500">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Alterações pendentes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                    <Check className="h-3 w-3" />
                    <span>Guardado</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {/* OCR Quality Score */}
                  {selectedDocument?.quality_score && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Qualidade OCR</span>
                        <Badge variant={selectedDocument.quality_score > 80 ? "default" : selectedDocument.quality_score > 50 ? "secondary" : "destructive"}>
                          {selectedDocument.quality_score}%
                        </Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            selectedDocument.quality_score > 80 ? "bg-emerald-500" : 
                            selectedDocument.quality_score > 50 ? "bg-amber-500" : "bg-destructive"
                          )}
                          style={{ width: `${selectedDocument.quality_score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input 
                      id="titulo" 
                      value={metadata.titulo}
                      onChange={(e) => setMetadata({...metadata, titulo: e.target.value})}
                    />
                  </div>

                  {/* Autor */}
                  <div className="space-y-2">
                    <Label htmlFor="autor">Autor / Origem</Label>
                    <Input 
                      id="autor" 
                      value={metadata.autor}
                      onChange={(e) => setMetadata({...metadata, autor: e.target.value})}
                    />
                  </div>

                  {/* Data do Documento */}
                  <div className="space-y-2">
                    <Label htmlFor="dataDocumento">Data do Documento</Label>
                    <Input 
                      id="dataDocumento" 
                      type="date"
                      value={metadata.dataDocumento}
                      onChange={(e) => setMetadata({...metadata, dataDocumento: e.target.value})}
                    />
                  </div>

                  {/* Número de Referência */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroReferencia">Nº de Referência</Label>
                    <Input 
                      id="numeroReferencia" 
                      value={metadata.numeroReferencia}
                      onChange={(e) => setMetadata({...metadata, numeroReferencia: e.target.value})}
                      readOnly
                    />
                  </div>

                  {/* Tipo de Documento */}
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select 
                      value={metadata.tipoDocumento}
                      onValueChange={(value) => setMetadata({...metadata, tipoDocumento: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Classificação */}
                  <div className="space-y-2">
                    <Label>Classificação</Label>
                    <Select 
                      value={metadata.classificacao}
                      onValueChange={(value) => setMetadata({...metadata, classificacao: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar classificação" />
                      </SelectTrigger>
                      <SelectContent>
                        {classificationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição / Texto OCR</Label>
                    <Textarea 
                      id="descricao" 
                      rows={4}
                      value={metadata.descricao}
                      onChange={(e) => setMetadata({...metadata, descricao: e.target.value})}
                      placeholder={selectedDocument?.ocr_text ? "Texto extraído via OCR..." : "Descrição do documento..."}
                    />
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nova etiqueta..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      />
                      <Button variant="outline" size="icon" onClick={handleAddTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Suggested Tags based on OCR */}
                  {selectedDocument?.ocr_text && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Sugestões IA</Label>
                      <div className="flex flex-wrap gap-2">
                        {["digitalizado", "ocr-processado", selectedDocument.priority].filter(Boolean).map((suggestion) => (
                          <Badge 
                            key={suggestion}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 border-dashed"
                            onClick={() => !tags.includes(suggestion) && setTags([...tags, suggestion])}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Document Status */}
                  {selectedDocument && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Estado do Documento</span>
                        <Badge 
                          variant={
                            selectedDocument.status === 'approved' ? 'default' : 
                            selectedDocument.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                          className={selectedDocument.status === 'approved' ? 'bg-emerald-500' : ''}
                        >
                          {selectedDocument.status === 'approved' ? 'Aprovado' : 
                           selectedDocument.status === 'rejected' ? 'Rejeitado' : 
                           'Pendente'}
                        </Badge>
                      </div>
                      {selectedDocument.status === 'rejected' && selectedDocument.rejection_reason && (
                        <p className="text-xs text-destructive mt-2">
                          Motivo: {selectedDocument.rejection_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Document Actions */}
                  <div className="space-y-2">
                    <Label>Acções do Documento</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleApproveDocument}
                        disabled={isApprovingDocument || selectedDocument?.status === 'approved'}
                      >
                        {isApprovingDocument ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {selectedDocument?.status === 'approved' ? 'Aprovado' : 'Aprovar'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setShowRejectDocumentDialog(true)}
                        disabled={selectedDocument?.status === 'rejected'}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {selectedDocument?.status === 'rejected' ? 'Rejeitado' : 'Rejeitar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Lote</DialogTitle>
            <DialogDescription>
              Indique o motivo da rejeição do lote. Esta informação será enviada ao operador responsável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Motivo da Rejeição</Label>
              <Textarea
                id="rejectReason"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivos Frequentes</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Qualidade de imagem insuficiente",
                  "Páginas em falta",
                  "Ordem incorrecta",
                  "Documento ilegível",
                  "Metadados incorrectos"
                ].map((reason) => (
                  <Badge
                    key={reason}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setRejectReason(reason)}
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectBatch}
              disabled={!rejectReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={showRejectDocumentDialog} onOpenChange={setShowRejectDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Documento</DialogTitle>
            <DialogDescription>
              Indique o motivo da rejeição deste documento específico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentRejectReason">Motivo da Rejeição</Label>
              <Textarea
                id="documentRejectReason"
                placeholder="Descreva o motivo da rejeição..."
                value={documentRejectReason}
                onChange={(e) => setDocumentRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivos Frequentes</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Imagem ilegível",
                  "Documento incompleto",
                  "Má qualidade de digitalização",
                  "Páginas cortadas",
                  "Metadados incorrectos"
                ].map((reason) => (
                  <Badge
                    key={reason}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setDocumentRejectReason(reason)}
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDocumentDialog(false);
              setDocumentRejectReason("");
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectDocument}
              disabled={!documentRejectReason.trim() || isRejectingDocument}
            >
              {isRejectingDocument ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default QualityReview;
