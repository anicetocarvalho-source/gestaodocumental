import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FileText,
  Search,
  Upload,
  Tags,
  Edit,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  Move,
  Eye,
  Plus,
  Filter,
  RefreshCw,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClassificationTree } from "@/components/repository/ClassificationTree";
import { RepositoryTable } from "@/components/repository/RepositoryTable";
import { RepositoryStats } from "@/components/repository/RepositoryStats";
import { ExportRepository } from "@/components/repository/ExportRepository";
import {
  ClassificationNode,
  useDocumentsByClassification,
  useRepositoryDocuments,
} from "@/hooks/useRepository";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  in_progress: "Em Tratamento",
  completed: "Concluído",
  archived: "Arquivado",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/10 text-warning border-warning/30",
  in_progress: "bg-info/10 text-info border-info/30",
  completed: "bg-success/10 text-success border-success/30",
  archived: "bg-secondary/10 text-secondary-foreground border-secondary/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Repository() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedClassification, setSelectedClassification] =
    useState<ClassificationNode | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("browse");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    search: string;
    status: string;
  }>({
    search: "",
    status: "",
  });

  // Fetch documents based on selection
  const { data: classificationDocs, isLoading: isLoadingClassification } =
    useDocumentsByClassification(selectedClassification?.id || null);
  const { data: allDocs, isLoading: isLoadingAll } = useRepositoryDocuments({
    search: filters.search,
    status: filters.status,
    classificationId: selectedClassification?.id,
  });

  const documents = selectedClassification ? classificationDocs : allDocs;
  const isLoading = selectedClassification
    ? isLoadingClassification
    : isLoadingAll;

  const handleSelectClassification = (node: ClassificationNode) => {
    setSelectedClassification(node);
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (documents && selectedItems.size === documents.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(documents?.map((doc) => doc.id) || []));
    }
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "" });
    setSelectedClassification(null);
  };

  const hasFilters = filters.search || filters.status || selectedClassification;

  // Build breadcrumb
  const breadcrumbItems = [
    { label: "Repositório", href: "/folders" },
    ...(selectedClassification
      ? [{ label: `${selectedClassification.code} - ${selectedClassification.name}` }]
      : []),
  ];

  return (
    <DashboardLayout
      title="Repositório Documental"
      subtitle="Gestão de documentos por classificação"
    >
      <div className="space-y-6">
        <PageBreadcrumb items={breadcrumbItems} />

        {/* Header with tabs and actions */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Navegar
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <ExportRepository
              documents={documents || []}
              isLoading={isLoading}
              classificationName={
                selectedClassification
                  ? `${selectedClassification.code} - ${selectedClassification.name}`
                  : undefined
              }
            />
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasFilters && (
                <Badge variant="default" className="ml-2 h-5 w-5 p-0 justify-center">
                  {[filters.search, filters.status, selectedClassification].filter(
                    Boolean
                  ).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && activeTab === "browse" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Filtros Avançados</h3>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm">Pesquisar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Título, nº entrada, classificação..."
                      className="pl-9"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, search: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Estado</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, status: v === "all" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Classificação Seleccionada</Label>
                  <div className="flex items-center gap-2">
                    {selectedClassification ? (
                      <Badge variant="secondary" className="text-sm">
                        {selectedClassification.code} - {selectedClassification.name}
                        <button
                          onClick={() => setSelectedClassification(null)}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Nenhuma (todos os documentos)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && <RepositoryStats isLoading={isLoading} />}

        {/* Browse Tab */}
        {activeTab === "browse" && (
          <div className="flex gap-6 h-[calc(100vh-340px)]">
            {/* Left Sidebar - Classification Tree */}
            <ClassificationTree
              selectedClassification={selectedClassification}
              onSelect={handleSelectClassification}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Toolbar */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="gap-2" asChild>
                        <Link to="/documents/new">
                          <Upload className="h-4 w-4" />
                          Novo Documento
                        </Link>
                      </Button>
                      {selectedItems.size > 0 && (
                        <>
                          <div className="h-6 w-px bg-border mx-2" />
                          <Button variant="outline" size="sm" className="gap-2">
                            <Tags className="h-4 w-4" />
                            Classificar ({selectedItems.size})
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Move className="h-4 w-4" />
                            Mover
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Transferir
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Right: View Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          // Refresh data
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <div className="h-6 w-px bg-border mx-1" />
                      <div className="flex rounded-md border border-border">
                        <Button
                          variant={viewMode === "list" ? "secondary" : "ghost"}
                          size="icon-sm"
                          onClick={() => setViewMode("list")}
                          className="rounded-r-none"
                        >
                          <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "grid" ? "secondary" : "ghost"}
                          size="icon-sm"
                          onClick={() => setViewMode("grid")}
                          className="rounded-l-none"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Location Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Folder className="h-4 w-4" />
                  <span>Localização actual:</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedClassification
                    ? `${selectedClassification.code} - ${selectedClassification.name}`
                    : "Todos os Documentos"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {documents?.length || 0} documento(s)
                  {selectedClassification?.description && (
                    <span> • {selectedClassification.description}</span>
                  )}
                </p>
              </div>

              {/* Content Area */}
              {viewMode === "list" ? (
                <RepositoryTable
                  documents={documents || []}
                  isLoading={isLoading}
                  selectedItems={selectedItems}
                  onToggleSelect={toggleItemSelection}
                  onToggleSelectAll={toggleSelectAll}
                />
              ) : (
                <Card className="flex-1 overflow-hidden">
                  {isLoading ? (
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : documents?.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-1">
                        Nenhum documento encontrado
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Seleccione uma classificação ou ajuste os filtros.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto max-h-[calc(100vh-500px)]">
                      {documents?.map((doc) => (
                        <div
                          key={doc.id}
                          className={cn(
                            "group relative flex flex-col items-center p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer",
                            selectedItems.has(doc.id) && "border-primary bg-primary/5"
                          )}
                          onClick={() => toggleItemSelection(doc.id)}
                        >
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Checkbox
                              checked={selectedItems.has(doc.id)}
                              onCheckedChange={() => toggleItemSelection(doc.id)}
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-7 w-7"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/documents/${doc.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Abrir
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Transferir
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <FileText className="h-16 w-16 text-info mb-3" />
                          <span className="text-sm font-medium text-foreground text-center line-clamp-2">
                            {doc.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-2 text-xs",
                              statusVariants[doc.status]
                            )}
                          >
                            {statusLabels[doc.status] || doc.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(doc.created_at), "dd/MM/yyyy", {
                              locale: pt,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Status Bar */}
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {selectedItems.size > 0
                    ? `${selectedItems.size} de ${documents?.length || 0} itens selecionados`
                    : `${documents?.length || 0} documento(s)`}
                </span>
                <span>Última actualização: Agora</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
