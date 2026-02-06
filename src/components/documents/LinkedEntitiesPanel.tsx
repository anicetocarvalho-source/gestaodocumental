import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen,
  FileOutput,
  ChevronRight,
  Clock,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { useDocumentLinkedProcesses, useDocumentLinkedDispatches } from "@/hooks/useCrossModuleData";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

const processStatusConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "secondary" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  em_andamento: { label: "Em Andamento", variant: "info" },
  aguardando_aprovacao: { label: "Aguarda Aprovação", variant: "warning" },
  aprovado: { label: "Aprovado", variant: "success" },
  rejeitado: { label: "Rejeitado", variant: "error" },
  concluido: { label: "Concluído", variant: "success" },
  arquivado: { label: "Arquivado", variant: "secondary" },
};

const dispatchStatusConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "secondary" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  emitido: { label: "Emitido", variant: "info" },
  em_tramite: { label: "Em Trâmite", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
  cancelado: { label: "Cancelado", variant: "error" },
};

const dispatchTypeLabels: Record<string, string> = {
  informativo: "Informativo",
  determinativo: "Determinativo",
  autorizativo: "Autorizativo",
  homologativo: "Homologatório",
  decisorio: "Decisório",
};

interface LinkedEntitiesPanelProps {
  documentId: string;
}

export function LinkedEntitiesPanel({ documentId }: LinkedEntitiesPanelProps) {
  const { data: linkedProcesses, isLoading: loadingProcesses } = useDocumentLinkedProcesses(documentId);
  const { data: linkedDispatches, isLoading: loadingDispatches } = useDocumentLinkedDispatches(documentId);

  const hasProcesses = (linkedProcesses?.length || 0) > 0;
  const hasDispatches = (linkedDispatches?.length || 0) > 0;
  const isLoading = loadingProcesses || loadingDispatches;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entidades Relacionadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasProcesses && !hasDispatches) {
    return null; // Don't show the card if no linked entities
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Entidades Relacionadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Linked Processes */}
        {hasProcesses && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <FolderOpen className="h-3.5 w-3.5" />
              Processos ({linkedProcesses!.length})
            </div>
            {linkedProcesses!.map((proc) => {
              const status = processStatusConfig[proc.status] || processStatusConfig.em_andamento;
              const slaRemaining = proc.deadline 
                ? differenceInDays(new Date(proc.deadline), new Date())
                : null;
                
              return (
                <Link
                  key={proc.linkId}
                  to={`/processes/${proc.id}`}
                  className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {proc.process_number}
                        </span>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{proc.subject}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {proc.current_unit && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {proc.current_unit.name}
                          </span>
                        )}
                        {slaRemaining !== null && (
                          <span className={`flex items-center gap-1 ${
                            slaRemaining <= 3 ? "text-destructive" : slaRemaining <= 10 ? "text-warning" : ""
                          }`}>
                            {slaRemaining <= 3 && <AlertTriangle className="h-3 w-3" />}
                            {slaRemaining > 0 ? `${slaRemaining}d restantes` : "Vencido"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Linked Dispatches */}
        {hasDispatches && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <FileOutput className="h-3.5 w-3.5" />
              Despachos ({linkedDispatches!.length})
            </div>
            {linkedDispatches!.map((disp) => {
              const status = dispatchStatusConfig[disp.status] || dispatchStatusConfig.rascunho;
              
              return (
                <Link
                  key={disp.linkId}
                  to={`/dispatches/${disp.id}`}
                  className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {disp.dispatch_number}
                        </span>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{disp.subject}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{dispatchTypeLabels[disp.dispatch_type] || disp.dispatch_type}</span>
                        {disp.origin_unit && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {disp.origin_unit.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
