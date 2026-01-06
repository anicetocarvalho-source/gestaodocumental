import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useDocument } from "@/hooks/useDocuments";
import { useCreateComment } from "@/hooks/useDocumentActions";
import { useDownloadFile, useUploadDocumentFile } from "@/hooks/useFileUpload";
import { 
  documentStatusLabels, 
  documentStatusVariants, 
  documentPriorityLabels,
  confidentialityLabels,
  movementActionLabels
} from "@/types/database";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  Send,
  Forward,
  Archive,
  FolderPlus,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Calendar,
  Building2,
  Tag,
  Paperclip,
  MessageSquare,
  History,
  ChevronRight,
  Eye,
  Trash2,
  Plus,
  FileSignature,
  XCircle,
  FileSearch,
  FolderInput,
  RotateCcw,
  Hash,
  AlertCircle,
  RefreshCw,
  Loader2,
  Shield,
  Upload
} from "lucide-react";
import { ClassificationPanel } from "@/components/documents/ClassificationPanel";
import { DocumentVersionHistory } from "@/components/documents/DocumentVersionHistory";
import { DocumentSignatureModal, SignatureData } from "@/components/documents/DocumentSignatureModal";
import { DocumentWorkflowDrawer, type DocumentAction } from "@/components/documents/DocumentWorkflowDrawer";
import { CreateProcessFromDocumentModal } from "@/components/documents/CreateProcessFromDocumentModal";
import { ProtectedContent } from "@/components/common/ProtectedContent";
import { usePermissions } from "@/hooks/usePermissions";

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [documentSigned, setDocumentSigned] = useState(false);
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DocumentAction | null>(null);
  const [createProcessModalOpen, setCreateProcessModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const { canDo } = usePermissions();
  
  // Carregar dados do documento
  const { data: document, isLoading, error, refetch } = useDocument(id);
  const createComment = useCreateComment();
  const downloadFile = useDownloadFile();
  const uploadFile = useUploadDocumentFile();

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "current":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleSignDocument = (signatureData: SignatureData) => {
    console.log("Documento assinado:", signatureData);
    setDocumentSigned(true);
    toast.success("Documento assinado com sucesso");
  };

  const openActionDrawer = (action: DocumentAction) => {
    setSelectedAction(action);
    setActionDrawerOpen(true);
  };

  const handleActionComplete = (action: DocumentAction, data: Record<string, unknown>) => {
    console.log("Action completed:", action, data);
    refetch();
    toast.success("Acção executada com sucesso");
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !document) return;
    
    setIsSubmittingComment(true);
    try {
      await createComment.mutateAsync({
        document_id: document.id,
        content: newComment.trim(),
        is_internal: isInternalNote,
      });
      setNewComment("");
      setIsInternalNote(false);
      toast.success("Comentário adicionado");
      refetch();
    } catch (error) {
      toast.error("Erro ao adicionar comentário");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      await downloadFile.mutateAsync({ filePath, fileName });
      toast.success("Download iniciado");
    } catch (error) {
      toast.error("Erro ao descarregar ficheiro");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !document) return;

    try {
      for (const file of Array.from(files)) {
        await uploadFile.mutateAsync({
          documentId: document.id,
          file,
          isMainFile: false,
        });
      }
      toast.success("Ficheiro(s) adicionado(s) com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao carregar ficheiro");
    }
    e.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  type WorkflowStatus = "completed" | "current" | "pending";
  
  interface WorkflowStage {
    id: number;
    stage: string;
    status: WorkflowStatus;
    date: string | null;
    user: string | null;
    description: string;
  }

  // Construir workflow stages a partir dos movimentos
  const buildWorkflowStages = (): WorkflowStage[] => {
    if (!document?.movements?.length) {
      return [
        { id: 1, stage: "Recebido", status: "completed", date: document?.entry_date || null, user: "Sistema", description: "Documento registado" },
        { id: 2, stage: "Em Processamento", status: "current", date: null, user: null, description: "Aguardando acções" },
      ];
    }

    const stages: WorkflowStage[] = document.movements
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((mov, index) => ({
        id: index + 1,
        stage: movementActionLabels[mov.action_type] || mov.action_type,
        status: "completed" as WorkflowStatus,
        date: mov.created_at,
        user: mov.to_user?.full_name || mov.to_unit?.name || "Sistema",
        description: mov.notes || mov.dispatch_text || "",
      }));

    // Adicionar estado actual
    stages.push({
      id: stages.length + 1,
      stage: documentStatusLabels[document.status] || document.status,
      status: "current" as WorkflowStatus,
      date: document.updated_at,
      user: document.responsible_user?.full_name || document.current_unit?.name || "",
      description: "Estado actual",
    });

    return stages;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Detalhes do Documento" subtitle="A carregar...">
        <PageBreadcrumb items={[{ label: "Documentos", href: "/documents" }, { label: "A carregar..." }]} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-20 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !document) {
    return (
      <DashboardLayout title="Detalhes do Documento" subtitle="Erro">
        <PageBreadcrumb items={[{ label: "Documentos", href: "/documents" }, { label: "Erro" }]} />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {error ? "Erro ao carregar documento" : "Documento não encontrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {error ? "Não foi possível obter os detalhes do documento." : "O documento solicitado não existe ou foi removido."}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/documents")}>
                Voltar à lista
              </Button>
              {error && (
                <Button onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const workflowStages = buildWorkflowStages();
  const attachments = document.files || [];
  const comments = document.comments || [];
  const movements = document.movements || [];
  const signatures = document.signatures || [];

  return (
    <DashboardLayout 
      title="Detalhes do Documento" 
      subtitle="Visualizar e gerir documento"
    >
      <PageBreadcrumb 
        items={[
          { label: "Documentos", href: "/documents" },
          { label: document.entry_number }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content - 9 columns */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Section 1: Document Metadata Summary */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-14 w-14 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {document.entry_number}
                      </Badge>
                      <Badge variant={documentStatusVariants[document.status] || "secondary"}>
                        {documentStatusLabels[document.status] || document.status}
                      </Badge>
                      {document.priority === "urgent" && (
                        <Badge variant="error">Urgente</Badge>
                      )}
                      {document.priority === "high" && (
                        <Badge variant="warning">Alta Prioridade</Badge>
                      )}
                      {document.confidentiality !== "public" && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {confidentialityLabels[document.confidentiality]}
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-lg font-semibold text-foreground">{document.title}</h1>
                    {document.description && (
                      <p className="text-sm text-muted-foreground">{document.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {attachments.length > 0 && (
                    <Link to={`/documents/${document.id}/view`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => attachments[0] && handleDownloadFile(attachments[0].file_path, attachments[0].file_name)}
                    disabled={attachments.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descarregar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    Tipo
                  </div>
                  <p className="text-sm font-medium">{document.document_type?.name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Origem
                  </div>
                  <p className="text-sm font-medium">{document.origin || document.sender_institution || "—"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Responsável
                  </div>
                  <p className="text-sm font-medium">{document.responsible_user?.full_name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Data de Entrada
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(document.entry_date), "d MMM yyyy", { locale: pt })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Workflow Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fluxo do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex items-start justify-between overflow-x-auto pb-2">
                  {workflowStages.slice(0, 5).map((stage, index) => (
                    <div key={stage.id} className="flex flex-col items-center flex-1 relative min-w-[120px]">
                      {/* Connector line */}
                      {index < Math.min(workflowStages.length, 5) - 1 && (
                        <div 
                          className={`absolute top-3 left-1/2 w-full h-0.5 ${
                            stage.status === "completed" ? "bg-success" : "bg-border"
                          }`}
                        />
                      )}
                      {/* Stage icon */}
                      <div className="relative z-10 bg-background p-1">
                        {getStageIcon(stage.status)}
                      </div>
                      {/* Stage info */}
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          stage.status === "current" ? "text-warning" : 
                          stage.status === "completed" ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {stage.stage}
                        </p>
                        {stage.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(stage.date), "d MMM, HH:mm", { locale: pt })}
                          </p>
                        )}
                        {stage.user && (
                          <p className="text-xs text-muted-foreground">{stage.user}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Attached Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Ficheiros Anexos
                  {attachments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{attachments.length}</Badge>
                  )}
                </CardTitle>
                <ProtectedContent permission={{ module: "documents", action: "addAttachment" }} showDisabled disabledTooltip="Requer permissão de edição para adicionar anexos">
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar Anexo
                    </Button>
                  </div>
                </ProtectedContent>
              </div>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum ficheiro anexo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.mime_type?.split('/')[1]?.toUpperCase() || "FILE"} • {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), "d MMM yyyy", { locale: pt })}
                            {attachment.is_main_file && (
                              <Badge variant="secondary" className="ml-2 text-xs">Principal</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon-sm" aria-label="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          aria-label="Descarregar"
                          onClick={() => handleDownloadFile(attachment.file_path, attachment.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <ProtectedContent permission={{ module: "documents", action: "edit" }} showDisabled disabledTooltip="Requer permissão de edição para remover anexos">
                          <Button variant="ghost" size="icon-sm" aria-label="Remover">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </ProtectedContent>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Movement History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Forward className="h-4 w-4" />
                Histórico de Tramitação
                {movements.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{movements.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Forward className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Sem movimentações registadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((movement) => (
                    <div 
                      key={movement.id}
                      className="flex gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Forward className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{movementActionLabels[movement.action_type] || movement.action_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(movement.created_at), "d MMM yyyy, HH:mm", { locale: pt })}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          {movement.from_unit && (
                            <span className="text-muted-foreground">
                              De: <span className="font-medium text-foreground">{movement.from_unit.name}</span>
                            </span>
                          )}
                          {movement.from_unit && movement.to_unit && <span className="text-muted-foreground"> → </span>}
                          {movement.to_unit && (
                            <span className="text-muted-foreground">
                              Para: <span className="font-medium text-foreground">{movement.to_unit.name}</span>
                            </span>
                          )}
                        </div>
                        {movement.dispatch_text && (
                          <p className="text-sm text-muted-foreground mt-1 italic">"{movement.dispatch_text}"</p>
                        )}
                        {movement.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{movement.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Comments and Internal Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comentários e Notas
                  {comments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{comments.length}</Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Sem comentários</p>
                </div>
              ) : (
                comments
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`flex gap-3 p-3 rounded-lg ${
                      comment.is_internal ? "bg-warning/10 border border-warning/20" : "bg-muted/30"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                      {comment.author?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || "??"}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{comment.author?.full_name || "Utilizador"}</span>
                        {comment.is_internal && (
                          <Badge variant="warning" className="text-xs">Nota Interna</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: pt })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {/* Add Comment/Note */}
              {canDo("documents", "addComment") && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Adicionar comentário ou nota interna..." 
                      className="min-h-[80px]"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={isSubmittingComment}
                      aria-label="Adicionar comentário"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="internal-note" 
                          checked={isInternalNote}
                          onCheckedChange={(checked) => setIsInternalNote(checked as boolean)}
                          disabled={isSubmittingComment}
                        />
                        <label htmlFor="internal-note" className="text-sm text-muted-foreground cursor-pointer">
                          Marcar como nota interna
                        </label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Enviar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Signatures */}
          {signatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Assinaturas
                  <Badge variant="secondary" className="ml-2">{signatures.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {signatures.map((sig) => (
                    <div 
                      key={sig.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${sig.is_valid ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {sig.is_valid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sig.signer?.full_name || "Signatário"}</p>
                          <p className="text-xs text-muted-foreground">
                            {sig.signature_type} • {format(new Date(sig.signed_at), "d MMM yyyy, HH:mm", { locale: pt })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={sig.is_valid ? "success" : "error"}>
                        {sig.is_valid ? "Válida" : "Inválida"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 7: Version History */}
          <DocumentVersionHistory documentId={document.id} />
        </div>

        {/* Sidebar - Actions - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Document Workflow Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acções do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ProtectedContent permission={{ module: "documents", action: "validate" }} showDisabled disabledTooltip="Apenas validadores podem validar documentos">
                <Button 
                  className="w-full justify-start" 
                  variant="success"
                  onClick={() => openActionDrawer("validar")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-3" />
                  Validar
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "documents", action: "reject" }} showDisabled disabledTooltip="Apenas validadores podem rejeitar documentos">
                <Button 
                  className="w-full justify-start" 
                  variant="destructive"
                  onClick={() => openActionDrawer("rejeitar_validacao")}
                >
                  <XCircle className="h-4 w-4 mr-3" />
                  Rejeitar Validação
                </Button>
              </ProtectedContent>
              <Separator className="my-3" />
              <ProtectedContent permission={{ module: "documents", action: "dispatch" }} showDisabled disabledTooltip="Requer permissão de tramitação para despachar">
                <Button 
                  className="w-full justify-start" 
                  variant="default"
                  onClick={() => openActionDrawer("despachar")}
                >
                  <Forward className="h-4 w-4 mr-3" />
                  Despachar
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "documents", action: "requestCorrection" }} showDisabled disabledTooltip="Requer permissão de edição para solicitar correcção">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("solicitar_correcao")}
                >
                  <FileSearch className="h-4 w-4 mr-3" />
                  Solicitar Correcção
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "documents", action: "attachToProcess" }} showDisabled disabledTooltip="Requer permissão de edição para anexar a processo">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("anexar_processo")}
                >
                  <FolderInput className="h-4 w-4 mr-3" />
                  Anexar a Processo
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "documents", action: "returnToOrigin" }} showDisabled disabledTooltip="Requer permissão de tramitação para devolver">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("devolver")}
                >
                  <RotateCcw className="h-4 w-4 mr-3" />
                  Devolver à Origem
                </Button>
              </ProtectedContent>
            </CardContent>
          </Card>

          {/* Secondary Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Outras Acções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ProtectedContent permission={{ module: "documents", action: "sign" }} showDisabled disabledTooltip="Requer permissão de assinatura digital">
                <Button 
                  className="w-full justify-start" 
                  variant={documentSigned || signatures.length > 0 ? "success" : "outline"}
                  onClick={() => setSignatureModalOpen(true)}
                >
                  <FileSignature className="h-4 w-4 mr-3" />
                  {documentSigned || signatures.length > 0 ? "Documento Assinado" : "Assinar Documento"}
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "documents", action: "classify" }} showDisabled disabledTooltip="Requer permissão de classificação documental">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("classificar")}
                >
                  <Tag className="h-4 w-4 mr-3" />
                  Classificar
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "documents", action: "archive" }} showDisabled disabledTooltip="Requer permissão de arquivo para arquivar documentos">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("arquivar")}
                >
                  <Archive className="h-4 w-4 mr-3" />
                  Arquivar
                </Button>
              </ProtectedContent>
              <Separator className="my-3" />
              <ProtectedContent permission={{ module: "documents", action: "createProcess" }} showDisabled disabledTooltip="Requer permissão para criar processos">
                <Button 
                  className="w-full justify-start" 
                  variant="success"
                  onClick={() => setCreateProcessModalOpen(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-3" />
                  Criar Processo
                </Button>
              </ProtectedContent>
            </CardContent>
          </Card>

          {/* Document Classification Panel */}
          <ClassificationPanel 
            documentId={document.id}
            currentClassification={document.classification?.code}
            compact={true}
            onClassificationSaved={(code) => {
              console.log("Classification saved:", code);
              refetch();
            }}
          />

          {/* Document Info Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Assunto</span>
                <span className="text-sm font-medium text-right max-w-[60%] truncate">{document.subject || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <Badge variant={document.priority === "urgent" ? "error" : document.priority === "high" ? "warning" : "secondary"}>
                  {documentPriorityLabels[document.priority]}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Unidade Actual</span>
                <span className="text-sm font-medium">{document.current_unit?.name || "—"}</span>
              </div>
              {document.due_date && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Data Limite</span>
                  <span className="text-sm font-medium">
                    {format(new Date(document.due_date), "d MMM yyyy", { locale: pt })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Classificação</span>
                <span className="text-sm font-medium font-mono">{document.classification?.code || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Última actualização</span>
                <span className="font-medium">
                  {format(new Date(document.updated_at), "d MMM yyyy", { locale: pt })}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Ficheiros</span>
                <span className="font-medium">{attachments.length}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Comentários</span>
                <span className="font-medium">{comments.length}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Movimentações</span>
                <span className="font-medium">{movements.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signature Modal */}
      <DocumentSignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        documentTitle={document.title}
        documentId={document.id}
        onSign={handleSignDocument}
      />

      {/* Document Workflow Drawer */}
      <DocumentWorkflowDrawer
        open={actionDrawerOpen}
        onOpenChange={setActionDrawerOpen}
        action={selectedAction}
        documentSummary={{
          number: document.entry_number,
          title: document.title,
          origin: document.origin || document.sender_institution || "",
          type: document.document_type?.name || "",
          status: documentStatusLabels[document.status] || document.status,
        }}
        onActionComplete={handleActionComplete}
      />

      {/* Create Process from Document Modal */}
      <CreateProcessFromDocumentModal
        open={createProcessModalOpen}
        onOpenChange={setCreateProcessModalOpen}
        documents={[{
          number: document.entry_number,
          title: document.title,
          type: document.document_type?.name || "",
          origin: document.origin || document.sender_institution || "",
          subject: document.subject || "",
          author: document.sender_name || "",
        }]}
        onProcessCreated={(processNumber) => {
          console.log("Process created:", processNumber);
          toast.success(`Processo ${processNumber} criado`);
        }}
      />
    </DashboardLayout>
  );
};

export default DocumentDetail;
