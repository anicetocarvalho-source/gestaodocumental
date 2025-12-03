import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Calendar
} from "lucide-react";

// Dados dos processos
const processes = [
  {
    id: 1,
    number: "PROC-2024-0001",
    subject: "Licitação - Aquisição de Equipamentos",
    requester: "Maria Silva",
    currentUnit: "Sector de Compras",
    slaRemaining: 5,
    status: "em_andamento",
    type: "Licitação",
    priority: "alta",
    date: "15 Nov 2024",
  },
  {
    id: 2,
    number: "PROC-2024-0002",
    subject: "Contratação de Serviços de TI",
    requester: "Carlos Mendes",
    currentUnit: "Departamento Jurídico",
    slaRemaining: 12,
    status: "em_andamento",
    type: "Contratação",
    priority: "média",
    date: "14 Nov 2024",
  },
  {
    id: 3,
    number: "PROC-2024-0003",
    subject: "Renovação de Contrato - Limpeza",
    requester: "Ana Costa",
    currentUnit: "Gabinete",
    slaRemaining: 2,
    status: "urgente",
    type: "Renovação",
    priority: "alta",
    date: "13 Nov 2024",
  },
  {
    id: 4,
    number: "PROC-2024-0004",
    subject: "Solicitação de Recursos - Educação",
    requester: "João Santos",
    currentUnit: "Secretaria de Educação",
    slaRemaining: 20,
    status: "em_andamento",
    type: "Solicitação",
    priority: "baixa",
    date: "12 Nov 2024",
  },
  {
    id: 5,
    number: "PROC-2024-0005",
    subject: "Parecer Técnico - Obra Pública",
    requester: "Roberto Lima",
    currentUnit: "Sector de Engenharia",
    slaRemaining: 0,
    status: "concluido",
    type: "Parecer",
    priority: "média",
    date: "10 Nov 2024",
  },
  {
    id: 6,
    number: "PROC-2024-0006",
    subject: "Convénio - Parceria Estadual",
    requester: "Lúcia Ferreira",
    currentUnit: "Sector de Convénios",
    slaRemaining: -3,
    status: "atrasado",
    type: "Convénio",
    priority: "alta",
    date: "08 Nov 2024",
  },
  {
    id: 7,
    number: "PROC-2024-0007",
    subject: "Auditoria Interna - Financeiro",
    requester: "Paulo Ribeiro",
    currentUnit: "Controladoria",
    slaRemaining: 8,
    status: "suspenso",
    type: "Auditoria",
    priority: "média",
    date: "05 Nov 2024",
  },
  {
    id: 8,
    number: "PROC-2024-0008",
    subject: "Recurso Administrativo - Multa",
    requester: "Fernanda Oliveira",
    currentUnit: "Procuradoria",
    slaRemaining: 15,
    status: "em_andamento",
    type: "Recurso",
    priority: "baixa",
    date: "01 Nov 2024",
  },
];

const statusConfig = {
  em_andamento: { label: "Em Andamento", variant: "info" as const, icon: Clock },
  concluido: { label: "Concluído", variant: "success" as const, icon: CheckCircle },
  urgente: { label: "Urgente", variant: "warning" as const, icon: AlertCircle },
  atrasado: { label: "Atrasado", variant: "error" as const, icon: AlertCircle },
  suspenso: { label: "Suspenso", variant: "secondary" as const, icon: Pause },
};

const priorityConfig = {
  alta: { label: "Alta", variant: "error" as const },
  média: { label: "Média", variant: "warning" as const },
  baixa: { label: "Baixa", variant: "info" as const },
};

const processTypes = ["Licitação", "Contratação", "Renovação", "Solicitação", "Parecer", "Convénio", "Auditoria", "Recurso"];
const units = ["Sector de Compras", "Departamento Jurídico", "Gabinete", "Secretaria de Educação", "Sector de Engenharia", "Sector de Convénios", "Controladoria", "Procuradoria"];

const Processes = () => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    number: "",
    type: "",
    status: "",
    priority: "",
    unit: "",
    dateFrom: "",
    dateTo: "",
  });

  const getSlaDisplay = (days: number) => {
    if (days < 0) {
      return <span className="text-error font-medium">{Math.abs(days)} dias atrasado</span>;
    } else if (days === 0) {
      return <span className="text-success font-medium">Concluído</span>;
    } else if (days <= 3) {
      return <span className="text-warning font-medium">{days} dias</span>;
    }
    return <span className="text-muted-foreground">{days} dias</span>;
  };

  const clearFilters = () => {
    setFilters({
      number: "",
      type: "",
      status: "",
      priority: "",
      unit: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

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
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-2xl font-bold text-info">15</p>
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
                <p className="text-2xl font-bold text-warning">3</p>
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
                <p className="text-2xl font-bold text-error">2</p>
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
                <p className="text-2xl font-bold text-success">4</p>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nº do Processo</label>
                    <Input 
                      placeholder="PROC-2024-..." 
                      value={filters.number}
                      onChange={(e) => setFilters({ ...filters, number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <select 
                      className="h-10 w-full px-3 border border-border rounded-md bg-background text-sm"
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                      <option value="">Todos os tipos</option>
                      {processTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
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
                      <option value="em_andamento">Em Andamento</option>
                      <option value="urgente">Urgente</option>
                      <option value="atrasado">Atrasado</option>
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
                      <option value="alta">Alta</option>
                      <option value="média">Média</option>
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
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Data</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="date" 
                        className="flex-1"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      />
                    </div>
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
                  <Button size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Aplicar Filtros
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
              {processes.map((process) => {
                const status = statusConfig[process.status as keyof typeof statusConfig];
                const priority = priorityConfig[process.priority as keyof typeof priorityConfig];
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={process.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <Link 
                          to={`/processes/${process.id}`}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {process.number}
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
                        <p className="text-xs text-muted-foreground">{process.type} • {process.date}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{process.requester}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{process.currentUnit}</span>
                    </TableCell>
                    <TableCell>
                      {getSlaDisplay(process.slaRemaining)}
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
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          A mostrar 1-8 de 24 processos
        </p>
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
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Referência ao Registo de Auditoria */}
      <div className="mt-6">
        <AuditLogReference context="Ver histórico de actividade de processos" />
      </div>
    </DashboardLayout>
  );
};

export default Processes;
