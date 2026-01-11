import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Calendar, 
  FileWarning, 
  Clock, 
  ArrowRight,
  Archive 
} from "lucide-react";
import { useRetentionDashboard } from "@/hooks/useRetentionDashboard";
import { format, parseISO, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

export function RetentionSummary() {
  const { data: summary, isLoading, error } = useRetentionDashboard();

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-sm">Erro ao carregar dados de retenção</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDaysUntilLabel = (date: string) => {
    const days = differenceInDays(parseISO(date), new Date());
    if (days < 0) return "Expirado";
    if (days === 0) return "Hoje";
    if (days === 1) return "Amanhã";
    return `${days} dias`;
  };

  const getDaysUntilVariant = (date: string): "error" | "warning" | "info" => {
    const days = differenceInDays(parseISO(date), new Date());
    if (days <= 2) return "error";
    if (days <= 7) return "warning";
    return "info";
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-warning" />
            Resumo de Retenção Documental
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/archive">
              Ver Arquivo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Pendentes</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-lg font-semibold text-warning">{summary?.totalPending || 0}</p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Archive className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Aprovados</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-lg font-semibold text-success">{summary?.totalApproved || 0}</p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Esta Semana</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-lg font-semibold text-error">{summary?.expiringThisWeek.length || 0}</p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Próx. 30 dias</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-lg font-semibold">{summary?.upcomingDestructions || 0}</p>
            )}
          </div>
        </div>

        {/* Two column layout for lists */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Expiring This Week */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-error animate-pulse" />
              <h4 className="text-xs font-medium text-muted-foreground">A Expirar Esta Semana</h4>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !summary?.expiringThisWeek.length ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhum documento a expirar esta semana</p>
              </div>
            ) : (
              <ScrollArea className="h-[180px]">
                <div className="space-y-2 pr-4">
                  {summary.expiringThisWeek.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.document_id}`}
                      className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {doc.document?.title || "Documento sem título"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {doc.document?.entry_number}
                          </p>
                        </div>
                        <Badge variant={getDaysUntilVariant(doc.scheduled_destruction_date)} className="text-[10px] shrink-0">
                          {getDaysUntilLabel(doc.scheduled_destruction_date)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(doc.scheduled_destruction_date), "d MMM yyyy", { locale: pt })}
                        </span>
                        {doc.document?.classification && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-[10px] text-muted-foreground">
                              {doc.document.classification.code}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Expiring Next Month */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <h4 className="text-xs font-medium text-muted-foreground">A Expirar no Próximo Mês</h4>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !summary?.expiringNextMonth.length ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhum documento a expirar no próximo mês</p>
              </div>
            ) : (
              <ScrollArea className="h-[180px]">
                <div className="space-y-2 pr-4">
                  {summary.expiringNextMonth.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.document_id}`}
                      className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {doc.document?.title || "Documento sem título"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {doc.document?.entry_number}
                          </p>
                        </div>
                        <Badge variant="info" className="text-[10px] shrink-0">
                          {getDaysUntilLabel(doc.scheduled_destruction_date)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(doc.scheduled_destruction_date), "d MMM yyyy", { locale: pt })}
                        </span>
                        {doc.document?.classification && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-[10px] text-muted-foreground">
                              {doc.document.classification.code}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
