import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus, 
  Clock, 
  Search,
  Filter,
  Download,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Pause,
  X,
  FileText,
  Loader2
} from "lucide-react";
import { 
  useProcesses, 
  useProcessTypes, 
  useProcessStats,
  useRealtimeProcesses,
  Process
} from "@/hooks/useProcesses";
import { useOrganizationalUnits } from "@/hooks/useReferenceData";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "secondary"; icon: typeof Clock }> = {
  rascunho: { label: "Rascunho", variant: "secondary", icon: FileText },
  em_andamento: { label: "Em Andamento", variant: "info", icon: Clock },
  aguardando_aprovacao: { label: "Aguardando Aprovação", variant: "warning", icon: Clock },
  aprovado: { label: "Aprovado", variant: "success", icon: CheckCircle },
  rejeitado: { label: "Rejeitado", variant: "error", icon: AlertCircle },
  suspenso: { label: "Suspenso", variant: "secondary", icon: Pause },
  arquivado: { label: "Arquivado", variant: "secondary", icon: FileText },
  concluido: { label: "Concluído", variant: "success", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; variant: "error" | "warning" | "info" | "secondary" }> = {
  urgente: { label: "Urgente", variant: "error" },
  alta: { label: "Alta", variant: "error" },
  normal: { label: "Normal", variant: "warning" },
  baixa: { label: "Baixa", variant: "info" },
};

const ITEMS_PER_PAGE = 10;

const Processes = () => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    priority: "",
    unit: "",
  });

  // Subscribe to realtime updates
  useRealtimeProcesses();

  // Fetch data
  const { data: processes, isLoading: loadingProcesses } = useProcesses({
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    type_id: filters.type || undefined,
    unit_id: filters.unit || undefined,
    search: searchTerm || undefined,
  });
  const { data: processTypes } = useProcessTypes();
  const { data: stats, isLoading: loadingStats } = useProcessStats();
  const { data: units } = useOrganizationalUnits();

  const getSlaDisplay = (process: Process) => {
    if (!process.deadline) {
      return <span className="text-muted-foreground">Sem prazo</span>;
    }
    
    const days = differenceInDays(new Date(process.deadline), new Date());
    
    if (process.status === 'concluido' || process.status === 'arquivado') {
      return <span className="text-success font-medium">Concluído</span>;
    }
    
    if (days < 0) {
      return <span className="text-error font-medium">{Math.abs(days)} dias atrasado</span>;
    } else if (days <= 3) {
      return <span className="text-warning font-medium">{days} dias</span>;
    }
    return <span className="text-muted-foreground">{days} dias</span>;
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      status: "",
      priority: "",
      unit: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "") || searchTerm !== "";

  // Pagination
  const totalProcesses = processes?.length || 0;
  const totalPages = Math.ceil(totalProcesses / ITEMS_PER_PAGE);
  const paginatedProcesses = processes?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) || [];

  return (
    <DashboardLayout 
      title="Lista de Processos" 
      subtitle="Gerir e acompanhar todos os processos"
    >
      <PageBreadcrumb items={[{ label: "Processos" }]} />

      {/* Resumo de Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-info">{stats?.em_andamento || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-warning">{stats?.urgentes || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Urgentes</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-warning-muted flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-error">{stats?.atrasados || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-error-muted flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-error" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {loadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-success">{stats?.concluidos || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success-muted flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ferramentas */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Linha de Acções Principais */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Pesquisar por nº, assunto ou solicitante..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Pesquisar processos"
                  />
                </div>
                <Button 
                  variant={showAdvancedFilters ? "default" : "outline"}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros Avançados
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Link to="/processes/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Processo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filtros Avançados */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <select 
                      className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                      <option value="">Todos os tipos</option>
                      {processTypes?.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Estado</label>
                    <select 
                      className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <option value="">Todos os estados</option>
                      <option value="rascunho">Rascunho</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
                    <select 
                      className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    >
                      <option value="">Todas</option>
                      <option value="urgente">Urgente</option>
                      <option value="alta">Alta</option>
                      <option value="normal">Normal</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Unidade</label>
                    <select 
                      className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.unit}
                      onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                    >
                      <option value="">Todas as unidades</option>
                      {units?.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Processos */}
      <Card>
        <CardContent className="p-0">
          {loadingProcesses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedProcesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum processo encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters 
                  ? "Tente ajustar os filtros de pesquisa" 
                  : "Comece criando um novo processo"}
              </p>
              {!hasActiveFilters && (
                <Link to="/processes/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Processo
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Nº</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="w-[150px]">Solicitante</TableHead>
                  <TableHead className="w-[180px]">Unidade Actual</TableHead>
                  <TableHead className="w-[120px]">SLA Restante</TableHead>
                  <TableHead className="w-[130px]">Estado</TableHead>
                  <TableHead className="w-[100px] text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProcesses.map((process) => {
                  const status = statusConfig[process.status] || statusConfig.rascunho;
                  const priority = priorityConfig[process.priority] || priorityConfig.normal;
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={process.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <Link 
                            to={`/processes/${process.id}`}
                            className="font-mono text-sm font-medium text-primary hover:underline"
                          >
                            {process.process_number}
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={priority.variant} className="text-xs px-1.5 py-0">
                              {priority.label}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Link 
                            to={`/processes/${process.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                          >
                            {process.subject}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {process.process_type?.name || 'Sem tipo'} • {format(new Date(process.created_at), "dd MMM yyyy", { locale: pt })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{process.requester_name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {process.current_unit?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getSlaDisplay(process)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/processes/${process.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver
                          </Button>
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

      {/* Paginação */}
      {totalProcesses > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            A mostrar {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalProcesses)} de {totalProcesses} processos
          </p>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === page}
                        onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Referência ao Registo de Auditoria */}
      <div className="mt-6">
        <AuditLogReference context="Ver histórico de actividade de processos" />
      </div>
    </DashboardLayout>
  );
};

export default Processes;
