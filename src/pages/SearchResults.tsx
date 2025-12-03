import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  FileText, 
  Calendar,
  Filter,
  X,
  Save,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  Building2,
  FolderOpen,
  RotateCcw,
  Download,
  Trash2,
  Star,
  Plus
} from "lucide-react";

// Search results data
const searchResults = [
  {
    id: "DOC-2024-001234",
    title: "Ofício nº 123/2024 - Secretaria de Educação",
    type: "Ofício",
    unit: "Gabinete",
    date: "15 Nov 2024",
    status: "em_analise",
    lastAction: "Tramitado para Gabinete",
    lastActionDate: "01 Dez 2024",
    classification: "Público",
    origin: "Externa",
    tags: ["educação", "recursos"],
  },
  {
    id: "DOC-2024-001230",
    title: "Memorando Interno - Solicitação de Equipamentos",
    type: "Memorando",
    unit: "Setor de Compras",
    date: "14 Nov 2024",
    status: "aprovado",
    lastAction: "Aprovado por Ana Costa",
    lastActionDate: "28 Nov 2024",
    classification: "Interno",
    origin: "Interna",
    tags: ["compras", "TI"],
  },
  {
    id: "DOC-2024-001228",
    title: "Parecer Técnico - Obra Pública",
    type: "Parecer",
    unit: "Setor de Engenharia",
    date: "13 Nov 2024",
    status: "concluido",
    lastAction: "Arquivado",
    lastActionDate: "25 Nov 2024",
    classification: "Público",
    origin: "Interna",
    tags: ["obras", "infraestrutura"],
  },
  {
    id: "DOC-2024-001225",
    title: "Contrato nº 456/2024 - Serviços de Limpeza",
    type: "Contrato",
    unit: "Departamento Jurídico",
    date: "12 Nov 2024",
    status: "pendente",
    lastAction: "Aguardando assinatura",
    lastActionDate: "20 Nov 2024",
    classification: "Restrito",
    origin: "Externa",
    tags: ["contratos", "serviços"],
  },
  {
    id: "DOC-2024-001220",
    title: "Relatório de Auditoria - Q3 2024",
    type: "Relatório",
    unit: "Controladoria",
    date: "10 Nov 2024",
    status: "em_analise",
    lastAction: "Em revisão",
    lastActionDate: "18 Nov 2024",
    classification: "Confidencial",
    origin: "Interna",
    tags: ["auditoria", "financeiro"],
  },
  {
    id: "DOC-2024-001215",
    title: "Decreto nº 789/2024 - Férias Coletivas",
    type: "Decreto",
    unit: "Gabinete",
    date: "08 Nov 2024",
    status: "aprovado",
    lastAction: "Publicado no Diário Oficial",
    lastActionDate: "10 Nov 2024",
    classification: "Público",
    origin: "Interna",
    tags: ["RH", "legislação"],
  },
  {
    id: "DOC-2024-001210",
    title: "Requerimento - Licença Especial",
    type: "Requerimento",
    unit: "Recursos Humanos",
    date: "05 Nov 2024",
    status: "pendente",
    lastAction: "Aguardando parecer",
    lastActionDate: "15 Nov 2024",
    classification: "Interno",
    origin: "Interna",
    tags: ["RH", "licenças"],
  },
  {
    id: "DOC-2024-001205",
    title: "Convênio - Parceria com Estado",
    type: "Convênio",
    unit: "Setor de Convênios",
    date: "01 Nov 2024",
    status: "em_analise",
    lastAction: "Análise jurídica",
    lastActionDate: "12 Nov 2024",
    classification: "Público",
    origin: "Externa",
    tags: ["convênios", "parcerias"],
  },
];

// Saved searches
const savedSearches = [
  { id: 1, name: "Documentos Pendentes", query: "status:pendente", count: 45, isDefault: true },
  { id: 2, name: "Ofícios de 2024", query: "tipo:oficio ano:2024", count: 128, isDefault: false },
  { id: 3, name: "Contratos em Análise", query: "tipo:contrato status:em_analise", count: 23, isDefault: false },
];

// Filter options
const documentTypes = ["Ofício", "Memorando", "Parecer", "Contrato", "Relatório", "Decreto", "Requerimento", "Convênio", "Portaria", "Circular"];
const years = ["2024", "2023", "2022", "2021", "2020"];
const origins = ["Interna", "Externa"];
const units = ["Gabinete", "Setor de Compras", "Departamento Jurídico", "Setor de Engenharia", "Controladoria", "Recursos Humanos", "Setor de Convênios", "Secretaria de Educação"];
const classifications = ["Público", "Interno", "Restrito", "Confidencial"];
const availableTags = ["educação", "recursos", "compras", "TI", "obras", "infraestrutura", "contratos", "serviços", "auditoria", "financeiro", "RH", "legislação", "licenças", "convênios", "parcerias"];

const statusConfig = {
  em_analise: { label: "Em Análise", variant: "warning" as const },
  aprovado: { label: "Aprovado", variant: "success" as const },
  concluido: { label: "Concluído", variant: "info" as const },
  pendente: { label: "Pendente", variant: "secondary" as const },
  rejeitado: { label: "Rejeitado", variant: "error" as const },
};

const SearchResults = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: "",
    year: "",
    origin: "",
    unit: "",
    classification: "",
    dateFrom: "",
    dateTo: "",
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      year: "",
      origin: "",
      unit: "",
      classification: "",
      dateFrom: "",
      dateTo: "",
    });
    setSelectedTags([]);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "") || selectedTags.length > 0;

  return (
    <DashboardLayout 
      title="Pesquisa Avançada" 
      subtitle="Pesquisar documentos e processos"
    >
      <PageBreadcrumb items={[{ label: "Pesquisa Avançada" }]} />

      {/* Search Header */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Main Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar por número, título, conteúdo..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Pesquisas Salvas
                </Button>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisar
                </Button>
              </div>
            </div>

            {/* Saved Searches Panel */}
            {showSavedSearches && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <BookmarkCheck className="h-4 w-4" />
                    Pesquisas Salvas
                  </h4>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar Pesquisa Atual
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {savedSearches.map((search) => (
                    <div 
                      key={search.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {search.isDefault && <Star className="h-4 w-4 text-warning fill-warning" />}
                        <div>
                          <p className="text-sm font-medium">{search.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{search.query}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{search.count}</Badge>
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {/* Tipo Documental */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Tipo Documental</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {documentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ano */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Ano</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Origem */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Origem</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.origin}
                      onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                    >
                      <option value="">Todas</option>
                      {origins.map(origin => (
                        <option key={origin} value={origin}>{origin}</option>
                      ))}
                    </select>
                  </div>

                  {/* Unidade */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Unidade</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.unit}
                      onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                    >
                      <option value="">Todas</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  {/* Classificação */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Classificação</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.classification}
                      onChange={(e) => setFilters({ ...filters, classification: e.target.value })}
                    >
                      <option value="">Todas</option>
                      {classifications.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data De */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Data De</Label>
                    <Input 
                      type="date" 
                      className="h-9"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                  </div>

                  {/* Data Até */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Data Até</Label>
                    <Input 
                      type="date" 
                      className="h-9"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => toggleTag(tag)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        {selectedTags.includes(tag) && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Pesquisa
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Resultados
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">156</span> resultados encontrados
          </p>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filters.type && <Badge variant="secondary" className="text-xs">{filters.type}</Badge>}
              {filters.year && <Badge variant="secondary" className="text-xs">{filters.year}</Badge>}
              {filters.origin && <Badge variant="secondary" className="text-xs">{filters.origin}</Badge>}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Ordenar:</Label>
          <select className="h-9 px-3 border border-border rounded-md bg-background text-sm">
            <option>Relevância</option>
            <option>Data (mais recente)</option>
            <option>Data (mais antigo)</option>
            <option>Título (A-Z)</option>
            <option>Título (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[150px]">Unidade</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[110px]">Estado</TableHead>
                <TableHead className="w-[200px]">Última Acção</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((result) => {
                const status = statusConfig[result.status as keyof typeof statusConfig];
                
                return (
                  <TableRow key={result.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link 
                        to={`/documents/${result.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {result.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link 
                          to={`/documents/${result.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                        >
                          {result.title}
                        </Link>
                        <div className="flex items-center gap-1">
                          {result.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {result.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{result.tags.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{result.type}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{result.unit}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{result.date}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm text-muted-foreground line-clamp-1">{result.lastAction}</p>
                        <p className="text-xs text-muted-foreground">{result.lastActionDate}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/documents/${result.id}`}>
                        <Button variant="ghost" size="sm">Ver</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">1-8</span> de <span className="font-medium">156</span> resultados
        </p>
        <div className="flex items-center gap-2">
          <select className="h-9 px-3 border border-border rounded-md bg-background text-sm">
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">...</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">16</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Audit Log Reference */}
      <div className="mt-6">
        <AuditLogReference context="Ver histórico de pesquisas" />
      </div>
    </DashboardLayout>
  );
};

export default SearchResults;
