import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock, RotateCcw, Trash2, UserPlus, XCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useReferenceData";
import {
  documentApprovalStatusLabels,
  documentWorkflowStatusLabels,
  useCancelDocumentApproval,
  useDecideDocumentApproval,
  useDocumentApprovals,
  useRequestDocumentApprovals,
  type DocumentApprovalStatus,
} from "@/hooks/useDocumentApprovals";

interface Props {
  documentId: string;
  workflowStatus?: string | null;
  canRequest?: boolean;
}

const statusStyles: Record<DocumentApprovalStatus, string> = {
  pendente: "bg-warning/10 text-warning border-warning/20",
  aprovado: "bg-success/10 text-success border-success/20",
  rejeitado: "bg-destructive/10 text-destructive border-destructive/20",
  devolvido: "bg-info/10 text-info border-info/20",
};

export function DocumentApprovalPanel({ documentId, workflowStatus, canRequest = true }: Props) {
  const { profile } = useAuth();
  const { data: approvals = [], isLoading } = useDocumentApprovals(documentId);
  const { data: profiles = [] } = useProfiles({ activeOnly: true });
  const requestApprovals = useRequestDocumentApprovals();
  const decideApproval = useDecideDocumentApproval();
  const cancelApproval = useCancelDocumentApproval();

  const [requestOpen, setRequestOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [requestNote, setRequestNote] = useState("");

  const [decision, setDecision] = useState<{
    approvalId: string;
    status: Exclude<DocumentApprovalStatus, "pendente">;
  } | null>(null);
  const [decisionComment, setDecisionComment] = useState("");

  const alreadyAssigned = useMemo(() => new Set(approvals.map((a) => a.approver_id)), [approvals]);
  const availableProfiles = useMemo(
    () =>
      profiles.filter(
        (p) =>
          !alreadyAssigned.has(p.id) &&
          p.id !== profile?.id &&
          (search.trim() === "" || p.full_name.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [profiles, alreadyAssigned, profile?.id, search],
  );

  const currentStatus = workflowStatus ?? "nao_iniciado";

  const handleRequest = async () => {
    await requestApprovals.mutateAsync({
      documentId,
      approverIds: selectedApprovers,
      comments: requestNote,
    });
    setRequestOpen(false);
    setSelectedApprovers([]);
    setRequestNote("");
    setSearch("");
  };

  const handleDecision = async () => {
    if (!decision) return;
    if (decision.status !== "aprovado" && !decisionComment.trim()) return;
    await decideApproval.mutateAsync({
      approvalId: decision.approvalId,
      documentId,
      status: decision.status,
      comments: decisionComment,
    });
    setDecision(null);
    setDecisionComment("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Fluxo de Aprovação</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {documentWorkflowStatusLabels[currentStatus] ?? currentStatus}
          </p>
        </div>
        {canRequest && (
          <Button size="sm" variant="outline" onClick={() => setRequestOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Solicitar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-20 w-full" />}

        {!isLoading && approvals.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda não foram definidos aprovadores para este documento.
          </p>
        )}

        {approvals.map((approval) => {
          const isMine = approval.approver_id === profile?.id;
          const isPending = approval.status === "pendente";

          return (
            <div key={approval.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {approval.approver?.full_name ?? "Aprovador"}
                    {isMine && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Passo {approval.approval_order}
                    {approval.approver?.position ? ` · ${approval.approver.position}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className={cn("border", statusStyles[approval.status])}>
                  {documentApprovalStatusLabels[approval.status]}
                </Badge>
              </div>

              {approval.comments && (
                <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs">{approval.comments}</p>
              )}

              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {approval.decided_at
                  ? `Decidido em ${format(new Date(approval.decided_at), "dd/MM/yyyy HH:mm", { locale: pt })}`
                  : `Solicitado em ${format(new Date(approval.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}`}
              </div>

              {isPending && isMine && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => { setDecision({ approvalId: approval.id, status: "aprovado" }); setDecisionComment(""); }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setDecision({ approvalId: approval.id, status: "devolvido" }); setDecisionComment(""); }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Devolver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => { setDecision({ approvalId: approval.id, status: "rejeitado" }); setDecisionComment(""); }}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              )}

              {isPending && !isMine && canRequest && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-destructive"
                  onClick={() => cancelApproval.mutate({ approvalId: approval.id, documentId })}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remover pedido
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>

      {/* Solicitar aprovação */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar aprovação</DialogTitle>
            <DialogDescription>
              Os aprovadores seleccionados recebem uma notificação interna imediata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approver-search">Aprovadores</Label>
              <Input
                id="approver-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar utilizador"
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {availableProfiles.length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground">Sem utilizadores disponíveis.</p>
                )}
                {availableProfiles.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted">
                    <Checkbox
                      checked={selectedApprovers.includes(p.id)}
                      onCheckedChange={(checked) =>
                        setSelectedApprovers((prev) =>
                          checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                        )
                      }
                    />
                    <span className="text-sm">
                      {p.full_name}
                      {p.position && <span className="text-muted-foreground"> · {p.position}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval-note">Nota para os aprovadores (opcional)</Label>
              <Textarea
                id="approval-note"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleRequest}
              disabled={selectedApprovers.length === 0 || requestApprovals.isPending}
            >
              {requestApprovals.isPending ? "A enviar..." : `Solicitar (${selectedApprovers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decisão */}
      <Dialog open={!!decision} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.status === "aprovado" && "Aprovar documento"}
              {decision?.status === "rejeitado" && "Rejeitar documento"}
              {decision?.status === "devolvido" && "Devolver para revisão"}
            </DialogTitle>
            <DialogDescription>
              {decision?.status === "aprovado"
                ? "Pode adicionar um comentário à sua aprovação."
                : "Indique o motivo da decisão — o autor será notificado."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="decision-comment">Comentário{decision?.status !== "aprovado" && " *"}</Label>
            <Textarea
              id="decision-comment"
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              rows={4}
              maxLength={2000}
              className={cn(
                decision?.status !== "aprovado" && !decisionComment.trim() && "border-destructive",
              )}
            />
            {decision?.status !== "aprovado" && !decisionComment.trim() && (
              <p className="text-xs text-destructive">O comentário é obrigatório nesta decisão.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancelar</Button>
            <Button
              onClick={handleDecision}
              disabled={
                decideApproval.isPending ||
                (decision?.status !== "aprovado" && !decisionComment.trim())
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
