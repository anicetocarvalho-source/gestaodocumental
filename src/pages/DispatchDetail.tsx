import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Users,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  Pen,
  Plus,
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDispatch, dispatchTypeLabels, dispatchStatusLabels, dispatchPriorityLabels, useEmitDispatch } from "@/hooks/useDispatches";
import { useDispatchApprovals, useDispatchSignatures, useAddApprover, useProcessApproval, useSignDispatch, workflowStatusLabels, approvalStatusLabels } from "@/hooks/useDispatchWorkflow";
import { useProfiles } from "@/hooks/useReferenceData";
import { useAuth } from "@/contexts/AuthContext";
import { DispatchSignatureModal } from "@/components/dispatches/DispatchSignatureModal";
import { DispatchApprovalModal } from "@/components/dispatches/DispatchApprovalModal";
import { DispatchLinkedDocuments } from "@/components/dispatches/DispatchLinkedDocuments";
const DispatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [addApproverDialogOpen, setAddApproverDialogOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [currentApprovalId, setCurrentApprovalId] = useState<string | null>(null);

  const { data: dispatch, isLoading, error } = useDispatch(id);
  const { data: approvals } = useDispatchApprovals(id);
  const { data: signatures } = useDispatchSignatures(id);
  const { data: profiles } = useProfiles();
  
  const emitDispatch = useEmitDispatch();
  const addApprover = useAddApprover();
  const processApproval = useProcessApproval();
  const signDispatch = useSignDispatch();

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const canApprove = (approval: any) => {
    if (!profile) return false;
    return approval.approver_id === profile.id && approval.status === "pendente";
  };

  const canSign = () => {
    if (!profile || !dispatch) return false;
    // Can sign if all approvals are done or no approvals needed
    const allApproved = !approvals || approvals.length === 0 || approvals.every(a => a.status === "aprovado");
    const notYetSigned = !signatures?.find(s => s.signer_id === profile.id);
    return allApproved && notYetSigned && dispatch.status === "emitido";
  };

  const handleEmit = async () => {
    if (!id) return;
    try {
      await emitDispatch.mutateAsync(id);
      toast.success("Despacho emitido com sucesso!");
    } catch (err) {
      toast.error("Erro ao emitir despacho");
    }
  };

  const handleAddApprover = async () => {
    if (!id || !selectedApprover) return;
    try {
      const nextOrder = (approvals?.length || 0) + 1;
      await addApprover.mutateAsync({
        dispatchId: id,
        approverId: selectedApprover,
        order: nextOrder,
      });
      toast.success("Aprovador adicionado");
      setAddApproverDialogOpen(false);
      setSelectedApprover("");
    } catch (err) {
      toast.error("Erro ao adicionar aprovador");
    }
  };

  const handleProcessApproval = async (status: "aprovado" | "rejeitado" | "devolvido", comments?: string) => {
    if (!currentApprovalId) return;
    try {
      await processApproval.mutateAsync({
        approvalId: currentApprovalId,
        status,
        comments,
      });
      toast.success(status === "aprovado" ? "Despacho aprovado" : status === "devolvido" ? "Despacho devolvido" : "Despacho rejeitado");
    } catch (err) {
      toast.error("Erro ao processar aprovação");
    }
  };

  const handleSign = async (type: "digital" | "manuscrita", signatureData?: string) => {
    if (!id) return;
    try {
      await signDispatch.mutateAsync({
        dispatchId: id,
        signatureType: type,
        signatureData,
      });
      toast.success("Despacho assinado com sucesso!");
    } catch (err) {
      toast.error("Erro ao assinar despacho");
    }
  };

  const getWorkflowBadge = (status: string | null) => {
    switch (status) {
      case "nao_iniciado":
        return <Badge variant="secondary">Não Iniciado</Badge>;
      case "em_aprovacao":
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Em Aprovação</Badge>;
      case "aprovado":
        return <Badge variant="success"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case "rejeitado":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case "assinado":
        return <Badge variant="info"><Pen className="h-3 w-3 mr-1" />Assinado</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "aprovado":
        return <Badge variant="success"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case "rejeitado":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case "devolvido":
        return <Badge variant="warning"><RotateCcw className="h-3 w-3 mr-1" />Devolvido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter out profiles that are already approvers
  const availableApprovers = (profiles || []).filter(
    p => !approvals?.find(a => a.approver_id === p.id)
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Detalhe do Despacho" subtitle="A carregar...">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dispatch) {
    return (
      <DashboardLayout title="Despacho não encontrado" subtitle="Erro ao carregar">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-semibold mb-2">Despacho não encontrado</h2>
          <p className="text-muted-foreground mb-4">O despacho solicitado não existe ou não tem permissão para visualizar.</p>
          <Button onClick={() => navigate("/dispatches")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={dispatch.dispatch_number}
      subtitle={dispatch.subject}
    >
      <PageBreadcrumb
        items={[
          { label: "Gestão de Despachos", href: "/dispatches" },
          { label: dispatch.dispatch_number }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispatch Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {dispatch.dispatch_number}
                  </CardTitle>
                  <CardDescription>{dispatch.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary text-primary">
                    {dispatchTypeLabels[dispatch.dispatch_type]}
                  </Badge>
                  {dispatch.status === "rascunho" ? (
                    <Badge variant="secondary"><Edit className="h-3 w-3 mr-1" />Rascunho</Badge>
                  ) : dispatch.status === "emitido" ? (
                    <Badge variant="default"><Send className="h-3 w-3 mr-1" />Emitido</Badge>
                  ) : dispatch.status === "concluido" ? (
                    <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>
                  ) : dispatch.status === "cancelado" ? (
                    <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>
                  ) : (
                    <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Em Trâmite</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Data de Criação:</span>
                  <p className="font-medium">{format(new Date(dispatch.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioridade:</span>
                  <p className="font-medium">{dispatchPriorityLabels[dispatch.priority]}</p>
                </div>
                {dispatch.deadline && (
                  <div>
                    <span className="text-muted-foreground">Prazo:</span>
                    <p className="font-medium">{format(new Date(dispatch.deadline), "dd/MM/yyyy", { locale: pt })}</p>
                  </div>
                )}
                {dispatch.origin_unit && (
                  <div>
                    <span className="text-muted-foreground">Unidade de Origem:</span>
                    <p className="font-medium">{dispatch.origin_unit.name}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-2">Conteúdo do Despacho</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{dispatch.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Workflow */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Fluxo de Aprovação
                  </CardTitle>
                  <CardDescription>Cadeia de aprovação do despacho</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getWorkflowBadge(dispatch.workflow_status)}
                  {dispatch.status === "rascunho" || dispatch.status === "emitido" ? (
                    <Button variant="outline" size="sm" onClick={() => setAddApproverDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!approvals || approvals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum aprovador definido</p>
                  <p className="text-xs">Adicione aprovadores para iniciar o fluxo de aprovação</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map((approval, index) => (
                    <div
                      key={approval.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        approval.status === "aprovado" && "bg-success/5 border-success/20",
                        approval.status === "rejeitado" && "bg-destructive/5 border-destructive/20",
                        approval.status === "devolvido" && "bg-warning/5 border-warning/20",
                        approval.status === "pendente" && "bg-muted/50 border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {approval.approval_order}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{approval.approver?.full_name || "Aprovador"}</p>
                          {approval.approver?.position && (
                            <p className="text-xs text-muted-foreground">{approval.approver.position}</p>
                          )}
                          {approval.comments && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{approval.comments}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getApprovalBadge(approval.status)}
                        {canApprove(approval) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentApprovalId(approval.id);
                              setApprovalModalOpen(true);
                            }}
                          >
                            Processar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pen className="h-4 w-4" />
                    Assinaturas
                  </CardTitle>
                  <CardDescription>Assinaturas digitais do despacho</CardDescription>
                </div>
                {canSign() && (
                  <Button onClick={() => setSignatureModalOpen(true)}>
                    <Pen className="h-4 w-4 mr-2" />
                    Assinar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!signatures || signatures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma assinatura registada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signatures.map((signature) => (
                    <div
                      key={signature.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-success/20 bg-success/5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(signature.signer?.full_name || "")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{signature.signer?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(signature.signed_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {signature.signature_type === "digital" ? "Digital" : "Manuscrita"}
                        </Badge>
                        {signature.signature_type === "manuscrita" && signature.signature_data && (
                          <img
                            src={signature.signature_data}
                            alt="Assinatura"
                            className="h-8 max-w-[100px] object-contain"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dispatch.status === "rascunho" && (
                <>
                  <Button className="w-full" onClick={handleEmit} disabled={emitDispatch.isPending}>
                    {emitDispatch.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Emitir Despacho
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/dispatches/${id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </>
              )}
              {canSign() && (
                <Button className="w-full" onClick={() => setSignatureModalOpen(true)}>
                  <Pen className="h-4 w-4 mr-2" />
                  Assinar Despacho
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={() => navigate("/dispatches")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à lista
              </Button>
            </CardContent>
          </Card>

          {/* Recipients */}
          {dispatch.recipients && dispatch.recipients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinatários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dispatch.recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        recipient.recipient_type === "unit" ? "bg-primary/10" : "bg-success/10"
                      )}>
                        {recipient.recipient_type === "unit" ? (
                          <Building2 className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {recipient.unit?.name || recipient.profile?.full_name}
                        </p>
                      </div>
                      {recipient.is_read && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Documents */}
          {id && <DispatchLinkedDocuments dispatchId={id} />}
        </div>
      </div>

      {/* Add Approver Dialog */}
      <Dialog open={addApproverDialogOpen} onOpenChange={setAddApproverDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Aprovador</DialogTitle>
            <DialogDescription>
              Seleccione um utilizador para aprovar este despacho
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedApprover} onValueChange={setSelectedApprover}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar aprovador" />
              </SelectTrigger>
              <SelectContent>
                {availableApprovers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name} {p.position && `- ${p.position}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddApproverDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddApprover} disabled={!selectedApprover || addApprover.isPending}>
              {addApprover.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <DispatchSignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        dispatchNumber={dispatch.dispatch_number}
        onSign={handleSign}
        isLoading={signDispatch.isPending}
      />

      {/* Approval Modal */}
      <DispatchApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        dispatchNumber={dispatch.dispatch_number}
        approverName={profile?.full_name || ""}
        onApprove={handleProcessApproval}
        isLoading={processApproval.isPending}
      />
    </DashboardLayout>
  );
};

export default DispatchDetail;
