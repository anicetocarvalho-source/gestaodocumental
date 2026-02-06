import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus,
  CalendarIcon,
  MoreVertical,
  Eye,
  Edit,
  XCircle,
  Send,
  X,
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
import { toast } from "sonner";
import {
  useDispatches,
  useDispatchStats,
  useEmitDispatch,
  useCancelDispatch,
  dispatchTypeLabels,
  dispatchStatusLabels,
  DispatchFilters,
} from "@/hooks/useDispatches";
import { useOrganizationalUnits } from "@/hooks/useReferenceData";
import { Database } from "@/integrations/supabase/types";

type DispatchType = Database["public"]["Enums"]["dispatch_type"];
type DispatchStatus = Database["public"]["Enums"]["dispatch_status"];

const dispatchTypes: DispatchType[] = ["informativo", "determinativo", "autorizativo", "homologativo", "decisorio"];
const dispatchStatuses: DispatchStatus[] = ["rascunho", "emitido", "em_tramite", "concluido", "cancelado"];

const DispatchManagement = () => {
  const navigate = useNavigate();
  const [selectedDispatches, setSelectedDispatches] = useState<Set<string>>(new Set());
  
  // Filters
  const [filters, setFilters] = useState<DispatchFilters>({});
  const [filterDate, setFilterDate] = useState<Date | undefined>();

  const { data: dispatches, isLoading, error } = useDispatches(filters);
  const { data: stats } = useDispatchStats();
  const { data: units } = useOrganizationalUnits();
  const emitDispatch = useEmitDispatch();
  const cancelDispatch = useCancelDispatch();

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
    if (dispatches && selectedDispatches.size === dispatches.length) {
      setSelectedDispatches(new Set());
    } else if (dispatches) {
      setSelectedDispatches(new Set(dispatches.map(d => d.id)));
    }
  };

  const clearFilters = () => {
    setFilters({});
    setFilterDate(undefined);
  };

  const handleDateChange = (date: Date | undefined) => {
    setFilterDate(date);
    if (date) {
      setFilters(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
    } else {
      setFilters(prev => {
        const { date, ...rest } = prev;
        return rest;
      });
    }
  };

  const hasActiveFilters = filters.search || filters.dispatch_type || filters.status || filters.origin_unit_id || filterDate;

  const handleEmit = async (id: string) => {
    try {
      await emitDispatch.mutateAsync(id);
      toast.success("Despacho emitido com sucesso!");
    } catch (err) {
      toast.error("Erro ao emitir despacho");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelDispatch.mutateAsync({ id });
      toast.success("Despacho cancelado");
    } catch (err) {
      toast.error("Erro ao cancelar despacho");
    }
  };

  const getTipoBadge = (tipo: DispatchType) => {
    const colors: Record<DispatchType, string> = {
      informativo: "bg-info/10 text-info border-info/20",
      determinativo: "bg-warning/10 text-warning border-warning/20",
      autorizativo: "bg-success/10 text-success border-success/20",
      homologativo: "bg-primary/10 text-primary border-primary/20",
      decisorio: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={cn("border", colors[tipo])}>{dispatchTypeLabels[tipo]}</Badge>;
  };

  const getEstadoBadge = (estado: DispatchStatus) => {
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

  const statsData = [
    { icon: FileText, label: "Total", value: stats?.total || 0, color: "text-primary" },
    { icon: Send, label: "Emitidos", value: stats?.emitido || 0, color: "text-success" },
    { icon: Clock, label: "Em Trâmite", value: stats?.em_tramite || 0, color: "text-warning" },
    { icon: CheckCircle, label: "Concluídos", value: stats?.concluido || 0, color: "text-info" },
    { icon: XCircle, label: "Cancelados", value: stats?.cancelado || 0, color: "text-destructive" },
  ];

  return (
    <DashboardLayout 
      title="Gestão de Despachos" 
      subtitle="Consulta e gestão de despachos institucionais"
    >
      <PageBreadcrumb items={[{ label: "Gestão de Despachos" }]} />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statsData.map((stat, i) => (
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
                      value={filters.search || ""}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  
                  {/* Tipo Filter */}
                  <Select 
                    value={filters.dispatch_type || "all"} 
                    onValueChange={(v) => setFilters(prev => ({ ...prev, dispatch_type: v === "all" ? undefined : v as DispatchType }))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {dispatchTypes.map(t => (
                        <SelectItem key={t} value={t}>{dispatchTypeLabels[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Unidade Filter */}
                  <Select 
                    value={filters.origin_unit_id || "all"} 
                    onValueChange={(v) => setFilters(prev => ({ ...prev, origin_unit_id: v === "all" ? undefined : v }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Unidades</SelectItem>
                      {units?.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Estado Filter */}
                  <Select 
                    value={filters.status || "all"} 
                    onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === "all" ? undefined : v as DispatchStatus }))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Estados</SelectItem>
                      {dispatchStatuses.map(s => (
                        <SelectItem key={s} value={s}>{dispatchStatusLabels[s]}</SelectItem>
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
                        onSelect={handleDateChange}
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
                  <Button variant="outline" size="sm" onClick={async () => {
                    const ids = Array.from(selectedDispatches);
                    try {
                      await Promise.all(ids.map(id => emitDispatch.mutateAsync(id)));
                      toast.success(`${ids.length} despacho(s) emitido(s) com sucesso`);
                    } catch (err) {
                      toast.error("Erro ao emitir despachos em lote");
                    }
                    setSelectedDispatches(new Set());
                  }}>
                    <Send className="h-4 w-4 mr-2" />
                    Emitir
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                    const ids = Array.from(selectedDispatches);
                    try {
                      await Promise.all(ids.map(id => cancelDispatch.mutateAsync({ id })));
                      toast.success(`${ids.length} despacho(s) cancelado(s)`);
                    } catch (err) {
                      toast.error("Erro ao cancelar despachos em lote");
                    }
                    setSelectedDispatches(new Set());
                  }}>
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
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-48 flex-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center text-destructive">
                Erro ao carregar despachos
              </div>
            ) : !dispatches || dispatches.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum despacho encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters ? "Tente ajustar os filtros de pesquisa" : "Comece por criar um novo despacho"}
                </p>
                {!hasActiveFilters && (
                  <Button onClick={() => navigate("/dispatches/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Despacho
                  </Button>
                )}
              </div>
            ) : (
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
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assunto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prazo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatches.map((dispatch) => (
                      <tr
                        key={dispatch.id}
                        className={cn(
                          "border-b border-border hover:bg-muted/50 transition-colors",
                          selectedDispatches.has(dispatch.id) && "bg-primary/5",
                          dispatch.status === "cancelado" && "opacity-60"
                        )}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedDispatches.has(dispatch.id)}
                            onCheckedChange={() => toggleDispatchSelection(dispatch.id)}
                            disabled={dispatch.status === "cancelado" || dispatch.status === "concluido"}
                            aria-label={`Seleccionar despacho ${dispatch.dispatch_number}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-primary">
                            {dispatch.dispatch_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getTipoBadge(dispatch.dispatch_type)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground line-clamp-1 max-w-xs">
                            {dispatch.subject}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {dispatch.origin_unit?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(dispatch.created_at), "dd/MM/yyyy", { locale: pt })}
                        </td>
                        <td className="px-4 py-3">
                          {getEstadoBadge(dispatch.status)}
                        </td>
                        <td className="px-4 py-3">
                          {dispatch.deadline ? (
                            <span className={cn(
                              "text-sm",
                              isPrazoVencido(dispatch.deadline) && dispatch.status !== "concluido" && dispatch.status !== "cancelado"
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            )}>
                              {format(new Date(dispatch.deadline), "dd/MM/yyyy", { locale: pt })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate(`/dispatches/${dispatch.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              {dispatch.status === "rascunho" && (
                                <>
                                  <DropdownMenuItem onClick={() => navigate(`/dispatches/${dispatch.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEmit(dispatch.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Emitir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleCancel(dispatch.id)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DispatchManagement;
