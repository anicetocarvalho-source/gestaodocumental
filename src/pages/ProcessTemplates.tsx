import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GitBranch,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Play,
  Clock,
  User,
  Calendar,
  FileText,
  CheckCircle,
  Circle,
  Square,
  Diamond,
  ArrowRight,
  Download,
  Upload,
  Star,
  StarOff,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Types
interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isFavorite: boolean;
  status: "active" | "draft" | "archived";
  nodes: number;
  estimatedDuration: string;
  tags: string[];
}

// Sample Data
const templates: ProcessTemplate[] = [
  {
    id: "tpl-001",
    name: "Aprovação de Despesas",
    description: "Workflow padrão para aprovação de despesas com múltiplos níveis de autorização baseado em valor.",
    category: "Financeiro",
    version: "2.1",
    author: "Maria Santos",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-15",
    usageCount: 45,
    isFavorite: true,
    status: "active",
    nodes: 8,
    estimatedDuration: "3-5 dias",
    tags: ["despesas", "aprovação", "financeiro"],
  },
  {
    id: "tpl-002",
    name: "Contratação de Pessoal",
    description: "Processo completo de contratação desde a requisição até a integração do colaborador.",
    category: "Recursos Humanos",
    version: "1.5",
    author: "João Costa",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-12",
    usageCount: 23,
    isFavorite: true,
    status: "active",
    nodes: 12,
    estimatedDuration: "15-30 dias",
    tags: ["RH", "contratação", "recrutamento"],
  },
  {
    id: "tpl-003",
    name: "Aquisição de Bens",
    description: "Workflow para aquisição de bens e equipamentos com processo de cotação e aprovação.",
    category: "Compras",
    version: "3.0",
    author: "Ana Rodrigues",
    createdAt: "2024-01-05",
    updatedAt: "2024-01-14",
    usageCount: 67,
    isFavorite: false,
    status: "active",
    nodes: 10,
    estimatedDuration: "10-15 dias",
    tags: ["compras", "aquisição", "equipamentos"],
  },
  {
    id: "tpl-004",
    name: "Aprovação de Férias",
    description: "Processo simplificado para solicitação e aprovação de férias dos colaboradores.",
    category: "Recursos Humanos",
    version: "1.2",
    author: "Pedro Almeida",
    createdAt: "2024-01-03",
    updatedAt: "2024-01-10",
    usageCount: 89,
    isFavorite: false,
    status: "active",
    nodes: 5,
    estimatedDuration: "2-3 dias",
    tags: ["RH", "férias", "ausências"],
  },
  {
    id: "tpl-005",
    name: "Revisão de Contratos",
    description: "Workflow para revisão e aprovação de contratos com parecer jurídico obrigatório.",
    category: "Jurídico",
    version: "2.0",
    author: "Carlos Ferreira",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-08",
    usageCount: 34,
    isFavorite: true,
    status: "active",
    nodes: 9,
    estimatedDuration: "5-10 dias",
    tags: ["jurídico", "contratos", "revisão"],
  },
  {
    id: "tpl-006",
    name: "Onboarding de Colaboradores",
    description: "Processo de integração de novos colaboradores com todas as etapas necessárias.",
    category: "Recursos Humanos",
    version: "1.0",
    author: "Teresa Gomes",
    createdAt: "2023-12-20",
    updatedAt: "2024-01-05",
    usageCount: 12,
    isFavorite: false,
    status: "draft",
    nodes: 15,
    estimatedDuration: "5-7 dias",
    tags: ["RH", "onboarding", "integração"],
  },
  {
    id: "tpl-007",
    name: "Gestão de Incidentes",
    description: "Workflow para registo e resolução de incidentes de TI.",
    category: "TI",
    version: "1.3",
    author: "António Ribeiro",
    createdAt: "2023-12-15",
    updatedAt: "2024-01-02",
    usageCount: 156,
    isFavorite: false,
    status: "active",
    nodes: 7,
    estimatedDuration: "1-3 dias",
    tags: ["TI", "incidentes", "suporte"],
  },
  {
    id: "tpl-008",
    name: "Pedido de Viagem",
    description: "Processo para solicitação e aprovação de viagens de serviço.",
    category: "Administrativo",
    version: "1.1",
    author: "Maria Santos",
    createdAt: "2023-12-10",
    updatedAt: "2023-12-28",
    usageCount: 28,
    isFavorite: false,
    status: "archived",
    nodes: 6,
    estimatedDuration: "3-5 dias",
    tags: ["viagens", "despesas", "administrativo"],
  },
];

const categories = [
  "Todos",
  "Financeiro",
  "Recursos Humanos",
  "Compras",
  "Jurídico",
  "TI",
  "Administrativo",
];

const ProcessTemplates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ProcessTemplate | null>(null);
  const [localTemplates, setLocalTemplates] = useState(templates);

  // Filter templates
  const filteredTemplates = localTemplates.filter(t => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleFavorite = (id: string) => {
    setLocalTemplates(localTemplates.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
    const template = localTemplates.find(t => t.id === id);
    toast.success(template?.isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  const handleUseTemplate = (template: ProcessTemplate) => {
    toast.success(`Template "${template.name}" seleccionado`);
    navigate("/workflow-builder");
  };

  const handleEditTemplate = (template: ProcessTemplate) => {
    navigate("/workflow-builder");
  };

  const handleDuplicate = (template: ProcessTemplate) => {
    const newTemplate: ProcessTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (cópia)`,
      version: "1.0",
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      usageCount: 0,
      status: "draft",
    };
    setLocalTemplates([newTemplate, ...localTemplates]);
    toast.success("Template duplicado com sucesso");
  };

  const handleDelete = () => {
    if (!templateToDelete) return;
    setLocalTemplates(localTemplates.filter(t => t.id !== templateToDelete.id));
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
    toast.success("Template eliminado");
  };

  const openPreview = (template: ProcessTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const openDeleteDialog = (template: ProcessTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: ProcessTemplate["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Activo</Badge>;
      case "draft":
        return <Badge variant="secondary">Rascunho</Badge>;
      case "archived":
        return <Badge variant="outline">Arquivado</Badge>;
    }
  };

  // Stats
  const stats = {
    total: localTemplates.length,
    active: localTemplates.filter(t => t.status === "active").length,
    favorites: localTemplates.filter(t => t.isFavorite).length,
    totalUsage: localTemplates.reduce((acc, t) => acc + t.usageCount, 0),
  };

  return (
    <DashboardLayout
      title="Templates de Processo"
      subtitle="Gerir templates de workflow reutilizáveis"
    >
      <PageBreadcrumb
        items={[
          { label: "Processos", href: "/processes" },
          { label: "Templates" }
        ]}
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Templates</p>
              </div>
            </div>
          </Card>
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </div>
          </Card>
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.favorites}</p>
                <p className="text-xs text-muted-foreground">Favoritos</p>
              </div>
            </div>
          </Card>
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-xs text-muted-foreground">Utilizações</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar templates..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.slice(1).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={() => navigate("/workflow-builder")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} variant="interactive" className="overflow-hidden">
                {/* Preview Area */}
                <div className="h-32 bg-muted/50 relative p-4 border-b border-border">
                  {/* Mini workflow preview */}
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                        <Circle className="h-3 w-3 text-success" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="h-8 w-12 rounded bg-primary/20 border-2 border-primary flex items-center justify-center">
                        <Square className="h-3 w-3 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="h-6 w-6 rotate-45 bg-warning/20 border-2 border-warning flex items-center justify-center">
                        <Diamond className="h-2 w-2 text-warning -rotate-45" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="h-8 w-8 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                        <Circle className="h-3 w-3 text-destructive" />
                      </div>
                    </div>
                  </div>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(template.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    {template.isFavorite ? (
                      <Star className="h-4 w-4 text-warning fill-warning" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(template.status)}
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground line-clamp-1">{template.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-popover">
                          <DropdownMenuItem onClick={() => openPreview(template)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Exportar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDeleteDialog(template)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    <Badge variant="secondary" className="text-xs">v{template.version}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {template.nodes} nós
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {template.usageCount}x usado
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    disabled={template.status !== "active"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Versão</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nós</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilizações</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Autor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleFavorite(template.id)}
                              className="text-muted-foreground hover:text-warning"
                            >
                              {template.isFavorite ? (
                                <Star className="h-4 w-4 text-warning fill-warning" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <p className="font-medium text-foreground">{template.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{template.category}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          v{template.version}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(template.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {template.nodes}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {template.usageCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {template.author}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUseTemplate(template)}
                              disabled={template.status !== "active"}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Usar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-popover">
                                <DropdownMenuItem onClick={() => openPreview(template)}>
                                  <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => openDeleteDialog(template)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <Card className="py-12">
            <div className="text-center">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Nenhum template encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros ou criar um novo template
              </p>
              <Button onClick={() => navigate("/workflow-builder")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-6 py-4">
              {/* Workflow Preview */}
              <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                    <Circle className="h-4 w-4 text-success" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="h-10 w-14 rounded bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <Square className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="h-8 w-8 rotate-45 bg-warning/20 border-2 border-warning flex items-center justify-center">
                    <Diamond className="h-3 w-3 text-warning -rotate-45" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="h-10 w-14 rounded bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <Square className="h-4 w-4 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="h-10 w-10 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                    <Circle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="font-medium">{selectedTemplate.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Versão:</span>
                    <span className="font-medium">v{selectedTemplate.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Autor:</span>
                    <span className="font-medium">{selectedTemplate.author}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duração Est.:</span>
                    <span className="font-medium">{selectedTemplate.estimatedDuration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Utilizações:</span>
                    <span className="font-medium">{selectedTemplate.usageCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Actualizado:</span>
                    <span className="font-medium">{selectedTemplate.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => selectedTemplate && handleEditTemplate(selectedTemplate)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Template
            </Button>
            <Button onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}>
              <Play className="h-4 w-4 mr-2" />
              Usar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Template</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar o template "{templateToDelete?.name}"? Esta acção não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProcessTemplates;
