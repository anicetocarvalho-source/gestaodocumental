import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const processes = [
  {
    id: 1,
    name: "Fluxo de Aprovação de Orçamento",
    stage: "Revisão Financeira",
    progress: 75,
    deadline: "15 Dez, 2024",
    assignees: 3,
    priority: "high",
  },
  {
    id: 2,
    name: "Processo de Renovação de Contrato",
    stage: "Revisão Jurídica",
    progress: 45,
    deadline: "20 Dez, 2024",
    assignees: 2,
    priority: "medium",
  },
  {
    id: 3,
    name: "Procedimento de Actualização de Política",
    stage: "Comentário Público",
    progress: 90,
    deadline: "8 Dez, 2024",
    assignees: 5,
    priority: "low",
  },
  {
    id: 4,
    name: "Revisão de Avaliação de Fornecedor",
    stage: "Triagem Inicial",
    progress: 20,
    deadline: "30 Dez, 2024",
    assignees: 4,
    priority: "medium",
  },
];

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
  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Processos Activos</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/processes">Ver Todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {processes.map((process) => (
          <Link key={process.id} to={`/processes/${process.id}`}>
            <div
              className="rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-card cursor-pointer"
            >
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
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{process.deadline}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{process.assignees} atribuídos</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
