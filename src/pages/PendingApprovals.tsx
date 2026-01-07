import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Clock,
  FileCheck,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useMyPendingApprovals,
  useProcessApproval,
  approvalStatusLabels,
} from "@/hooks/useDispatchWorkflow";
import { dispatchTypeLabels } from "@/hooks/useDispatches";
import { DispatchApprovalModal } from "@/components/dispatches/DispatchApprovalModal";
import { Database } from "@/integrations/supabase/types";

type DispatchType = Database["public"]["Enums"]["dispatch_type"];

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { data: pendingApprovals, isLoading, error } = useMyPendingApprovals();
  const processApproval = useProcessApproval();
  
  const [selectedApproval, setSelectedApproval] = useState<{
    id: string;
    dispatchNumber: string;
  } | null>(null);

  const handleApprove = async (
    decision: "aprovado" | "rejeitado" | "devolvido",
    comments?: string
  ) => {
    if (!selectedApproval) return;
    
    try {
      await processApproval.mutateAsync({
        approvalId: selectedApproval.id,
        status: decision,
        comments,
      });
      
      const messages = {
        aprovado: "Despacho aprovado com sucesso!",
        rejeitado: "Despacho rejeitado",
        devolvido: "Despacho devolvido para revisão",
      };
      toast.success(messages[decision]);
    } catch (err) {
      toast.error("Erro ao processar aprovação");
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

  const stats = [
    { 
      icon: Clock, 
      label: "Pendentes", 
      value: pendingApprovals?.length || 0, 
      color: "text-warning" 
    },
    { 
      icon: AlertTriangle, 
      label: "Urgentes", 
      value: pendingApprovals?.filter(a => 
        a.dispatch && new Date(a.dispatch.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0, 
      color: "text-destructive" 
    },
  ];

  return (
    <DashboardLayout 
      title="Aprovações Pendentes" 
      subtitle="Despachos aguardando a sua aprovação"
    >
      <PageBreadcrumb items={[
        { label: "Despachos", href: "/dispatches" },
        { label: "Aprovações Pendentes" }
      ]} />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Pending Approvals List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Despachos para Aprovar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-48 flex-1" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center text-destructive">
                Erro ao carregar aprovações pendentes
              </div>
            ) : !pendingApprovals || pendingApprovals.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma aprovação pendente</h3>
                <p className="text-sm text-muted-foreground">
                  Não existem despachos aguardando a sua aprovação no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => {
                  const dispatch = approval.dispatch as {
                    id: string;
                    dispatch_number: string;
                    subject: string;
                    dispatch_type: DispatchType;
                    created_at: string;
                  } | null;
                  
                  if (!dispatch) return null;

                  const isOld = new Date(dispatch.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000);

                  return (
                    <div 
                      key={approval.id}
                      className={cn(
                        "flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50",
                        isOld && "border-warning/50 bg-warning/5"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                          isOld ? "bg-warning/10" : "bg-muted"
                        )}>
                          {isOld ? (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium text-primary">
                              {dispatch.dispatch_number}
                            </span>
                            {getTipoBadge(dispatch.dispatch_type)}
                            {isOld && (
                              <Badge variant="warning" className="text-xs">
                                Aguardando há mais de 24h
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground truncate">
                            {dispatch.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recebido em {format(new Date(approval.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dispatches/${dispatch.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedApproval({
                            id: approval.id,
                            dispatchNumber: dispatch.dispatch_number,
                          })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Modal */}
      <DispatchApprovalModal
        open={!!selectedApproval}
        onOpenChange={(open) => !open && setSelectedApproval(null)}
        dispatchNumber={selectedApproval?.dispatchNumber || ""}
        approverName=""
        onApprove={handleApprove}
        isLoading={processApproval.isPending}
      />
    </DashboardLayout>
  );
};

export default PendingApprovals;
