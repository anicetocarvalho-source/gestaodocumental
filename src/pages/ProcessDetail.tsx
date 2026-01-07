import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Calendar,
  FileText,
  Download,
  CheckCircle,
  Circle,
  ArrowRight,
  MessageSquare,
  Building2,
  AlertTriangle,
  Send,
  Forward,
  FileOutput,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Eye,
  Trash2,
  Plus,
  History,
  ChevronRight,
  User,
  Paperclip,
  UserPlus,
  Loader2,
} from "lucide-react";
import { WorkflowActionDrawer, type WorkflowAction } from "@/components/processes/WorkflowActionDrawer";
import { UploadProcessDocumentModal } from "@/components/processes/UploadProcessDocumentModal";
import { ProtectedContent } from "@/components/common/ProtectedContent";
import { usePermissions } from "@/hooks/usePermissions";
import { useProcess, useProcessStages, useProcessMovements, useProcessComments, useProcessOpinions, useAddProcessComment, useProcessDocuments, useDeleteProcessDocument } from "@/hooks/useProcesses";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "secondary" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  em_andamento: { label: "Em Andamento", variant: "info" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", variant: "warning" },
  aprovado: { label: "Aprovado", variant: "success" },
  rejeitado: { label: "Rejeitado", variant: "error" },
  suspenso: { label: "Suspenso", variant: "secondary" },
  arquivado: { label: "Arquivado", variant: "secondary" },
  concluido: { label: "Concluído", variant: "success" },
};

const priorityConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "secondary" }> = {
  baixa: { label: "Baixa", variant: "info" },
  normal: { label: "Normal", variant: "secondary" },
  alta: { label: "Alta", variant: "warning" },
  urgente: { label: "Urgente", variant: "error" },
};

const ProcessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("workflow");
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  const { canDo } = usePermissions();
  
  // Fetch process data from database
  const { data: process, isLoading: loadingProcess, error } = useProcess(id);
  const { data: stages = [] } = useProcessStages(id);
  const { data: movements = [] } = useProcessMovements(id);
  const { data: comments = [] } = useProcessComments(id);
  const { data: opinions = [] } = useProcessOpinions(id);
  const { data: processDocuments = [] } = useProcessDocuments(id);
  
  // Mutations
  const addComment = useAddProcessComment();
  const deleteDocument = useDeleteProcessDocument();
  
  // Calculate SLA remaining
  const getSlaRemaining = () => {
    if (!process?.deadline) return null;
    const deadlineDate = new Date(process.deadline);
    const today = new Date();
    return differenceInDays(deadlineDate, today);
  };
  
  const slaRemaining = getSlaRemaining();
  
  const status = process ? statusConfig[process.status] || statusConfig.em_andamento : statusConfig.em_andamento;
  const priority = process ? priorityConfig[process.priority] || priorityConfig.normal : priorityConfig.normal;
  
  // Loading state
  if (loadingProcess) {
    return (
      <DashboardLayout title="Detalhes do Processo" subtitle="Carregando...">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Error or not found state
  if (error || !process) {
    return (
      <DashboardLayout title="Processo não encontrado" subtitle="O processo solicitado não existe">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Processo não encontrado</h2>
            <p className="text-muted-foreground mb-4">O processo com ID "{id}" não foi encontrado na base de dados.</p>
            <Link to="/processes">
              <Button>Voltar para Lista de Processos</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const openActionDrawer = (action: WorkflowAction) => {
    setSelectedAction(action);
    setActionDrawerOpen(true);
  };

  const handleActionComplete = (action: WorkflowAction, data: Record<string, unknown>) => {
    console.log("Action completed:", action, data);
    // Here you would update the workflow timeline
  };
  
  const handleAddComment = () => {
    if (!id || !newComment.trim()) return;
    
    addComment.mutate({
      process_id: id,
      content: newComment.trim(),
      is_internal: isInternal,
    }, {
      onSuccess: () => {
        setNewComment("");
        setIsInternal(false);
      }
    });
  };

  const getStageIcon = (stageStatus: string) => {
    switch (stageStatus) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-success" />;
      case "current":
        return <Clock className="h-6 w-6 text-warning" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout 
      title="Detalhes do Processo" 
      subtitle="Gerenciar e acompanhar processo"
    >
      <PageBreadcrumb 
        items={[
          { label: "Processos", href: "/processes" },
          { label: process.process_number }
        ]} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Process Header */}
        <Card className="lg:col-span-12">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-sm">
                    {process.process_number}
                  </Badge>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                </div>
                <h1 className="text-xl font-semibold text-foreground">{process.subject}</h1>
                {process.description && (
                  <p className="text-sm text-muted-foreground max-w-3xl">{process.description}</p>
                )}
                
                {/* Key Info Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
                  {process.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-medium">{format(new Date(process.deadline), "dd MMM yyyy", { locale: pt })}</span>
                      {slaRemaining !== null && (
                        <Badge variant={slaRemaining > 10 ? "success" : slaRemaining > 3 ? "warning" : "error"} className="text-xs">
                          {slaRemaining > 0 ? `${slaRemaining} dias` : "Vencido"}
                        </Badge>
                      )}
                    </div>
                  )}
                  {process.current_unit && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Unidade:</span>
                      <span className="font-medium">{process.current_unit.name}</span>
                    </div>
                  )}
                  {(process.requester_name || process.responsible_user) && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">{process.responsible_user?.full_name || process.requester_name || "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs - 9 columns */}
        <div className="lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="workflow" className="text-xs sm:text-sm">
                Workflow
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm">
                Documentos
              </TabsTrigger>
              <TabsTrigger value="pareceres" className="text-xs sm:text-sm">
                Pareceres
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="text-xs sm:text-sm">
                Comentários
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="text-xs sm:text-sm">
                Auditoria
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Workflow Visual */}
            <TabsContent value="workflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Fluxo do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Workflow Visual */}
                  <div className="relative py-4">
                    {stages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma etapa de workflow definida para este processo.
                      </p>
                    ) : (
                      stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-start gap-4 mb-6 last:mb-0">
                          {/* Node */}
                          <div className="relative flex flex-col items-center">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${
                              stage.status === "completed" 
                                ? "border-success bg-success-muted" 
                                : stage.status === "current"
                                ? "border-warning bg-warning-muted"
                                : "border-border bg-muted"
                            }`}>
                              {getStageIcon(stage.status)}
                            </div>
                            {/* Connector line */}
                            {index < stages.length - 1 && (
                              <div className={`w-0.5 h-10 mt-2 ${
                                stage.status === "completed" ? "bg-success" : "bg-border"
                              }`} />
                            )}
                          </div>
                          
                          {/* Stage Info */}
                          <div className={`flex-1 p-4 rounded-lg border ${
                            stage.status === "current" 
                              ? "border-warning bg-warning-muted/30" 
                              : "border-border"
                          }`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{stage.name}</h4>
                                  {stage.status === "current" && (
                                    <Badge variant="warning" className="text-xs">Atual</Badge>
                                  )}
                                  {stage.status === "completed" && (
                                    <Badge variant="success" className="text-xs">Concluído</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Unidade: {stage.unit?.name || "-"}
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">
                                  {stage.completed_at 
                                    ? format(new Date(stage.completed_at), "dd MMM yyyy", { locale: pt })
                                    : stage.started_at
                                    ? format(new Date(stage.started_at), "dd MMM yyyy", { locale: pt })
                                    : "Pendente"}
                                </p>
                                {stage.assigned_user && (
                                  <p className="font-medium">{stage.assigned_user.full_name}</p>
                                )}
                              </div>
                            </div>
                            {stage.duration_days !== null && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Duração: {stage.duration_days} dias
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Documentos Anexos */}
            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Documentos Anexos ({processDocuments.length})
                </CardTitle>
                <ProtectedContent permission={{ module: "processes", action: "addDocument" }} showDisabled disabledTooltip="Requer permissão de edição para anexar documentos">
                  <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Documento
                  </Button>
                </ProtectedContent>
              </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {processDocuments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum documento anexado a este processo.
                      </p>
                    ) : (
                      processDocuments.map((doc) => {
                        const formatFileSize = (bytes: number | null) => {
                          if (!bytes) return "-";
                          if (bytes < 1024) return `${bytes} B`;
                          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                        };
                        
                        const displayName = doc.document?.title || doc.file_name || "Documento sem nome";
                        const docNumber = doc.document?.entry_number;
                        
                        const handleDownload = async () => {
                          if (!doc.file_path) return;
                          const { data } = await supabase.storage
                            .from('documents')
                            .createSignedUrl(doc.file_path, 60);
                          if (data?.signedUrl) {
                            window.open(data.signedUrl, '_blank');
                          }
                        };
                        
                        const handleDelete = () => {
                          if (!id) return;
                          deleteDocument.mutate({ id: doc.id, process_id: id, file_path: doc.file_path });
                        };
                        
                        return (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-primary-muted rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {docNumber && <span className="font-mono">{docNumber} • </span>}
                                  {doc.mime_type?.split('/')[1]?.toUpperCase() || "DOC"} • {formatFileSize(doc.file_size)} • {format(new Date(doc.created_at), "dd MMM yyyy", { locale: pt })}
                                </p>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.document && (
                                <Link to={`/documents/${doc.document.id}`}>
                                  <Button variant="ghost" size="icon-sm" title="Ver documento">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {doc.file_path && (
                                <Button variant="ghost" size="icon-sm" title="Baixar ficheiro" onClick={handleDownload}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <ProtectedContent permission={{ module: "processes", action: "edit" }} showDisabled disabledTooltip="Requer permissão de edição para remover documentos">
                                <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={deleteDocument.isPending}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </ProtectedContent>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Pareceres e Despachos */}
            <TabsContent value="pareceres" className="space-y-4">
              <Card>
                <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileOutput className="h-4 w-4" />
                  Pareceres e Despachos
                </CardTitle>
                <ProtectedContent permission={{ module: "processes", action: "addParecer" }} showDisabled disabledTooltip="Requer permissão para emitir pareceres">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Parecer
                  </Button>
                </ProtectedContent>
              </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {opinions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum parecer registrado para este processo.
                      </p>
                    ) : (
                      opinions.map((opinion) => (
                        <div 
                          key={opinion.id}
                          className="p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={opinion.opinion_type === "despacho" ? "info" : "secondary"}>
                                  {opinion.opinion_type}
                                </Badge>
                                <span className="font-mono text-sm text-muted-foreground">
                                  {opinion.opinion_number}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {opinion.author?.full_name || "-"} • {opinion.unit?.name || "-"} • {format(new Date(opinion.created_at), "dd MMM yyyy", { locale: pt })}
                              </p>
                            </div>
                            {opinion.decision && (
                              <Badge 
                                variant={opinion.decision === "favoravel" ? "success" : opinion.decision === "desfavoravel" ? "error" : "info"}
                                className="capitalize"
                              >
                                {opinion.decision}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            {opinion.summary}
                          </p>
                          {opinion.content && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Completo
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Comentários Internos */}
            <TabsContent value="comentarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum comentário registrado.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div 
                        key={comment.id}
                        className={`flex gap-3 p-4 rounded-lg ${
                          comment.is_internal ? "bg-warning-muted/30 border border-warning/20" : "bg-muted/30"
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                          {comment.author?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || "??"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{comment.author?.full_name || "Utilizador"}</span>
                            {comment.is_internal && (
                              <Badge variant="warning" className="text-xs">Interno</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Comment - Only for users with edit permissions */}
                  {canDo("processes", "addComment") ? (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Textarea 
                          placeholder="Adicionar comentário..." 
                          className="min-h-[80px]"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          disabled={addComment.isPending}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="internal" 
                              className="rounded" 
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              disabled={addComment.isPending}
                            />
                            <label htmlFor="internal" className="text-sm text-muted-foreground">
                              Marcar como nota interna
                            </label>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || addComment.isPending}
                          >
                            {addComment.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {addComment.isPending ? "A enviar..." : "Enviar"}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Audit Log */}
            <TabsContent value="auditoria" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Histórico de Movimentações
                    </CardTitle>
                    <Link to={`/audit-logs?process=${id}`}>
                      <Button variant="link" size="sm" className="text-xs">
                        Ver completo
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {movements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma movimentação registrada.
                      </p>
                    ) : (
                      movements.map((movement) => (
                        <div 
                          key={movement.id}
                          className="flex items-center justify-between py-3 border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div>
                              <p className="text-sm font-medium capitalize">{movement.action_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {movement.from_unit?.name || "-"} → {movement.to_unit?.name || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>{format(new Date(movement.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Actions - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Primary Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações do Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ProtectedContent permission={{ module: "processes", action: "dispatch" }} showDisabled disabledTooltip="Requer permissão de tramitação para despachar">
                <Button 
                  className="w-full justify-start" 
                  variant="default"
                  onClick={() => openActionDrawer("despachar")}
                >
                  <FileOutput className="h-4 w-4 mr-3" />
                  Despachar
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "processes", action: "forward" }} showDisabled disabledTooltip="Requer permissão de tramitação para reencaminhar">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("reencaminhar")}
                >
                  <Forward className="h-4 w-4 mr-3" />
                  Reencaminhar
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "processes", action: "requestInfo" }} showDisabled disabledTooltip="Requer permissão de edição para solicitar informações">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("solicitar_info")}
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  Solicitar Informações
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "processes", action: "assign" }} showDisabled disabledTooltip="Apenas gestores podem atribuir responsáveis">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("atribuir")}
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  Atribuir Responsável
                </Button>
              </ProtectedContent>
              <Separator className="my-3" />
              <ProtectedContent permission={{ module: "processes", action: "approve" }} showDisabled disabledTooltip="Apenas aprovadores podem aprovar processos">
                <Button 
                  className="w-full justify-start" 
                  variant="success"
                  onClick={() => openActionDrawer("aprovar")}
                >
                  <ThumbsUp className="h-4 w-4 mr-3" />
                  Aprovar
                </Button>
              </ProtectedContent>
              <ProtectedContent permission={{ module: "processes", action: "reject" }} showDisabled disabledTooltip="Apenas aprovadores podem rejeitar processos">
                <Button 
                  className="w-full justify-start" 
                  variant="destructive"
                  onClick={() => openActionDrawer("rejeitar")}
                >
                  <ThumbsDown className="h-4 w-4 mr-3" />
                  Rejeitar
                </Button>
              </ProtectedContent>
              <Separator className="my-3" />
              <ProtectedContent permission={{ module: "processes", action: "close" }} showDisabled disabledTooltip="Requer permissão administrativa para encerrar processos">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => openActionDrawer("encerrar")}
                >
                  <XCircle className="h-4 w-4 mr-3" />
                  Encerrar Processo
                </Button>
              </ProtectedContent>
            </CardContent>
          </Card>

          {/* Process Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium">{process.process_type?.name || "-"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">{format(new Date(process.created_at), "dd MMM yyyy", { locale: pt })}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Prazo</span>
                <span className="font-medium">{process.deadline ? format(new Date(process.deadline), "dd MMM yyyy", { locale: pt }) : "-"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Solicitante</span>
                <span className="font-medium">{process.requester_name || "-"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Origem</span>
                <span className="font-medium">{process.origin || "-"}</span>
              </div>
            </CardContent>
          </Card>

          {/* SLA Indicator */}
          {slaRemaining !== null && (
            <Card className={slaRemaining <= 3 ? "border-error" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    slaRemaining > 10 
                      ? "bg-success-muted" 
                      : slaRemaining > 3 
                      ? "bg-warning-muted" 
                      : "bg-error-muted"
                  }`}>
                    <AlertTriangle className={`h-6 w-6 ${
                      slaRemaining > 10 
                        ? "text-success" 
                        : slaRemaining > 3 
                        ? "text-warning" 
                        : "text-error"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SLA Restante</p>
                    <p className={`text-xl font-bold ${
                      slaRemaining > 10 
                        ? "text-success" 
                        : slaRemaining > 3 
                        ? "text-warning" 
                        : "text-error"
                    }`}>
                      {slaRemaining > 0 ? `${slaRemaining} dias` : "Vencido"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related - TODO: fetch linked documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
              ) : (
                movements.slice(0, 5).map((movement) => (
                  <div 
                    key={movement.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Forward className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm">{movement.action_type}</span>
                        {movement.to_unit && (
                          <p className="text-xs text-muted-foreground">Para: {movement.to_unit.name}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(movement.created_at), "dd/MM/yy", { locale: pt })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflow Action Drawer */}
      <WorkflowActionDrawer
        open={actionDrawerOpen}
        onOpenChange={setActionDrawerOpen}
        action={selectedAction}
        processSummary={{
          number: process.process_number,
          title: process.subject,
          unit: process.current_unit?.name || "-",
          slaRemaining: slaRemaining || 0,
          status: process.status,
        }}
        onActionComplete={handleActionComplete}
      />
      
      {/* Upload Document Modal */}
      {id && (
        <UploadProcessDocumentModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          processId={id}
        />
      )}
    </DashboardLayout>
  );
};

export default ProcessDetail;
