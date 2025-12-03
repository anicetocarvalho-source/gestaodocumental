import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
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
import { Calendar } from "@/components/ui/calendar";
import { 
  FileText, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Plus,
  CalendarIcon,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  XCircle,
  AlertCircle,
  Send,
  ArrowRight,
  X,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types
interface Dispatch {
  id: string;
  numero: string;
  tipo: "informativo" | "determinativo" | "autorizativo" | "homologativo" | "decisorio";
  unidade: string;
  data: string;
  estado: "rascunho" | "emitido" | "em_tramite" | "concluido" | "cancelado";
  prazo: string | null;
  assinante: string;
  autor: string;
  assunto: string;
}

// Sample Data
const dispatches: Dispatch[] = [
  { id: "1", numero: "DESP-2024-0145", tipo: "autorizativo", unidade: "Gabinete do Director-Geral", data: "2024-01-15", estado: "emitido", prazo: "2024-01-22", assinante: "Dr. António Silva", autor: "Maria Santos", assunto: "Autorização de despesa - Equipamentos" },
  { id: "2", numero: "DESP-2024-0144", tipo: "determinativo", unidade: "Direcção de Recursos Humanos", data: "2024-01-14", estado: "em_tramite", prazo: "2024-01-21", assinante: "Dra. Maria Santos", autor: "João Costa", assunto: "Determinação de férias colectivas" },
  { id: "3", numero: "DESP-2024-0143", tipo: "informativo", unidade: "Direcção de Administração e Finanças", data: "2024-01-13", estado: "concluido", prazo: null, assinante: "Eng. João Costa", autor: "Ana Rodrigues", assunto: "Informação sobre orçamento Q1" },
  { id: "4", numero: "DESP-2024-0142", tipo: "homologativo", unidade: "Direcção Jurídica", data: "2024-01-12", estado: "emitido", prazo: "2024-01-19", assinante: "Dr. Carlos Ferreira", autor: "Pedro Almeida", assunto: "Homologação de contrato" },
  { id: "5", numero: "DESP-2024-0141", tipo: "decisorio", unidade: "Gabinete de Planeamento", data: "2024-01-11", estado: "cancelado", prazo: null, assinante: "Dra. Ana Rodrigues", autor: "Teresa Gomes", assunto: "Decisão sobre projecto X" },
  { id: "6", numero: "DESP-2024-0140", tipo: "autorizativo", unidade: "Direcção de Operações", data: "2024-01-10", estado: "rascunho", prazo: "2024-01-17", assinante: "Dr. Pedro Almeida", autor: "Carlos Ferreira", assunto: "Autorização de viagem" },
  { id: "7", numero: "DESP-2024-0139", tipo: "informativo", unidade: "Secretaria-Geral", data: "2024-01-09", estado: "emitido", prazo: null, assinante: "Dra. Teresa Gomes", autor: "António Silva", assunto: "Comunicação de alterações" },
  { id: "8", numero: "DESP-2024-0138", tipo: "determinativo", unidade: "Direcção de Tecnologias de Informação", data: "2024-01-08", estado: "em_tramite", prazo: "2024-01-15", assinante: "Eng. António Ribeiro", autor: "Maria Santos", assunto: "Determinação de actualização de sistemas" },
];

const tipoOptions = [
  { value: "informativo", label: "Informativo" },
  { value: "determinativo", label: "Determinativo" },
  { value: "autorizativo", label: "Autorizativo" },
  { value: "homologativo", label: "Homologatório" },
  { value: "decisorio", label: "Decisório" },
];

const unidadeOptions = [
  "Gabinete do Director-Geral",
  "Direcção de Administração e Finanças",
  "Direcção de Recursos Humanos",
  "Direcção de Tecnologias de Informação",
  "Direcção Jurídica",
  "Direcção de Operações",
  "Gabinete de Planeamento",
  "Secretaria-Geral",
];

const estadoOptions = [
  { value: "rascunho", label: "Rascunho" },
  { value: "emitido", label: "Emitido" },
  { value: "em_tramite", label: "Em Trâmite" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const autorOptions = [
  "Maria Santos",
  "João Costa",
  "Ana Rodrigues",
  "Pedro Almeida",
  "Teresa Gomes",
  "Carlos Ferreira",
  "António Silva",
];

const stats = [
  { icon: FileText, label: "Total", value: 156, color: "text-primary" },
  { icon: Send, label: "Emitidos", value: 89, color: "text-success" },
  { icon: Clock, label: "Em Trâmite", value: 34, color: "text-warning" },
  { icon: CheckCircle, label: "Concluídos", value: 28, color: "text-info" },
  { icon: XCircle, label: "Cancelados", value: 5, color: "text-destructive" },
];

const DispatchManagement = () => {
  const navigate = useNavigate();
  const [selectedDispatches, setSelectedDispatches] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterUnidade, setFilterUnidade] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterAutor, setFilterAutor] = useState<string>("");
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const toggleDispatchSelection = (id: string) => {
    const newSelected = new Set(selectedDispatches);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDispatches(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDispatches.size === dispatches.length) {
      setSelectedDispatches(new Set());
    } else {
      setSelectedDispatches(new Set(dispatches.map(d => d.id)));
    }
  };

  const clearFilters = () => {
    setFilterTipo("");
    setFilterUnidade("");
    setFilterEstado("");
    setFilterAutor("");
    setFilterDate(undefined);
    setSearchQuery("");
  };

  const hasActiveFilters = filterTipo || filterUnidade || filterEstado || filterAutor || filterDate || searchQuery;

  // Filter dispatches
  const filteredDispatches = dispatches.filter(d => {
    const matchesTipo = !filterTipo || filterTipo === "all" || d.tipo === filterTipo;
    const matchesUnidade = !filterUnidade || filterUnidade === "all" || d.unidade === filterUnidade;
    const matchesEstado = !filterEstado || filterEstado === "all" || d.estado === filterEstado;
    const matchesAutor = !filterAutor || filterAutor === "all" || d.autor === filterAutor;
    const matchesDate = !filterDate || d.data === format(filterDate, "yyyy-MM-dd");
    const matchesSearch = !searchQuery || 
      d.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assunto.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTipo && matchesUnidade && matchesEstado && matchesAutor && matchesDate && matchesSearch;
  });

  const getTipoBadge = (tipo: Dispatch["tipo"]) => {
    const colors: Record<Dispatch["tipo"], string> = {
      informativo: "bg-info/10 text-info border-info/20",
      determinativo: "bg-warning/10 text-warning border-warning/20",
      autorizativo: "bg-success/10 text-success border-success/20",
      homologativo: "bg-primary/10 text-primary border-primary/20",
      decisorio: "bg-destructive/10 text-destructive border-destructive/20",
    };
    const labels: Record<Dispatch["tipo"], string> = {
      informativo: "Informativo",
      determinativo: "Determinativo",
      autorizativo: "Autorizativo",
      homologativo: "Homologatório",
      decisorio: "Decisório",
    };
    return <Badge variant="outline" className={cn("border", colors[tipo])}>{labels[tipo]}</Badge>;
  };

  const getEstadoBadge = (estado: Dispatch["estado"]) => {
    switch (estado) {
      case "rascunho":
        return <Badge variant="secondary"><Edit className="h-3 w-3 mr-1" />Rascunho</Badge>;
      case "emitido":
        return <Badge variant="default"><Send className="h-3 w-3 mr-1" />Emitido</Badge>;
      case "em_tramite":
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Em Trâmite</Badge>;
      case "concluido":
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case "cancelado":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
    }
  };

  const isPrazoVencido = (prazo: string | null) => {
    if (!prazo) return false;
    return new Date(prazo) < new Date();
  };

  return (
    <DashboardLayout 
      title="Gestão de Despachos" 
      subtitle="Consulta e gestão de despachos institucionais"
    >
      <PageBreadcrumb items={[{ label: "Gestão de Despachos" }]} />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} variant="stat">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg bg-muted flex items-center justify-center", stat.color)}>
                  <stat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Pesquisar por nº ou assunto..." 
                      className="pl-10 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Tipo Filter */}
                  <Select value={filterTipo || "all"} onValueChange={(v) => setFilterTipo(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {tipoOptions.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Unidade Filter */}
                  <Select value={filterUnidade || "all"} onValueChange={(v) => setFilterUnidade(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Unidades</SelectItem>
                      {unidadeOptions.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Estado Filter */}
                  <Select value={filterEstado || "all"} onValueChange={(v) => setFilterEstado(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Estados</SelectItem>
                      {estadoOptions.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Autor Filter */}
                  <Select value={filterAutor || "all"} onValueChange={(v) => setFilterAutor(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Autor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Autores</SelectItem>
                      {autorOptions.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-40 justify-start text-left font-normal", !filterDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "dd/MM/yyyy") : "Data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button onClick={() => navigate("/dispatches/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Despacho
                  </Button>
                </div>
              </div>

              {/* Batch Actions */}
              {selectedDispatches.size > 0 && (
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">{selectedDispatches.size} seleccionados</span>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Emitir
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Converter em Processo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dispatches Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="grid">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-4 py-3 text-left w-10">
                      <Checkbox
                        checked={selectedDispatches.size === dispatches.length && dispatches.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nº</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prazo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assinante</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispatches.map((dispatch) => (
                    <tr
                      key={dispatch.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/50 transition-colors",
                        selectedDispatches.has(dispatch.id) && "bg-primary/5",
                        dispatch.estado === "cancelado" && "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedDispatches.has(dispatch.id)}
                          onCheckedChange={() => toggleDispatchSelection(dispatch.id)}
                          aria-label={`Seleccionar ${dispatch.numero}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-mono font-medium text-foreground">{dispatch.numero}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{dispatch.assunto}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getTipoBadge(dispatch.tipo)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground truncate max-w-[180px]">{dispatch.unidade}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(dispatch.data), "dd/MM/yyyy")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {getEstadoBadge(dispatch.estado)}
                      </td>
                      <td className="px-4 py-3">
                        {dispatch.prazo ? (
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            isPrazoVencido(dispatch.prazo) && dispatch.estado !== "concluido" && dispatch.estado !== "cancelado"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}>
                            {isPrazoVencido(dispatch.prazo) && dispatch.estado !== "concluido" && dispatch.estado !== "cancelado" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {format(new Date(dispatch.prazo), "dd/MM/yyyy")}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{dispatch.assinante}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Acções para ${dispatch.numero}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={dispatch.estado === "concluido" || dispatch.estado === "cancelado"}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ArrowRight className="mr-2 h-4 w-4" /> Converter em Processo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              disabled={dispatch.estado === "concluido" || dispatch.estado === "cancelado"}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredDispatches.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhum despacho encontrado</p>
                        {hasActiveFilters && (
                          <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                            Limpar filtros
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            A mostrar {filteredDispatches.length} de {dispatches.length} despachos
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Seguinte</Button>
          </div>
        </div>

        {/* Audit Log Reference */}
        <AuditLogReference context="Ver histórico de actividade de despachos" />
      </div>
    </DashboardLayout>
  );
};

export default DispatchManagement;
