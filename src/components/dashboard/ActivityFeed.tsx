import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock, Upload, MessageSquare, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "approved",
    title: "Documento Aprovado",
    description: "Relatório Orçamental Anual 2024 aprovado pelo Director Financeiro",
    time: "há 2 horas",
    icon: CheckCircle,
  },
  {
    id: 2,
    type: "upload",
    title: "Novo Carregamento",
    description: "Plano de Desenvolvimento de Infra-estruturas carregado por Miguel Costa",
    time: "há 4 horas",
    icon: Upload,
  },
  {
    id: 3,
    type: "comment",
    title: "Novo Comentário",
    description: "Sara Ferreira comentou na Avaliação de Impacto Ambiental",
    time: "há 5 horas",
    icon: MessageSquare,
  },
  {
    id: 4,
    type: "rejected",
    title: "Documento Rejeitado",
    description: "Alteração à Política de Transportes requer revisões",
    time: "há 1 dia",
    icon: XCircle,
  },
  {
    id: 5,
    type: "assigned",
    title: "Tarefa Atribuída",
    description: "Foi-lhe atribuída a revisão da Iniciativa de Saúde Pública",
    time: "há 1 dia",
    icon: UserCheck,
  },
  {
    id: 6,
    type: "pending",
    title: "A Aguardar Revisão",
    description: "Processo de Renovação de Contrato aguarda a sua aprovação",
    time: "há 2 dias",
    icon: Clock,
  },
];

const iconStyles = {
  approved: "bg-success-muted text-success",
  upload: "bg-info-muted text-info",
  comment: "bg-primary-muted text-primary",
  rejected: "bg-error-muted text-error",
  assigned: "bg-warning-muted text-warning",
  pending: "bg-muted text-muted-foreground",
};

export function ActivityFeed() {
  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Actividade Recente</CardTitle>
        <Button variant="link" size="sm" className="text-sm">
          Ver Tudo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Linha do tempo */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />
          
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex gap-4 pl-2">
              <div className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                iconStyles[activity.type as keyof typeof iconStyles]
              )}>
                <activity.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1 pt-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
