import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Bell,
  CheckCircle,
  RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, isPast, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SLAAlert {
  id: string;
  number: string;
  subject: string;
  deadline: string;
  daysRemaining: number;
  status: "overdue" | "critical" | "warning" | "ok";
  type: "process" | "dispatch";
  unitName?: string;
  responsibleName?: string;
}

interface SLAAlertsPanelProps {
  unitId?: string;
  compact?: boolean;
}

export function SLAAlertsPanel({ unitId, compact = false }: SLAAlertsPanelProps) {
  const navigate = useNavigate();

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ["sla-alerts", unitId],
    queryFn: async (): Promise<SLAAlert[]> => {
      const allAlerts: SLAAlert[] = [];
      const today = new Date();

      // Get processes with deadlines
      let processQuery = supabase
        .from("processes")
        .select(`
          id,
          process_number,
          subject,
          deadline,
          current_unit:organizational_units!processes_current_unit_id_fkey(name),
          responsible:profiles!processes_responsible_user_id_fkey(full_name)
        `)
        .not("deadline", "is", null)
        .in("status", ["em_andamento", "aguardando_aprovacao"])
        .order("deadline", { ascending: true });

      if (unitId) {
        processQuery = processQuery.eq("current_unit_id", unitId);
      }

      const { data: processes } = await processQuery;

      if (processes) {
        for (const proc of processes) {
          const deadline = new Date(proc.deadline!);
          const daysRemaining = differenceInDays(deadline, today);
          
          let status: SLAAlert["status"] = "ok";
          if (isPast(deadline)) {
            status = "overdue";
          } else if (daysRemaining <= 1) {
            status = "critical";
          } else if (daysRemaining <= 3) {
            status = "warning";
          }

          if (status !== "ok" || daysRemaining <= 5) {
            allAlerts.push({
              id: proc.id,
              number: proc.process_number,
              subject: proc.subject,
              deadline: proc.deadline!,
              daysRemaining,
              status,
              type: "process",
              unitName: (proc.current_unit as { name: string } | null)?.name,
              responsibleName: (proc.responsible as { full_name: string } | null)?.full_name,
            });
          }
        }
      }

      // Get dispatches with deadlines
      let dispatchQuery = supabase
        .from("dispatches")
        .select(`
          id,
          dispatch_number,
          subject,
          deadline,
          origin_unit:organizational_units!dispatches_origin_unit_id_fkey(name)
        `)
        .not("deadline", "is", null)
        .in("status", ["emitido", "em_tramite"])
        .order("deadline", { ascending: true });

      if (unitId) {
        dispatchQuery = dispatchQuery.eq("origin_unit_id", unitId);
      }

      const { data: dispatches } = await dispatchQuery;

      if (dispatches) {
        for (const disp of dispatches) {
          const deadline = new Date(disp.deadline!);
          const daysRemaining = differenceInDays(deadline, today);
          
          let status: SLAAlert["status"] = "ok";
          if (isPast(deadline)) {
            status = "overdue";
          } else if (daysRemaining <= 1) {
            status = "critical";
          } else if (daysRemaining <= 3) {
            status = "warning";
          }

          if (status !== "ok" || daysRemaining <= 5) {
            allAlerts.push({
              id: disp.id,
              number: disp.dispatch_number,
              subject: disp.subject,
              deadline: disp.deadline!,
              daysRemaining,
              status,
              type: "dispatch",
              unitName: (disp.origin_unit as { name: string } | null)?.name,
            });
          }
        }
      }

      // Sort by urgency
      return allAlerts.sort((a, b) => {
        const statusOrder = { overdue: 0, critical: 1, warning: 2, ok: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.daysRemaining - b.daysRemaining;
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const overdueCount = alerts?.filter(a => a.status === "overdue").length || 0;
  const criticalCount = alerts?.filter(a => a.status === "critical").length || 0;
  const warningCount = alerts?.filter(a => a.status === "warning").length || 0;

  const getStatusConfig = (status: SLAAlert["status"]) => {
    switch (status) {
      case "overdue":
        return { 
          icon: AlertCircle, 
          color: "text-destructive", 
          bg: "bg-destructive/10",
          badge: "destructive" as const,
          label: "Atrasado" 
        };
      case "critical":
        return { 
          icon: AlertTriangle, 
          color: "text-warning", 
          bg: "bg-warning/10",
          badge: "secondary" as const,
          label: "Crítico" 
        };
      case "warning":
        return { 
          icon: Clock, 
          color: "text-orange-500", 
          bg: "bg-orange-500/10",
          badge: "outline" as const,
          label: "Atenção" 
        };
      default:
        return { 
          icon: CheckCircle, 
          color: "text-success", 
          bg: "bg-success/10",
          badge: "default" as const,
          label: "Normal" 
        };
    }
  };

  const handleClick = (alert: SLAAlert) => {
    if (alert.type === "process") {
      navigate(`/processes/${alert.id}`);
    } else {
      navigate(`/dispatches/${alert.id}`);
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas SLA
            </CardTitle>
            <div className="flex gap-2">
              {overdueCount > 0 && (
                <Badge variant="destructive">{overdueCount} atrasado{overdueCount > 1 ? "s" : ""}</Badge>
              )}
              {criticalCount > 0 && (
                <Badge variant="secondary">{criticalCount} crítico{criticalCount > 1 ? "s" : ""}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => {
                const config = getStatusConfig(alert.status);
                const IconComponent = config.icon;

                return (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleClick(alert)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1 rounded", config.bg)}>
                        <IconComponent className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{alert.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.daysRemaining < 0 
                            ? `${Math.abs(alert.daysRemaining)} dias atrasado`
                            : `${alert.daysRemaining} dias restantes`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
              {alerts.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/reports")}>
                  Ver todos ({alerts.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-sm">Sem alertas de SLA</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de SLA
            </CardTitle>
            <CardDescription>Processos e despachos próximos ou após o prazo</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Badges */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">{overdueCount} Atrasados</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">{criticalCount} Críticos</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{warningCount} Atenção</span>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = getStatusConfig(alert.status);
                const IconComponent = config.icon;

                return (
                  <div 
                    key={alert.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => handleClick(alert)}
                  >
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <IconComponent className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{alert.number}</span>
                        <Badge variant={config.badge}>{config.label}</Badge>
                        <Badge variant="outline">{alert.type === "process" ? "Processo" : "Despacho"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{alert.subject}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Prazo: {format(new Date(alert.deadline), "dd/MM/yyyy", { locale: pt })}</span>
                        {alert.unitName && <span>• {alert.unitName}</span>}
                        {alert.responsibleName && <span>• {alert.responsibleName}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-2xl font-bold", config.color)}>
                        {Math.abs(alert.daysRemaining)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {alert.daysRemaining < 0 ? "dias atrasado" : "dias restantes"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <p>Sem alertas de SLA no momento</p>
            <p className="text-sm">Todos os processos e despachos estão dentro do prazo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
