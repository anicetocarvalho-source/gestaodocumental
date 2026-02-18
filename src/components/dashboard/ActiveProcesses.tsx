import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowRight, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveProcesses } from "@/hooks/useActiveProcesses";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const priorityVariants = {
  high: "error",
  medium: "warning",
  low: "info",
} as const;

const priorityLabels = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export function ActiveProcesses() {
  const { data: processes, isLoading } = useActiveProcesses(4);

  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Processos Activos</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/processes">Ver Todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !processes?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum processo activo</p>
          </div>
        ) : (
          processes.map((process) => (
            <Link key={process.id} to={`/processes/${process.id}`}>
              <div className="rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-card cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{process.name}</h4>
                      <Badge variant={priorityVariants[process.priority]} className="capitalize">
                        {priorityLabels[process.priority]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fase Actual: <span className="text-foreground">{process.stage}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{process.progress}%</span>
                  </div>
                  <Progress value={process.progress} className="h-2" />
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  {process.deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(process.deadline), "d MMM, yyyy", { locale: pt })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{process.assignees} fases</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
