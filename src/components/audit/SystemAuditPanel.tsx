import { useMemo, useState, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Database, Filter, Loader2, RefreshCw, ShieldAlert, X,
  ChevronDown, ChevronRight, History,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useSystemAuditLogs,
  useSystemAuditOrganizations,
  useSystemAuditTables,
  type SystemAuditFilters,
} from "@/hooks/useSystemAuditLogs";

const ACTION_OPTIONS = [
  { value: "INSERT", label: "Inserção" },
  { value: "UPDATE", label: "Actualização" },
  { value: "DELETE", label: "Eliminação" },
];

const ALL = "__all__";

const actionVariant = (a: string): "success" | "warning" | "destructive" | "default" => {
  if (a === "INSERT") return "success";
  if (a === "UPDATE") return "warning";
  if (a === "DELETE") return "destructive";
  return "default";
};

export default function SystemAuditPanel() {
  const { hasAnyRole, isLoading: loadingRole } = useUserRole();
  const isAuthorized = hasAnyRole(["admin", "gestor"]);

  const [filters, setFilters] = useState<SystemAuditFilters>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: orgs = [] } = useSystemAuditOrganizations();
  const { data: tables = [] } = useSystemAuditTables();
  const { data: logs = [], isLoading, refetch, isFetching } = useSystemAuditLogs(filters);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => !!v).length,
    [filters]
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (loadingRole) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h3 className="font-semibold">Acesso restrito</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Apenas administradores e gestores podem consultar o registo de auditoria do sistema.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Filtros</h3>
          {activeCount > 0 && (
            <Badge variant="default" className="h-5 px-2">{activeCount}</Badge>
          )}
          <div className="ml-auto flex gap-2">
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({})} className="gap-1">
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Organização
            </Label>
            <Select
              value={filters.organizationId ?? ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, organizationId: v === ALL ? undefined : v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Database className="h-3 w-3" /> Tabela
            </Label>
            <Select
              value={filters.tableName ?? ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, tableName: v === ALL ? undefined : v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {tables.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Acção</Label>
            <Select
              value={filters.action ?? ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, action: v === ALL ? undefined : v }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Data Início</Label>
            <Input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Data Fim</Label>
            <Input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))
              }
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum evento corresponde aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acção</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tabela</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilizador</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organização</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isOpen = expanded.has(log.id);
                    const hasDetail = !!(log.old_data || log.new_data);
                    return (
                      <Fragment key={log.id}>
                        <tr className={cn("border-b border-border hover:bg-muted/50", isOpen && "bg-muted/30")}>
                          <td className="px-4 py-3">
                            {hasDetail && (
                              <Button variant="ghost" size="icon-sm" onClick={() => toggle(log.id)}>
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground font-mono whitespace-nowrap">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: pt })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">{log.table_name}</td>
                          <td className="px-4 py-3 text-sm">{log.user_name ?? <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-4 py-3 text-sm">{log.organization_name ?? <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                            {log.record_id}
                          </td>
                        </tr>
                        {isOpen && hasDetail && (
                          <tr className="bg-muted/20">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid md:grid-cols-2 gap-4 ml-10">
                                {log.old_data && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full bg-destructive" /> Antes
                                    </h4>
                                    <Card className="bg-destructive/5 border-destructive/20">
                                      <CardContent className="p-3">
                                        <pre className="text-xs font-mono overflow-x-auto">
                                          {JSON.stringify(log.old_data, null, 2)}
                                        </pre>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                                {log.new_data && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full bg-success" /> Depois
                                    </h4>
                                    <Card className="bg-success/5 border-success/20">
                                      <CardContent className="p-3">
                                        <pre className="text-xs font-mono overflow-x-auto">
                                          {JSON.stringify(log.new_data, null, 2)}
                                        </pre>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        A mostrar {logs.length} evento(s). Limite de 200 por consulta — refine os filtros para resultados específicos.
      </p>
    </div>
  );
}
