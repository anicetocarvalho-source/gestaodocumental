import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
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
  SortAsc,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Classification tree structure
const classificationTree = [
  {
    id: "100",
    name: "100 - Administração Geral",
    children: [
      {
        id: "110",
        name: "110 - Organização Administrativa",
        children: [
          { id: "110.01", name: "110.01 - Regulamentos Internos", children: [] },
          { id: "110.02", name: "110.02 - Estrutura Organizacional", children: [] },
        ],
      },
      {
        id: "120",
        name: "120 - Recursos Humanos",
        children: [
          { id: "120.01", name: "120.01 - Processos de Pessoal", children: [] },
          { id: "120.02", name: "120.02 - Formação", children: [] },
          { id: "120.03", name: "120.03 - Avaliação de Desempenho", children: [] },
        ],
      },
      {
        id: "130",
        name: "130 - Comunicações",
        children: [
          { id: "130.01", name: "130.01 - Correspondência Oficial", children: [] },
          { id: "130.02", name: "130.02 - Circulares Internas", children: [] },
        ],
      },
    ],
  },
  {
    id: "200",
    name: "200 - Gestão Financeira",
    children: [
      {
        id: "210",
        name: "210 - Orçamento",
        children: [
          { id: "210.01", name: "210.01 - Propostas Orçamentais", children: [] },
          { id: "210.02", name: "210.02 - Execução Orçamental", children: [] },
        ],
      },
      {
        id: "220",
        name: "220 - Contabilidade",
        children: [
          { id: "220.01", name: "220.01 - Faturas e Recibos", children: [] },
          { id: "220.02", name: "220.02 - Relatórios Financeiros", children: [] },
        ],
      },
    ],
  },
  {
    id: "300",
    name: "300 - Assuntos Jurídicos",
    children: [
      {
        id: "310",
        name: "310 - Contratos",
        children: [
          { id: "310.01", name: "310.01 - Contratos de Prestação de Serviços", children: [] },
          { id: "310.02", name: "310.02 - Contratos de Fornecimento", children: [] },
        ],
      },
      {
        id: "320",
        name: "320 - Contencioso",
        children: [],
      },
    ],
  },
  {
    id: "400",
    name: "400 - Actividades Específicas",
    children: [
      {
        id: "410",
        name: "410 - Projectos",
        children: [],
      },
      {
        id: "420",
        name: "420 - Parcerias",
        children: [],
      },
    ],
  },
];

// Sample documents/folders data
const repositoryItems = [
  { id: 1, type: "folder", name: "Regulamentos 2024", items: 12, modified: "2024-01-15", modifiedBy: "Maria Santos" },
  { id: 2, type: "folder", name: "Circulares", items: 8, modified: "2024-01-14", modifiedBy: "João Silva" },
  { id: 3, type: "folder", name: "Formulários", items: 24, modified: "2024-01-13", modifiedBy: "Ana Costa" },
  { id: 4, type: "document", name: "REG-001 - Regulamento de Expediente.pdf", size: "2.4 MB", modified: "2024-01-12", modifiedBy: "Carlos Pereira", status: "active" },
  { id: 5, type: "document", name: "REG-002 - Regulamento de Arquivo.pdf", size: "1.8 MB", modified: "2024-01-11", modifiedBy: "Maria Santos", status: "active" },
  { id: 6, type: "document", name: "CIRC-2024-001 - Horário de Funcionamento.docx", size: "156 KB", modified: "2024-01-10", modifiedBy: "João Silva", status: "draft" },
  { id: 7, type: "document", name: "FORM-001 - Pedido de Férias.docx", size: "89 KB", modified: "2024-01-09", modifiedBy: "Ana Costa", status: "active" },
  { id: 8, type: "document", name: "FORM-002 - Requisição de Material.xlsx", size: "124 KB", modified: "2024-01-08", modifiedBy: "Carlos Pereira", status: "active" },
];

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedId: string;
  expandedIds: Set<string>;
  onSelect: (id: string, name: string) => void;
  onToggle: (id: string) => void;
}

function TreeItem({ node, level, selectedId, expandedIds, onSelect, onToggle }: TreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.id, node.name);
          if (hasChildren) onToggle(node.id);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-warning" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-warning" />
          )
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Repository() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedClassification, setSelectedClassification] = useState("110.01");
  const [selectedName, setSelectedName] = useState("110.01 - Regulamentos Internos");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["100", "110"]));
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSelect = (id: string, name: string) => {
    setSelectedClassification(id);
    setSelectedName(name);
  };

  const toggleItemSelection = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === repositoryItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(repositoryItems.map((item) => item.id)));
    }
  };

  // Build breadcrumb path
  const breadcrumbPath = selectedName.split(" - ")[0].split(".");
  const breadcrumbItems = [
    { label: "Repositório", href: "/folders" },
    { label: selectedName },
  ];

  return (
    <DashboardLayout title="Repositório Documental" subtitle="Gestão de documentos por classificação">
      <PageBreadcrumb items={breadcrumbItems} />

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left Sidebar - Classification Tree */}
        <Card className="w-80 shrink-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground mb-3">Classificação Documental</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar classificação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {classificationTree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                level={0}
                selectedId={selectedClassification}
                expandedIds={expandedIds}
                onSelect={handleSelect}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Carregar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Pasta
                  </Button>
                  {selectedItems.size > 0 && (
                    <>
                      <div className="h-6 w-px bg-border mx-2" />
                      <Button variant="outline" size="sm" className="gap-2">
                        <Tags className="h-4 w-4" />
                        Classificar ({selectedItems.size})
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Editar em Massa
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Move className="h-4 w-4" />
                        Mover
                      </Button>
                    </>
                  )}
                </div>

                {/* Right: View Controls */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <SortAsc className="h-4 w-4" />
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
              <span>Localização atual:</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{selectedName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {repositoryItems.length} itens • Última modificação: 15 Jan 2024
            </p>
          </div>

          {/* Content Area */}
          <Card className="flex-1 overflow-hidden">
            {viewMode === "list" ? (
              /* List View */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="w-12 px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedItems.size === repositoryItems.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Modificado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Modificado por
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tamanho
                      </th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {repositoryItems.map((item) => (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/30 transition-colors cursor-pointer",
                          selectedItems.has(item.id) && "bg-primary/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.type === "folder" ? (
                              <Folder className="h-5 w-5 text-warning shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-info shrink-0" />
                            )}
                            <div>
                              <Link
                                to={item.type === "folder" ? "#" : `/documents/${item.id}/view`}
                                className="font-medium text-foreground hover:text-primary hover:underline"
                              >
                                {item.name}
                              </Link>
                              {item.type === "document" && item.status === "draft" && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Rascunho
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.modified}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.modifiedBy}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.type === "folder" ? `${item.items} itens` : item.size}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Abrir
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Transferir
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Move className="h-4 w-4 mr-2" />
                                Mover
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Tags className="h-4 w-4 mr-2" />
                                Classificar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Renomear
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {repositoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex flex-col items-center p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer",
                      selectedItems.has(item.id) && "border-primary bg-primary/5"
                    )}
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Abrir
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
                    {item.type === "folder" ? (
                      <Folder className="h-16 w-16 text-warning mb-3" />
                    ) : (
                      <FileText className="h-16 w-16 text-info mb-3" />
                    )}
                    <span className="text-sm font-medium text-foreground text-center line-clamp-2">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {item.type === "folder" ? `${item.items} itens` : item.size}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {selectedItems.size > 0
                ? `${selectedItems.size} de ${repositoryItems.length} itens selecionados`
                : `${repositoryItems.length} itens`}
            </span>
            <span>Última sincronização: Agora mesmo</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
