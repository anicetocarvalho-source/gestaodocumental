import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Contrast,
  History,
  Clock,
  User,
  Calendar,
  Building2,
  FileType,
  HardDrive,
  Eye,
  Printer,
  Copy,
  Paperclip,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ClassificationPanel } from "@/components/documents/ClassificationPanel";
import { useDocument } from "@/hooks/useDocuments";
import { useDownloadFile, useGetFileUrl } from "@/hooks/useFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "secondary" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  registered: { label: "Registado", variant: "info" },
  in_progress: { label: "Em Tramitação", variant: "info" },
  dispatched: { label: "Despachado", variant: "info" },
  pending_approval: { label: "Aguarda Aprovação", variant: "warning" },
  validated: { label: "Validado", variant: "success" },
  signed: { label: "Assinado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "error" },
  archived: { label: "Arquivado", variant: "secondary" },
};

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: doc, isLoading, error } = useDocument(id);

  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contrastMode, setContrastMode] = useState<"normal" | "high" | "inverted">("normal");
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [savingClassification, setSavingClassification] = useState(false);

  const getFileUrl = useGetFileUrl();
  const downloadFile = useDownloadFile();

  const files = useMemo(() => (doc?.files ?? []) as any[], [doc]);
  const movements = useMemo(
    () =>
      [...((doc?.movements ?? []) as any[])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [doc]
  );

  const selectedFile = useMemo(() => {
    if (!files.length) return null;
    return files.find((f) => f.id === selectedFileId) || files.find((f) => f.is_main_file) || files[0];
  }, [files, selectedFileId]);

  useEffect(() => {
    let cancelled = false;
    setPreviewUrl(null);
    setPreviewError(null);

    if (!selectedFile?.file_path) return;

    setPreviewLoading(true);
    getFileUrl(selectedFile.file_path)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch((e: Error) => {
        if (!cancelled) setPreviewError(e.message);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.file_path]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);

  const getContrastStyle = () => {
    switch (contrastMode) {
      case "high":
        return "contrast-125 brightness-110";
      case "inverted":
        return "invert";
      default:
        return "";
    }
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    downloadFile.mutate({ filePath: selectedFile.file_path, fileName: selectedFile.file_name });
  };

  const handlePrint = () => {
    if (!previewUrl) {
      toast({
        title: "Sem ficheiro para imprimir",
        description: "Este documento não tem ficheiro associado.",
        variant: "destructive",
      });
      return;
    }
    const win = window.open(previewUrl, "_blank");
    if (win) {
      win.addEventListener("load", () => win.print());
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Ligação copiada", description: "O endereço deste documento foi copiado." });
  };

  const handleClassificationSaved = async (code: string) => {
    if (!id) return;
    setSavingClassification(true);
    try {
      const { data: classification } = await supabase
        .from("classification_codes")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!classification) {
        toast({
          title: "Código não encontrado",
          description: `O código ${code} não existe no plano de classificação da organização.`,
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from("documents")
        .update({ classification_id: classification.id })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({ title: "Classificação aplicada", description: `Documento classificado como ${code}.` });
    } catch (e) {
      toast({
        title: "Erro ao guardar classificação",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSavingClassification(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Visualizador de Documento">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !doc) {
    return (
      <DashboardLayout title="Visualizador de Documento">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Documento não encontrado ou sem permissão de acesso.
            </p>
            <Link to="/documents">
              <Button variant="outline" size="sm">Voltar à lista</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const status = statusConfig[doc.status as string] || { label: doc.status, variant: "secondary" as const };
  const isPdf = selectedFile?.mime_type?.includes("pdf");
  const isImage = selectedFile?.mime_type?.startsWith("image/");

  return (
    <DashboardLayout title="Visualizador de Documento" subtitle={doc.entry_number || doc.title}>
      <PageBreadcrumb
        items={[
          { label: "Documentos", href: "/documents" },
          { label: doc.entry_number || "Documento", href: `/documents/${doc.id}` },
          { label: "Visualizar" },
        ]}
      />

      <div className={`grid grid-cols-1 ${isFullscreen ? "" : "lg:grid-cols-12"} gap-4`}>
        {/* Left Panel - Metadata */}
        {!isFullscreen && (
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Metadados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Título</span>
                  </div>
                  <p className="font-medium pl-5">{doc.title}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileType className="h-3.5 w-3.5" />
                    <span>Tipo</span>
                  </div>
                  <p className="font-medium pl-5">{(doc as any).document_type?.name || "-"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>Ficheiro</span>
                  </div>
                  <p className="font-medium pl-5">
                    {selectedFile
                      ? `${selectedFile.mime_type?.split("/")[1]?.toUpperCase() || "FILE"} • ${formatFileSize(selectedFile.file_size)}`
                      : "Sem ficheiro"}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Unidade actual</span>
                  </div>
                  <p className="font-medium pl-5">{(doc as any).current_unit?.name || "-"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Classificação</span>
                  </div>
                  <p className="font-medium pl-5">
                    {(doc as any).classification
                      ? `${(doc as any).classification.code} — ${(doc as any).classification.name}`
                      : "Não classificado"}
                  </p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Responsável</span>
                  </div>
                  <p className="font-medium pl-5">{(doc as any).responsible_user?.full_name || "-"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Entrada</span>
                  </div>
                  <p className="font-medium pl-5">
                    {doc.entry_date ? format(new Date(doc.entry_date), "dd MMM yyyy", { locale: pt }) : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {files.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Ficheiros ({files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {files.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFileId(f.id)}
                      className={`w-full text-left text-xs px-2 py-2 rounded-md truncate transition-colors ${
                        selectedFile?.id === f.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                      }`}
                    >
                      {f.file_name}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Center - Viewer */}
        <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-6"} space-y-3`}>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon-sm" onClick={handleZoomOut} disabled={zoom <= 50} aria-label="Diminuir zoom">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={50}
                      max={200}
                      step={25}
                      className="w-20"
                      aria-label="Nível de zoom"
                    />
                    <span className="text-sm font-medium w-12">{zoom}%</span>
                  </div>
                  <Button variant="outline" size="icon-sm" onClick={handleZoomIn} disabled={zoom >= 200} aria-label="Aumentar zoom">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon-sm" onClick={handleRotateLeft} aria-label="Rodar para a esquerda">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={handleRotateRight} aria-label="Rodar para a direita">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    aria-label={isFullscreen ? "Sair do modo ecrã inteiro" : "Modo ecrã inteiro"}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Contraste:</span>
                  <Button variant={contrastMode === "normal" ? "default" : "outline"} size="icon-sm" onClick={() => setContrastMode("normal")} aria-label="Contraste normal" title="Normal">
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button variant={contrastMode === "high" ? "default" : "outline"} size="icon-sm" onClick={() => setContrastMode("high")} aria-label="Alto contraste" title="Alto contraste">
                    <Contrast className="h-4 w-4" />
                  </Button>
                  <Button variant={contrastMode === "inverted" ? "default" : "outline"} size="icon-sm" onClick={() => setContrastMode("inverted")} aria-label="Cores invertidas" title="Invertido">
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isFullscreen ? "min-h-[calc(100vh-300px)]" : "min-h-[500px]"} overflow-auto`}>
            <CardContent className="p-0 h-full flex items-center justify-center bg-muted/30 min-h-[500px]">
              {!selectedFile ? (
                <div className="text-center space-y-2 py-16">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Este documento não tem ficheiro anexado.</p>
                </div>
              ) : previewLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : previewError ? (
                <div className="text-center space-y-2 py-16">
                  <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Não foi possível carregar o ficheiro.</p>
                </div>
              ) : (
                <div
                  className={`w-full h-full transition-all duration-300 ${getContrastStyle()}`}
                  style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: "center center" }}
                >
                  {isPdf && previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={selectedFile.file_name}
                      className="w-full h-[70vh] min-h-[500px] border-0 bg-background"
                    />
                  ) : isImage && previewUrl ? (
                    <img src={previewUrl} alt={selectedFile.file_name} className="mx-auto max-h-[70vh] object-contain" />
                  ) : (
                    <div className="text-center space-y-3 py-16">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Pré-visualização não disponível para {selectedFile.mime_type || "este formato"}.
                      </p>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Descarregar ficheiro
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Actions */}
        {!isFullscreen && (
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Acções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="default" onClick={handleDownload} disabled={!selectedFile || downloadFile.isPending}>
                  {downloadFile.isPending ? <Loader2 className="h-4 w-4 mr-3 animate-spin" /> : <Download className="h-4 w-4 mr-3" />}
                  Descarregar
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handlePrint} disabled={!previewUrl}>
                  <Printer className="h-4 w-4 mr-3" />
                  Imprimir
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-3" />
                  Copiar Ligação
                </Button>
              </CardContent>
            </Card>

            <ClassificationPanel
              documentId={doc.id}
              currentClassification={(doc as any).classification?.code}
              compact={true}
              onClassificationSaved={handleClassificationSaved}
            />
            {savingClassification && (
              <p className="text-xs text-muted-foreground">A guardar classificação...</p>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Estado do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {doc.updated_at ? format(new Date(doc.updated_at), "dd MMM yyyy", { locale: pt }) : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ligações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={`/documents/${doc.id}`}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
                <Link to="/documents">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar à Lista
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Panel - Files & Movements */}
      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => setShowBottomPanel(!showBottomPanel)} className="mb-2">
          {showBottomPanel ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronUp className="h-4 w-4 mr-2" />}
          {showBottomPanel ? "Ocultar" : "Mostrar"} Histórico
        </Button>

        {showBottomPanel && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Ficheiros do Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sem ficheiros anexados.</p>
                ) : (
                  <div className="space-y-3">
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          selectedFile?.id === f.id ? "border-primary bg-primary-muted" : "border-border"
                        }`}
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{f.file_name}</span>
                            {f.is_main_file && <Badge variant="info" className="text-xs">Principal</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(f.file_size)} • {format(new Date(f.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedFileId(f.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile.mutate({ filePath: f.file_path, fileName: f.file_name })}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Histórico de Movimentos
                  </CardTitle>
                  <Link to="/audit-logs">
                    <Button variant="link" size="sm" className="text-xs h-auto p-0">
                      Ver auditoria
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sem movimentos registados.</p>
                ) : (
                  <div className="space-y-2">
                    {movements.slice(0, 10).map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium capitalize truncate">{m.action_type}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {m.from_unit?.name || "-"} → {m.to_unit?.name || "-"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(m.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentViewer;
