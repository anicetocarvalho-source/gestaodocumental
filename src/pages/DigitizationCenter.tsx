import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ScanLine,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Sparkles,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Download,
  Tags,
  FolderOpen,
  Layers,
  Zap,
  Settings,
  FileCheck,
  FileX,
  ImageIcon,
  Search,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDigitizationBatches,
  useScannedDocuments,
  useDigitizationStats,
  useCreateBatch,
  useUpdateBatch,
  useDeleteScannedDocument,
  type ScannedDocument,
  type DigitizationBatch,
} from "@/hooks/useDigitization";
import { useProfiles } from "@/hooks/useReferenceData";
// Status mapping
const statusMap = {
  pending: "pendente",
  scanning: "digitalizando",
  ocr_processing: "processando_ocr",
  quality_review: "revisao",
  completed: "concluido",
  error: "erro",
  rejected: "rejeitado",
} as const;

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  scanning: "Digitalizando",
  ocr_processing: "Processando OCR",
  quality_review: "Em Revisão",
  completed: "Concluído",
  error: "Erro",
  rejected: "Rejeitado",
};

const batchStatusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Em Processamento",
  completed: "Concluído",
  error: "Com Erros",
  paused: "Pausado",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const DigitizationCenter = () => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [selectedForReview, setSelectedForReview] = useState<ScannedDocument | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for new batch
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchPriority, setNewBatchPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [newBatchOperator, setNewBatchOperator] = useState("");
  const [newBatchNotes, setNewBatchNotes] = useState("");

  // Queries
  const { data: batches = [], isLoading: loadingBatches } = useDigitizationBatches();
  const { data: scannedDocuments = [], isLoading: loadingDocuments } = useScannedDocuments(undefined, filterStatus || undefined);
  const { data: stats } = useDigitizationStats();
  const { data: profiles = [] } = useProfiles({ activeOnly: true });

  // Mutations
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteDocument = useDeleteScannedDocument();

  // Get operators from profiles
  const operators = profiles;

  const toggleDocumentSelection = (id: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocuments(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.size === filteredQueue.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredQueue.map(d => d.id)));
    }
  };

  const openReviewPanel = (doc: ScannedDocument) => {
    setSelectedForReview(doc);
    setReviewPanelOpen(true);
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) return;

    await createBatch.mutateAsync({
      name: newBatchName,
      priority: newBatchPriority,
      operator_id: newBatchOperator || null,
      notes: newBatchNotes || null,
    });

    // Reset form
    setNewBatchName("");
    setNewBatchPriority("normal");
    setNewBatchOperator("");
    setNewBatchNotes("");
    setUploadDialogOpen(false);
  };

  const handlePauseBatch = async (batch: DigitizationBatch) => {
    const newStatus = batch.status === "paused" ? "processing" : "paused";
    await updateBatch.mutateAsync({ id: batch.id, status: newStatus });
  };

  const getStatusBadge = (status: ScannedDocument["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "scanning":
      case "ocr_processing":
        return <Badge variant="default"><Zap className="h-3 w-3 mr-1" />Processando</Badge>;
      case "completed":
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case "quality_review":
        return <Badge variant="warning"><Eye className="h-3 w-3 mr-1" />Revisão</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBatchStatusBadge = (status: DigitizationBatch["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "processing":
        return <Badge variant="default">Em Processamento</Badge>;
      case "completed":
        return <Badge variant="success">Concluído</Badge>;
      case "error":
        return <Badge variant="destructive">Com Erros</Badge>;
      case "paused":
        return <Badge variant="warning">Pausado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: ScannedDocument["priority"]) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "high":
        return <Badge variant="warning" className="text-xs">Alta</Badge>;
      case "normal":
        return <Badge variant="outline" className="text-xs">Normal</Badge>;
      case "low":
        return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
    }
  };

  const filteredQueue = scannedDocuments.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const displayStats = {
    pendentes: stats?.pending || 0,
    emProcessamento: (stats?.scanning || 0) + (stats?.ocr_processing || 0),
    concluidos: stats?.completed || 0,
    erros: stats?.error || 0,
    revisao: stats?.quality_review || 0,
  };

  return (
    <DashboardLayout
      title="Centro de Digitalização"
      subtitle="Gestão de documentos digitalizados e OCR"
    >
      <PageBreadcrumb items={[{ label: "Centro de Digitalização" }]} />

      <Tabs defaultValue="queue" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <Layers className="h-4 w-4" />
              Fila de Processamento
            </TabsTrigger>
            <TabsTrigger value="batches" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Lotes ({batches.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Criar Lote
            </Button>
            <Button size="sm">
              <ScanLine className="h-4 w-4 mr-2" />
              Iniciar Digitalização
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayStats.pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayStats.emProcessamento}</p>
                <p className="text-xs text-muted-foreground">Processando</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayStats.concluidos}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayStats.revisao}</p>
                <p className="text-xs text-muted-foreground">Em Revisão</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayStats.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          {/* Toolbar */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Pesquisar documentos..." 
                      className="pl-9 w-64" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="scanning">Digitalizando</SelectItem>
                      <SelectItem value="ocr_processing">Processando OCR</SelectItem>
                      <SelectItem value="quality_review">Em Revisão</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                  {(filterStatus || searchTerm) && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setSearchTerm(""); }}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                {selectedDocuments.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedDocuments.size} seleccionados</span>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Atribuir Operador
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Processar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Tags className="h-4 w-4 mr-2" />
                      Classificar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Queue Table */}
          <Card>
            <CardContent className="p-0">
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum documento encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    {filterStatus || searchTerm 
                      ? "Tente ajustar os filtros de pesquisa" 
                      : "Crie um lote e adicione documentos para começar"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="w-10 px-4 py-3">
                          <Checkbox
                            checked={selectedDocuments.size === filteredQueue.length && filteredQueue.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confiança OCR</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operador</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lote</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridade</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue.map((doc) => (
                        <tr
                          key={doc.id}
                          className={cn(
                            "border-b border-border hover:bg-muted/30 transition-colors",
                            doc.status === "error" && "bg-destructive/5",
                            selectedDocuments.has(doc.id) && "bg-primary/5"
                          )}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedDocuments.has(doc.id)}
                              onCheckedChange={() => toggleDocumentSelection(doc.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                doc.status === "completed" ? "bg-success/10" :
                                doc.status === "error" ? "bg-destructive/10" :
                                ["scanning", "ocr_processing"].includes(doc.status) ? "bg-primary/10" : "bg-muted"
                              )}>
                                {doc.status === "completed" ? <FileCheck className="h-5 w-5 text-success" /> :
                                 doc.status === "error" ? <FileX className="h-5 w-5 text-destructive" /> :
                                 <FileText className="h-5 w-5 text-muted-foreground" />}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{doc.title || doc.document_number}</p>
                                <p className="text-xs text-muted-foreground">{doc.page_count} páginas • {doc.document_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {getStatusBadge(doc.status)}
                              {doc.rejection_reason && (
                                <p className="text-xs text-destructive mt-1 max-w-[150px] truncate" title={doc.rejection_reason}>
                                  {doc.rejection_reason}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 w-36">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">OCR</span>
                                <span className="font-medium">{doc.ocr_confidence ? `${doc.ocr_confidence}%` : '-'}</span>
                              </div>
                              <Progress value={doc.ocr_confidence || 0} className="h-2" />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {doc.operator ? (
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                  {doc.operator.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="text-sm">{doc.operator.full_name}</span>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <Plus className="h-4 w-4 mr-1" />
                                Atribuir
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {doc.batch ? (
                              <span className="text-sm">{doc.batch.batch_number}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{getPriorityBadge(doc.priority)}</td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openReviewPanel(doc)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Rever Qualidade
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Play className="h-4 w-4 mr-2" />
                                  {doc.status === "error" ? "Reprocessar" : "Processar"}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tags className="h-4 w-4 mr-2" />
                                  Classificar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <User className="h-4 w-4 mr-2" />
                                  Atribuir Operador
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Transferir
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteDocument.mutate(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          {loadingBatches ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {batches.map((batch) => (
                <Card key={batch.id} className={cn(
                  "hover:border-primary/50 transition-colors",
                  batch.status === "completed" && "bg-success/5 border-success/20"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{batch.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {batch.batch_number} • {new Date(batch.created_at).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Documentos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePauseBatch(batch)}>
                            {batch.status === "paused" ? (
                              <><Play className="h-4 w-4 mr-2" />Retomar</>
                            ) : (
                              <><Pause className="h-4 w-4 mr-2" />Pausar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getBatchStatusBadge(batch.status)}
                      {batch.operator && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {batch.operator.full_name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{batch.processed_pages}/{batch.total_pages}</span>
                      </div>
                      <Progress 
                        value={batch.total_pages > 0 ? (batch.processed_pages / batch.total_pages) * 100 : 0} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {batch.total_pages > 0 
                          ? `${Math.round((batch.processed_pages / batch.total_pages) * 100)}% concluído`
                          : 'Sem documentos'
                        }
                      </p>
                    </div>

                    {batch.error_pages > 0 && (
                      <div className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {batch.error_pages} páginas com erro
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button 
                        variant={batch.status === "completed" ? "secondary" : "default"} 
                        size="sm" 
                        className="flex-1"
                      >
                        {batch.status === "completed" ? (
                          <><Download className="h-4 w-4 mr-2" />Exportar</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" />Continuar</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* New Batch Card */}
              <Card 
                className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" 
                onClick={() => setUploadDialogOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Criar Novo Lote</p>
                  <p className="text-sm">Carregar documentos para digitalização</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Batch Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Lote</DialogTitle>
            <DialogDescription>
              Criar um lote para organizar documentos digitalizados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batchName">Nome do Lote *</Label>
              <Input 
                id="batchName" 
                placeholder="Ex: Correspondência Fevereiro 2024" 
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Operador Responsável</Label>
              <Select value={newBatchOperator} onValueChange={setNewBatchOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar operador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.id} value={op.id}>{op.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={newBatchPriority} onValueChange={(v) => setNewBatchPriority(v as typeof newBatchPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNotes">Notas</Label>
              <Textarea 
                id="batchNotes" 
                placeholder="Notas adicionais sobre o lote..."
                value={newBatchNotes}
                onChange={(e) => setNewBatchNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Após criar o lote, poderá adicionar ficheiros para digitalização e processamento OCR.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateBatch} 
              disabled={!newBatchName.trim() || createBatch.isPending}
            >
              {createBatch.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality Review Panel */}
      <Sheet open={reviewPanelOpen} onOpenChange={setReviewPanelOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Revisão de Qualidade</SheetTitle>
            <SheetDescription>
              Validar o resultado do OCR e classificação.
            </SheetDescription>
          </SheetHeader>
          {selectedForReview && (
            <div className="py-6 space-y-6">
              {/* Document Info */}
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedForReview.title || selectedForReview.document_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedForReview.page_count} páginas • {selectedForReview.document_number}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedForReview.status)}
                  {getPriorityBadge(selectedForReview.priority)}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Pré-visualização do documento</p>
                  </div>
                </div>
              </div>

              {/* OCR Quality */}
              <div className="space-y-2">
                <Label>Qualidade OCR</Label>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confiança do texto</span>
                    <Badge variant={selectedForReview.ocr_confidence && selectedForReview.ocr_confidence >= 80 ? "success" : "warning"}>
                      {selectedForReview.ocr_confidence ? `${selectedForReview.ocr_confidence}%` : 'N/A'}
                    </Badge>
                  </div>
                  <Progress value={selectedForReview.ocr_confidence || 0} className="h-2" />
                  {selectedForReview.detected_language && (
                    <p className="text-xs text-muted-foreground">
                      Idioma detectado: {selectedForReview.detected_language}
                    </p>
                  )}
                </div>
              </div>

              {/* OCR Text Preview */}
              {selectedForReview.ocr_text && (
                <div className="space-y-2">
                  <Label>Texto Extraído (OCR)</Label>
                  <div className="p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedForReview.ocr_text}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setReviewPanelOpen(false)}>
                  Fechar
                </Button>
                <Button variant="destructive" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default DigitizationCenter;
