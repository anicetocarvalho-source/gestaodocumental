import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  History, 
  Search,
  Filter,
  Download,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Activity,
  Clock,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuditLogs, useAuditLogStats } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const actionTypes = [
  { value: "create", label: "Criação" },
  { value: "update", label: "Actualização" },
  { value: "delete", label: "Eliminação" },
  { value: "status_change", label: "Mudança de Estado" },
];

const objectTypes = ["Documento", "Despacho", "Processo"];

const getActionIcon = (type: string) => {
  switch (type) {
    case "create": return Plus;
    case "update": case "status_change": return Pencil;
    case "delete": return Trash2;
    default: return History;
  }
};

const getActionBadgeVariant = (type: string): "success" | "warning" | "destructive" | "secondary" | "default" => {
  switch (type) {
    case "create": return "success";
    case "update": case "status_change": return "warning";
    case "delete": return "destructive";
    default: return "default";
  }
};

const AuditLogs = () => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterAction, setFilterAction] = useState("");
  const [filterObject, setFilterObject] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: logs, isLoading, refetch } = useAuditLogs({
    search: searchQuery || undefined,
    actionType: filterAction || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  });
  const { data: stats } = useAuditLogStats();

  const filteredLogs = (logs || []).filter(log => {
    if (filterObject && log.objectType !== filterObject) return false;
    return true;
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const activeFiltersCount = [filterAction, filterObject, filterDateFrom, filterDateTo].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAction("");
    setFilterObject("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchQuery("");
  };

  return (
    <DashboardLayout 
      title="Registos de Actividade" 
      subtitle="Monitorizar todas as actividades e alterações do sistema"
    >
      <PageBreadcrumb 
        items={[
          { label: "Gestão de Utilizadores", href: "/users" },
          { label: "Registos de Actividade" }
        ]} 
      />

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Registos
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.total ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Total Eventos</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.creates ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Criações</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-warning-muted rounded-lg flex items-center justify-center">
                  <Pencil className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">{(stats?.updates ?? 0) + (stats?.statusChanges ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Modificações</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.deletes ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Eliminações</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Pesquisar registos..." 
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant={showFilters ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Acção</Label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {actionTypes.map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Objecto</Label>
                    <Select value={filterObject} onValueChange={setFilterObject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {objectTypes.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input 
                      type="date" 
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input 
                      type="date" 
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredLogs.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum registo de actividade encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Acção
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Detalhes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          IP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => {
                        const IconComponent = getActionIcon(log.actionType);
                        const hasDetails = log.beforeData || log.afterData;
                        const isExpanded = expandedRows.has(log.id);

                        return (
                          <React.Fragment key={log.id}>
                            <tr
                              className={cn(
                                "border-b border-border hover:bg-muted/50 transition-colors",
                                log.severity === "critical" && "bg-destructive/5",
                                isExpanded && "bg-muted/30"
                              )}
                            >
                              <td className="px-4 py-3">
                                {hasDetails && (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => toggleRow(log.id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap font-mono">
                                {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: pt })}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant={getActionBadgeVariant(log.actionType)}>
                                    {log.action}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">{log.objectType}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                                {log.details}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                                {log.ip}
                              </td>
                            </tr>
                            {isExpanded && hasDetails && (
                              <tr className="bg-muted/20">
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="grid grid-cols-2 gap-6 ml-10">
                                    {log.beforeData && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-destructive"></span>
                                          Antes
                                        </h4>
                                        <Card className="bg-destructive/5 border-destructive/20">
                                          <CardContent className="p-3">
                                            <pre className="text-xs font-mono text-foreground overflow-x-auto">
                                              {JSON.stringify(log.beforeData, null, 2)}
                                            </pre>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    )}
                                    {log.afterData && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-success"></span>
                                          Depois
                                        </h4>
                                        <Card className="bg-success/5 border-success/20">
                                          <CardContent className="p-3">
                                            <pre className="text-xs font-mono text-foreground overflow-x-auto">
                                              {JSON.stringify(log.afterData, null, 2)}
                                            </pre>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              A mostrar {filteredLogs.length} de {stats?.total ?? 0} eventos
            </p>
          </div>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Registos</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.creates ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Criações</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-warning-muted rounded-lg flex items-center justify-center">
                  <Pencil className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.statusChanges ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Mudanças Estado</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats?.deletes ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Eliminações</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo de Actividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Dados de actividade carregados da base de dados</p>
                  <p className="text-sm text-muted-foreground">{stats?.total ?? 0} registos totais no sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AuditLogs;
