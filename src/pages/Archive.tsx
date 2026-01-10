import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Archive as ArchiveIcon,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  FileText,
  FolderArchive,
  Clock,
  Building2,
  RotateCcw,
  History,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  BarChart3,
  Mail,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  useArchivedDocuments, 
  useArchiveStats, 
  useRestoreDocument, 
  useDocumentRetentions,
  useMarkForDestruction,
  useApproveDestruction,
  useRejectDestruction,
  useCancelDestruction,
  useArchiveAnalyticsData,
  ArchiveFilters 
} from "@/hooks/useArchive";
import { useDocumentTypes, useOrganizationalUnits, useClassificationCodes } from "@/hooks/useReferenceData";
import { usePermissions } from "@/hooks/usePermissions";
import { Document } from "@/types/database";
import { MarkForDestructionModal } from "@/components/archive/MarkForDestructionModal";
import { PendingDestructionList } from "@/components/archive/PendingDestructionList";
import { RetentionStatusBadge } from "@/components/archive/RetentionStatusBadge";
import { ArchiveAnalytics } from "@/components/archive/ArchiveAnalytics";

const ITEMS_PER_PAGE = 15;

const Archive = () => {
  // Estados de UI
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [destructionModalOpen, setDestructionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");
  const [sendingAlerts, setSendingAlerts] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState("all");

  // Permissões
  const { canDo } = usePermissions();

  // Construir filtros
  const filters: ArchiveFilters = useMemo(() => ({
    search: searchTerm || undefined,
    document_type_id: typeFilter !== "all" ? typeFilter : undefined,
    unit_id: unitFilter !== "all" ? unitFilter : undefined,
    classification_id: classificationFilter !== "all" ? classificationFilter : undefined,
  }), [searchTerm, typeFilter, unitFilter, classificationFilter]);

  // Dados
  const { data: documentsResult, isLoading, error, refetch } = useArchivedDocuments(
    filters,
    { page: currentPage, pageSize: ITEMS_PER_PAGE }
  );
  const { data: stats, isLoading: statsLoading } = useArchiveStats();
  const { data: documentTypes } = useDocumentTypes({ activeOnly: true });
  const { data: units } = useOrganizationalUnits({ activeOnly: true });
  const { data: classifications } = useClassificationCodes({ activeOnly: true });
  const { data: pendingRetentions, isLoading: retentionsLoading } = useDocumentRetentions('pending');
  const { data: allRetentions } = useDocumentRetentions();
  const { data: analyticsDocuments, isLoading: analyticsLoading } = useArchiveAnalyticsData();
  
  const restoreDocument = useRestoreDocument();
  const markForDestruction = useMarkForDestruction();
  const approveDestruction = useApproveDestruction();
  const rejectDestruction = useRejectDestruction();
  const cancelDestruction = useCancelDestruction();

  // Dados processados
  const documents = documentsResult?.data || [];
  const totalPages = documentsResult?.totalPages || 1;
  const totalCount = documentsResult?.total || 0;

  // Estatísticas
  const statsData = [
    { 
      label: "Total Arquivado", 
      value: statsLoading ? "..." : stats?.total.toLocaleString('pt-PT') || "0", 
      icon: FolderArchive, 
      color: "text-primary" 
    },
    { 
      label: "Arquivo Permanente", 
      value: statsLoading ? "..." : stats?.permanent.toLocaleString('pt-PT') || "0", 
      icon: ArchiveIcon, 
      color: "text-success" 
    },
    { 
      label: "Pendente Eliminação", 
      value: statsLoading ? "..." : stats?.pendingDestruction.toLocaleString('pt-PT') || "0", 
      icon: Clock, 
      color: "text-warning" 
    },
    { 
      label: "Consultados (Mês)", 
      value: statsLoading ? "..." : stats?.consultedThisMonth.toLocaleString('pt-PT') || "0", 
      icon: Eye, 
      color: "text-info" 
    },
  ];

  // Handlers de selecção
  const handleSelectDocument = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  // Handlers de restauração
  const handleRestoreClick = (doc: Document) => {
    setSelectedDocument(doc);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedDocument) return;

    try {
      await restoreDocument.mutateAsync({
        documentId: selectedDocument.id,
        targetUnitId: selectedDocument.current_unit_id || '',
        notes: 'Documento restaurado do arquivo',
      });

      toast.success("Documento restaurado com sucesso", {
        description: `${selectedDocument.title} foi movido para o sistema activo.`,
      });

      setRestoreDialogOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      toast.error("Erro ao restaurar documento");
      console.error(error);
    }
  };

  // Handlers de filtros
  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setUnitFilter("all");
    setClassificationFilter("all");
    setCurrentPage(1);
  };

  // Handler de marcação para eliminação
  const handleMarkForDestruction = async (data: {
    documentIds: string[];
    scheduledDate: Date;
    retentionReason?: string;
    destructionReason: string;
    legalBasis?: string;
    notes?: string;
  }) => {
    try {
      await markForDestruction.mutateAsync(data);
      toast.success("Documentos marcados para eliminação", {
        description: `${data.documentIds.length} documento(s) agendado(s) para eliminação.`,
      });
      setDestructionModalOpen(false);
      setSelectedDocuments([]);
    } catch (error) {
      toast.error("Erro ao marcar documentos para eliminação");
      console.error(error);
    }
  };

  // Handler de envio manual de alertas
  const handleSendRetentionAlerts = async () => {
    setSendingAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke('retention-alerts');
      
      if (error) throw error;
      
      if (data.alertsSent > 0) {
        toast.success(`Alertas enviados com sucesso`, {
          description: `${data.alertsSent} email(s) enviado(s) para documentos próximos da eliminação.`,
        });
      } else {
        toast.info("Nenhum alerta a enviar", {
          description: "Não existem documentos com eliminação agendada para os próximos 30 dias.",
        });
      }
    } catch (error) {
      console.error("Error sending retention alerts:", error);
      toast.error("Erro ao enviar alertas", {
        description: "Não foi possível enviar os alertas de retenção.",
      });
    } finally {
      setSendingAlerts(false);
    }
  };

  const hasActiveFilters = typeFilter !== "all" || unitFilter !== "all" || classificationFilter !== "all" || searchTerm !== "";
  const isAllSelected = documents.length > 0 && selectedDocuments.length === documents.length;
  const hasSelection = selectedDocuments.length > 0;

  // Helpers
  const getDocumentTypeName = (typeId: string | null) => {
    if (!typeId) return "—";
    return documentTypes?.find(t => t.id === typeId)?.name || "—";
  };

  const getUnitName = (unitId: string | null) => {
    if (!unitId) return "—";
    return units?.find(u => u.id === unitId)?.name || "—";
  };

  const getClassificationCode = (classificationId: string | null) => {
    if (!classificationId) return null;
    return classifications?.find(c => c.id === classificationId);
  };

  // Estado de erro
  if (error) {
    return (
      <DashboardLayout title="Arquivo" subtitle="Gestão de documentos e processos arquivados">
        <PageBreadcrumb items={[{ label: "Arquivo" }]} />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar arquivo</h3>
            <p className="text-muted-foreground mb-4">Não foi possível obter a lista de documentos arquivados.</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Arquivo"
      subtitle="Gestão de documentos e processos arquivados"
    >
      <PageBreadcrumb items={[{ label: "Arquivo" }]} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl bg-muted flex items-center justify-center", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selection Bar */}
      {hasSelection && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="font-medium">
              {selectedDocuments.length} documento{selectedDocuments.length > 1 ? 's' : ''} selecionado{selectedDocuments.length > 1 ? 's' : ''}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descarregar
            </Button>
            {canDo("documents", "archive") && (
              <>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDestructionModalOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Marcar Eliminação
                </Button>
                <Button 
                  size="sm" 
                  variant="success"
                  onClick={() => {
                    const doc = documents.find(d => d.id === selectedDocuments[0]);
                    if (doc) handleRestoreClick(doc);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Card variant="toolbar" className="mb-6">
        <CardContent className="py-3">
          <div className="toolbar">
            <div className="toolbar-actions">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar no arquivo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-9"
                />
              </div>
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon-sm" className={hasActiveFilters ? "border-primary text-primary" : ""}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Documento</label>
                      <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          {documentTypes?.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unidade Orgânica</label>
                      <Select value={unitFilter} onValueChange={(value) => { setUnitFilter(value); setCurrentPage(1); }}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todas as unidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as unidades</SelectItem>
                          {units?.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Classificação</label>
                      <Select value={classificationFilter} onValueChange={(value) => { setClassificationFilter(value); setCurrentPage(1); }}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todas as classificações" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as classificações</SelectItem>
                          {classifications?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground">
                  <X className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
            <div className="toolbar-buttons">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendRetentionAlerts}
                    disabled={sendingAlerts}
                    className="gap-2"
                  >
                    {sendingAlerts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    Enviar Alertas
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enviar alertas por email para documentos com eliminação próxima</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant={showAuditLog ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAuditLog(!showAuditLog)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Auditoria
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Panel */}
      {showAuditLog && (
        <Card className="mb-6 border-info/30 bg-info/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-info" />
              Registo de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Consulte o módulo de <Link to="/audit-logs" className="text-primary hover:underline">Logs de Auditoria</Link> para ver o histórico completo de acções no arquivo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Documents and Pending Destruction */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <FolderArchive className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Clock className="h-4 w-4" />
            Eliminação
            {(stats?.pendingDestruction || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {stats.pendingDestruction}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderArchive className="h-4 w-4" />
                  Documentos Arquivados
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {totalCount} documento(s)
                </p>
              </div>
            </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FolderArchive className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Arquivo vazio</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? "Nenhum documento encontrado com os filtros aplicados."
                  : "Ainda não existem documentos arquivados no sistema."}
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Unidade</TableHead>
                  <TableHead className="hidden md:table-cell">Data Arquivo</TableHead>
                  <TableHead className="hidden lg:table-cell">Classificação</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const classification = getClassificationCode(doc.classification_id);
                  const isSelected = selectedDocuments.includes(doc.id);
                  
                  return (
                    <TableRow key={doc.id} className={cn(isSelected && "bg-primary/5")}>
                      <TableCell>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectDocument(doc.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-xs">{doc.entry_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm truncate max-w-[200px] cursor-default">{doc.title}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{doc.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeName(doc.document_type_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{getUnitName(doc.current_unit_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {doc.archived_at 
                            ? format(new Date(doc.archived_at), "dd/MM/yyyy", { locale: pt })
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {classification ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="text-xs cursor-default">
                                {classification.code}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{classification.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link to={`/documents/${doc.id}`}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver documento</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Descarregar</TooltipContent>
                          </Tooltip>
                          {canDo("documents", "archive") && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                                  onClick={() => handleRestoreClick(doc)}
                                  title="Restaurar documento"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restaurar do arquivo</TooltipContent>
                            </Tooltip>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/documents/${doc.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descarregar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <History className="mr-2 h-4 w-4" />
                                Ver histórico
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Seguinte
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention">
          <PendingDestructionList
            retentionRecords={pendingRetentions || []}
            isLoading={retentionsLoading}
            onApprove={async (id) => {
              await approveDestruction.mutateAsync(id);
              toast.success("Eliminação aprovada");
            }}
            onReject={async (id, reason) => {
              await rejectDestruction.mutateAsync({ retentionId: id, reason });
              toast.success("Eliminação rejeitada");
            }}
            onCancel={async (id) => {
              await cancelDestruction.mutateAsync(id);
              toast.success("Marcação cancelada");
            }}
            canApprove={canDo("documents", "archive")}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <ArchiveAnalytics
            documents={analyticsDocuments as Document[] || []}
            retentions={allRetentions || []}
            classifications={classifications || []}
            units={units || []}
            isLoading={analyticsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-success" />
              Restaurar Documento
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Tem a certeza que deseja restaurar o documento para o sistema activo?
                </p>
                {selectedDocument && (
                  <div className="p-3 bg-muted rounded-lg border">
                    <p className="font-medium text-foreground">{selectedDocument.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDocument.entry_number}
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Esta acção será registada no log de auditoria.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreConfirm} 
              className="bg-success hover:bg-success/90"
              disabled={restoreDocument.isPending}
            >
              {restoreDocument.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark for Destruction Modal */}
      <MarkForDestructionModal
        open={destructionModalOpen}
        onOpenChange={setDestructionModalOpen}
        documents={documents.filter(d => selectedDocuments.includes(d.id))}
        onConfirm={handleMarkForDestruction}
        isPending={markForDestruction.isPending}
      />
    </DashboardLayout>
  );
};

export default Archive;
