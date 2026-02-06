import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadModal } from "@/components/documents/UploadModal";
import { CreateProcessFromDocumentModal, DocumentInfo } from "@/components/documents/CreateProcessFromDocumentModal";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useDocuments, useDeleteDocument } from "@/hooks/useDocuments";
import { useArchiveDocument } from "@/hooks/useDocumentActions";
import { useDocumentTypes } from "@/hooks/useReferenceData";
import { 
  DocumentStatus, 
  DocumentPriority,
  documentStatusLabels,
  documentStatusVariants,
  documentPriorityLabels
} from "@/types/database";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
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
  FileText, 
  Search, 
  Filter, 
  Upload, 
  Grid3X3, 
  List,
  MoreVertical,
  Download,
  Eye,
  Pencil,
  Trash2,
  Plus,
  FolderPlus,
  X,
  Archive,
  Loader2,
  Lock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ITEMS_PER_PAGE = 10;

const Documents = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createProcessModalOpen, setCreateProcessModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<DocumentPriority | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Permissões do utilizador
  const { canDo } = usePermissions();

  // Dados da base de dados
  const { data: documentsResult, isLoading, error, refetch } = useDocuments(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      document_type_id: typeFilter !== "all" ? typeFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      search: searchQuery || undefined,
    },
    { page: currentPage, pageSize: ITEMS_PER_PAGE }
  );

  const { data: documentTypes } = useDocumentTypes({ activeOnly: true });
  const deleteDocument = useDeleteDocument();
  const archiveDocument = useArchiveDocument();

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Extrair dados do resultado paginado — server handles filtering, no client-side duplicate
  const documents = documentsResult?.data || [];
  const totalPages = documentsResult?.totalPages || 1;
  const totalCount = documentsResult?.total || 0;

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

  const handleCreateProcessFromSelection = () => {
    if (selectedDocuments.length > 0) {
      setCreateProcessModalOpen(true);
    }
  };

  const handleCreateProcessFromSingleDoc = (docId: string) => {
    setSelectedDocuments([docId]);
    setCreateProcessModalOpen(true);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const getSelectedDocumentsInfo = (): DocumentInfo[] => {
    return selectedDocuments.map(id => {
      const doc = documents.find(d => d.id === id)!;
      const docType = documentTypes?.find(t => t.id === doc.document_type_id);
      return {
        number: doc.entry_number,
        title: doc.title,
        type: docType?.name || "Documento",
        origin: doc.origin || "Interno",
        subject: doc.subject || doc.title,
        author: doc.sender_name || "Sistema",
      };
    });
  };

  const handleBulkDownload = async () => {
    setIsProcessing(true);
    try {
      // Query document_files for the selected documents
      const { data: files, error: filesError } = await supabase
        .from('document_files')
        .select('file_path, file_name')
        .in('document_id', selectedDocuments)
        .eq('is_main_file', true);

      if (filesError) throw filesError;

      if (!files || files.length === 0) {
        toast.info("Nenhum ficheiro encontrado para os documentos seleccionados.");
        return;
      }

      // Download each file
      for (const file of files) {
        const { data: blob, error: dlError } = await supabase.storage
          .from('documents')
          .download(file.file_path);

        if (dlError || !blob) continue;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.file_name;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`${files.length} ficheiro(s) descarregado(s)`);
    } catch {
      toast.error("Erro ao descarregar ficheiros");
    } finally {
      setIsProcessing(false);
      clearSelection();
    }
  };

  const handleBulkArchive = async () => {
    setIsProcessing(true);
    
    try {
      // Para arquivar, precisamos de uma unidade de arquivo - usar a primeira unidade disponível por enquanto
      for (const docId of selectedDocuments) {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          await archiveDocument.mutateAsync({
            documentId: docId,
            archiveUnitId: doc.current_unit_id || '',
          });
        }
      }
      
      const count = selectedDocuments.length;
      toast.success(`${count} documento${count > 1 ? 's' : ''} arquivado${count > 1 ? 's' : ''}`, {
        description: "Os documentos foram movidos para o arquivo.",
      });
      clearSelection();
    } catch (error) {
      toast.error("Erro ao arquivar documentos");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    
    try {
      for (const docId of selectedDocuments) {
        await deleteDocument.mutateAsync(docId);
      }
      
      const count = selectedDocuments.length;
      toast.success(`${count} documento${count > 1 ? 's' : ''} eliminado${count > 1 ? 's' : ''}`, {
        description: "Os documentos foram removidos permanentemente.",
      });
      clearSelection();
    } catch (error) {
      toast.error("Erro ao eliminar documentos");
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all" || searchQuery !== "";
  const isAllSelected = documents.length > 0 && selectedDocuments.length === documents.length;
  const hasSelection = selectedDocuments.length > 0;

  const getDocumentTypeName = (typeId: string | null) => {
    if (!typeId) return "—";
    return documentTypes?.find(t => t.id === typeId)?.name || "—";
  };

  if (error) {
    return (
      <DashboardLayout title="Documentos" subtitle="Gerir e organizar todos os documentos">
        <PageBreadcrumb items={[{ label: "Documentos" }]} />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar documentos</h3>
            <p className="text-muted-foreground mb-4">Não foi possível obter a lista de documentos.</p>
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
      title="Documentos" 
      subtitle="Gerir e organizar todos os documentos"
    >
      <PageBreadcrumb items={[{ label: "Documentos" }]} />

      {/* Selection Bar */}
      {hasSelection && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="font-medium">
              {selectedDocuments.length} documento{selectedDocuments.length > 1 ? 's' : ''} selecionado{selectedDocuments.length > 1 ? 's' : ''}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2" disabled={isProcessing}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {canDo("documents", "download") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkDownload}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Descarregar
              </Button>
            )}
            {canDo("documents", "archive") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkArchive}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                Arquivar
              </Button>
            )}
            {canDo("documents", "delete") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isProcessing}
                className="text-error hover:text-error hover:bg-error/10 border-error/30"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
            {canDo("processes", "create") && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <Button size="sm" onClick={handleCreateProcessFromSelection} disabled={isProcessing}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Criar Processo
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barra de Ferramentas */}
      <Card variant="toolbar" className="mb-6">
        <CardContent className="py-3">
          <div className="toolbar">
            <div className="toolbar-actions">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar documentos..." 
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
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
                      <label className="text-sm font-medium">Estado</label>
                      <Select 
                        value={statusFilter} 
                        onValueChange={(value) => { 
                          setStatusFilter(value as DocumentStatus | "all"); 
                          setCurrentPage(1); 
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todos os estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os estados</SelectItem>
                          {Object.entries(documentStatusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <label className="text-sm font-medium">Prioridade</label>
                      <Select 
                        value={priorityFilter} 
                        onValueChange={(value) => { 
                          setPriorityFilter(value as DocumentPriority | "all"); 
                          setCurrentPage(1); 
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todas as prioridades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as prioridades</SelectItem>
                          {Object.entries(documentPriorityLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
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
              <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className={`h-7 w-7 ${viewMode === "grid" ? "bg-background shadow-sm" : ""}`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className={`h-7 w-7 ${viewMode === "list" ? "bg-background shadow-sm" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              {canDo("documents", "create") ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Carregar
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/documents/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Documento
                    </Link>
                  </Button>
                </>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Sem permissão
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    O seu perfil não permite criar documentos
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))
          ) : documents.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? "Nenhum documento encontrado com os filtros aplicados." : "Ainda não existem documentos registados."}
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="block">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{doc.entry_number}</p>
                    </div>
                  </div>
                  {doc.subject && (
                    <p className="text-xs text-muted-foreground truncate mb-2">{doc.subject}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <Badge variant={documentStatusVariants[doc.status] || "secondary"} className="text-[10px]">
                      {documentStatusLabels[doc.status] || doc.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(doc.entry_date), "d MMM", { locale: pt })}
                    </span>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* List/Table View */}
      {viewMode === "list" && (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <Checkbox 
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={isLoading || documents.length === 0}
                    />
                  </th>
                  <th>Nº Entrada</th>
                  <th>Título</th>
                  <th className="w-32">Tipo</th>
                  <th className="w-28">Estado</th>
                  <th className="w-24">Prioridade</th>
                  <th className="w-32">Data</th>
                  <th className="w-20 text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td><Skeleton className="h-4 w-4" /></td>
                      <td><Skeleton className="h-4 w-32" /></td>
                      <td><Skeleton className="h-4 w-full" /></td>
                      <td><Skeleton className="h-4 w-20" /></td>
                      <td><Skeleton className="h-5 w-16" /></td>
                      <td><Skeleton className="h-4 w-16" /></td>
                      <td><Skeleton className="h-4 w-24" /></td>
                      <td><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {hasActiveFilters 
                          ? "Nenhum documento encontrado com os filtros aplicados." 
                          : "Ainda não existem documentos registados."
                        }
                      </p>
                      {hasActiveFilters && (
                        <Button variant="link" onClick={clearFilters} className="mt-2">
                          Limpar filtros
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className={selectedDocuments.includes(doc.id) ? "bg-primary/5" : ""}>
                      <td>
                        <Checkbox 
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                        />
                      </td>
                      <td className="font-mono text-sm text-muted-foreground">{doc.entry_number}</td>
                      <td>
                        <Link to={`/documents/${doc.id}`} className="flex items-center gap-3 group">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                              {doc.title}
                            </span>
                            {doc.subject && (
                              <span className="text-xs text-muted-foreground truncate block">{doc.subject}</span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="text-muted-foreground">{getDocumentTypeName(doc.document_type_id)}</td>
                      <td>
                        <Badge variant={documentStatusVariants[doc.status] || "secondary"}>
                          {documentStatusLabels[doc.status] || doc.status}
                        </Badge>
                      </td>
                      <td>
                        <span className={`text-sm ${doc.priority === 'urgent' ? 'text-destructive font-medium' : doc.priority === 'high' ? 'text-warning' : 'text-muted-foreground'}`}>
                          {documentPriorityLabels[doc.priority] || doc.priority}
                        </span>
                      </td>
                      <td className="text-muted-foreground">
                        {format(new Date(doc.entry_date), "d MMM, yyyy", { locale: pt })}
                      </td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to={`/documents/${doc.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Ver
                              </Link>
                            </DropdownMenuItem>
                            {canDo("documents", "edit") && (
                              <DropdownMenuItem asChild>
                                <Link to={`/documents/${doc.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canDo("documents", "download") && (
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" /> Descarregar
                              </DropdownMenuItem>
                            )}
                            {canDo("processes", "create") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCreateProcessFromSingleDoc(doc.id)}>
                                  <FolderPlus className="mr-2 h-4 w-4" /> Criar Processo
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDo("documents", "delete") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedDocuments([doc.id]);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Paginação */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount === 0 
            ? "Nenhum documento" 
            : `A mostrar ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de ${totalCount} documentos`
          }
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button 
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        )}
      </div>

      {/* Referência ao Registo de Auditoria */}
      <div className="mt-6">
        <AuditLogReference context="Ver histórico de actividade de documentos" />
      </div>

      {/* Modal de Carregamento */}
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />

      {/* Modal de Criar Processo */}
      {selectedDocuments.length > 0 && (
        <CreateProcessFromDocumentModal
          open={createProcessModalOpen}
          onOpenChange={(open) => {
            setCreateProcessModalOpen(open);
            if (!open) {
              setSelectedDocuments([]);
            }
          }}
          documents={getSelectedDocumentsInfo()}
        />
      )}

      {/* Dialog de Confirmação de Eliminação */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documentos?</AlertDialogTitle>
            <AlertDialogDescription>
              Está prestes a eliminar {selectedDocuments.length} documento{selectedDocuments.length > 1 ? 's' : ''}. 
              Esta acção não pode ser revertida. Todos os ficheiros associados serão permanentemente eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A eliminar...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Documents;
