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
  Calendar,
  CheckCircle,
  Circle,
  Square,
  Diamond,
  ArrowRight,
  Upload,
  Star,
  StarOff,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  useProcessTemplates,
  useCreateProcessTemplate,
  useDeleteProcessTemplate,
  useDuplicateProcessTemplate,
  useToggleFavorite,
  ProcessTemplate,
} from "@/hooks/useProcessTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const categories = [
  "Todos",
  "Financeiro",
  "Recursos Humanos",
  "Compras",
  "Jurídico",
  "TI",
  "Administrativo",
  "Geral",
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "Geral",
    process_type: "Administrativo",
    estimated_days: 5,
    tags: [] as string[],
    is_active: true,
  });
  const [tagInput, setTagInput] = useState("");

  const { data: templates = [], isLoading } = useProcessTemplates();
  const createTemplate = useCreateProcessTemplate();
  const deleteTemplate = useDeleteProcessTemplate();
  const duplicateTemplate = useDuplicateProcessTemplate();
  const toggleFavorite = useToggleFavorite();

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && t.is_active) ||
      (statusFilter === "draft" && !t.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleFavorite = (template: ProcessTemplate) => {
    toggleFavorite.mutate({ id: template.id, is_favorite: !template.is_favorite });
  };

  const handleUseTemplate = (template: ProcessTemplate) => {
    navigate("/workflow-builder");
  };

  const handleEditTemplate = (template: ProcessTemplate) => {
    navigate("/workflow-builder");
  };

  const handleDuplicate = (template: ProcessTemplate) => {
    duplicateTemplate.mutate(template);
  };

  const handleDelete = () => {
    if (!templateToDelete) return;
    deleteTemplate.mutate(templateToDelete.id);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) return;
    createTemplate.mutate(newTemplate, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setNewTemplate({
          name: "",
          description: "",
          category: "Geral",
          process_type: "Administrativo",
          estimated_days: 5,
          tags: [],
          is_active: true,
        });
        setTagInput("");
      },
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTemplate.tags.includes(tagInput.trim())) {
      setNewTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const openPreview = (template: ProcessTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const openDeleteDialog = (template: ProcessTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="success">Activo</Badge> : 
      <Badge variant="secondary">Rascunho</Badge>;
  };

  // Stats
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    favorites: templates.filter(t => t.is_favorite).length,
    totalUsage: templates.reduce((acc, t) => acc + (t.usage_count || 0), 0),
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Templates de Processo" subtitle="Gerir templates de workflow reutilizáveis">
        <PageBreadcrumb items={[{ label: "Processos", href: "/processes" }, { label: "Templates" }]} />
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de pesquisa"
                  : "Crie o primeiro template de processo"}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
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
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(template); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                    disabled={toggleFavorite.isPending}
                  >
                    {template.is_favorite ? (
                      <Star className="h-4 w-4 text-warning fill-warning" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(template.is_active)}
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreview(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Pré-visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDeleteDialog(template)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {template.description || "Sem descrição"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{template.category}</Badge>
                    {template.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.estimated_days} dias
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {template.usage_count} usos
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleToggleFavorite(template)}
                        disabled={toggleFavorite.isPending}
                      >
                        {template.is_favorite ? (
                          <Star className="h-5 w-5 text-warning fill-warning" />
                        ) : (
                          <StarOff className="h-5 w-5 text-muted-foreground hover:text-warning transition-colors" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          {getStatusBadge(template.is_active)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <Badge variant="outline">{template.category}</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {template.estimated_days} dias
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {template.usage_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(template.updated_at).toLocaleDateString("pt-PT")}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                            <Play className="h-4 w-4 mr-2" />
                            Usar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPreview(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Pré-visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDeleteDialog(template)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p className="font-medium">{selectedTemplate?.category}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Duração Estimada</p>
                <p className="font-medium">{selectedTemplate?.estimated_days} dias</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Utilizações</p>
                <p className="font-medium">{selectedTemplate?.usage_count}</p>
              </div>
            </div>
            <div className="h-64 bg-muted/30 rounded-lg border border-border flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                  <Circle className="h-4 w-4 text-success" />
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="h-12 w-16 rounded bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <Square className="h-4 w-4 text-primary" />
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="h-10 w-10 rotate-45 bg-warning/20 border-2 border-warning flex items-center justify-center">
                  <Diamond className="h-3 w-3 text-warning -rotate-45" />
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="h-12 w-12 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                  <Circle className="h-4 w-4 text-destructive" />
                </div>
              </div>
            </div>
            {selectedTemplate?.tags && selectedTemplate.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => { setPreviewDialogOpen(false); handleUseTemplate(selectedTemplate!); }}>
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
              Tem a certeza que deseja eliminar o template "{templateToDelete?.name}"?
              Esta acção não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
            >
              {deleteTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Template de Processo</DialogTitle>
            <DialogDescription>
              Crie um novo template reutilizável para workflows de processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                placeholder="Ex: Aprovação de Despesas"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito deste template..."
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={newTemplate.category} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="process_type">Tipo de Processo</Label>
                <Select 
                  value={newTemplate.process_type} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, process_type: value }))}
                >
                  <SelectTrigger id="process_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_days">Duração Estimada (dias)</Label>
              <Input
                id="estimated_days"
                type="number"
                min={1}
                value={newTemplate.estimated_days}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, estimated_days: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Adicionar
                </Button>
              </div>
              {newTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newTemplate.tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={newTemplate.is_active}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal">
                Template activo (disponível para uso imediato)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name.trim() || createTemplate.isPending}
            >
              {createTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProcessTemplates;
