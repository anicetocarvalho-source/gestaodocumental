import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DocumentStatus, DocumentPriority } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search, 
  FileText, 
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  Loader2,
} from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "info" | "secondary" | "error" | "approved" | "pending" | "in-progress" | "draft" | "rejected" | "default" }> = {
  in_progress: { label: "Em Curso", variant: "in-progress" },
  completed: { label: "Concluído", variant: "approved" },
  received: { label: "Recebido", variant: "draft" },
  validating: { label: "Em Validação", variant: "pending" },
  pending_signature: { label: "Pend. Assinatura", variant: "pending" },
  archived: { label: "Arquivado", variant: "approved" },
  rejected: { label: "Rejeitado", variant: "rejected" },
  cancelled: { label: "Cancelado", variant: "rejected" },
};

function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('id, name, code')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });
}

function useOrganizationalUnits() {
  return useQuery({
    queryKey: ['org-units-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizational_units')
        .select('id, name, code')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });
}

const SearchResults = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    document_type_id: "",
    current_unit_id: "",
    status: "",
    priority: "",
    dateFrom: "",
    dateTo: "",
  });

  const { data: docTypes } = useDocumentTypes();
  const { data: units } = useOrganizationalUnits();

  const { data: result, isLoading } = useDocuments(
    {
      search: appliedSearch || undefined,
      document_type_id: filters.document_type_id || undefined,
      current_unit_id: filters.current_unit_id || undefined,
      status: (filters.status as DocumentStatus) || undefined,
      priority: (filters.priority as DocumentPriority) || undefined,
      from_date: filters.dateFrom || undefined,
      to_date: filters.dateTo || undefined,
    },
    { page, pageSize: 20 }
  );

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      document_type_id: "",
      current_unit_id: "",
      status: "",
      priority: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchQuery("");
    setAppliedSearch("");
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "") || appliedSearch !== "";

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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar por número, título, assunto..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisar
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Tipo Documental</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.document_type_id}
                      onChange={(e) => setFilters({ ...filters, document_type_id: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {docTypes?.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Unidade</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.current_unit_id}
                      onChange={(e) => setFilters({ ...filters, current_unit_id: e.target.value })}
                    >
                      <option value="">Todas</option>
                      {units?.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Estado</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Prioridade</Label>
                    <select 
                      className="h-9 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    >
                      <option value="">Todas</option>
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Data De</Label>
                    <Input 
                      type="date" 
                      className="h-9"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                  </div>
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
            <span className="font-semibold text-foreground">{result?.total ?? 0}</span> resultados encontrados
          </p>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {appliedSearch && <Badge variant="secondary" className="text-xs">"{appliedSearch}"</Badge>}
              {filters.status && <Badge variant="secondary" className="text-xs">{statusConfig[filters.status]?.label}</Badge>}
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !result?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum documento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Nº</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead className="w-[80px] text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((doc) => {
                  const status = statusConfig[doc.status];
                  return (
                    <TableRow key={doc.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link 
                          to={`/documents/${doc.id}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {doc.entry_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/documents/${doc.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                        >
                          {doc.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {(doc.document_type as { name: string } | null)?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status?.variant || "default"}>
                          {status?.label || doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(doc.entry_date), "d MMM yyyy", { locale: pt })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/documents/${doc.id}`}>
                          <Button variant="ghost" size="sm">Ver</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {result.page} de {result.totalPages} ({result.total} resultados)
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= result.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <AuditLogReference context="Ver histórico de pesquisas" />
      </div>
    </DashboardLayout>
  );
};

export default SearchResults;
