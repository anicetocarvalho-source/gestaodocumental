import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isValidUUID } from "@/lib/validation";
import { toast } from "sonner";

export type DocumentApprovalStatus = "pendente" | "aprovado" | "rejeitado" | "devolvido";

export const documentApprovalStatusLabels: Record<DocumentApprovalStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  devolvido: "Devolvido",
};

export const documentWorkflowStatusLabels: Record<string, string> = {
  nao_iniciado: "Sem fluxo de aprovação",
  em_aprovacao: "Em aprovação",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  devolvido: "Devolvido para revisão",
};

export interface DocumentApproval {
  id: string;
  document_id: string;
  approver_id: string;
  requested_by: string | null;
  approval_order: number;
  status: DocumentApprovalStatus;
  comments: string | null;
  decided_at: string | null;
  created_at: string;
  approver?: { id: string; full_name: string; email: string | null; position: string | null } | null;
}

export interface PendingDocumentApproval extends DocumentApproval {
  document?: {
    id: string;
    entry_number: string;
    title: string;
    description: string | null;
    priority: string;
    created_at: string;
    created_by: string | null;
    approval_workflow_status: string;
  } | null;
}

const APPROVAL_SELECT = `
  *,
  approver:profiles!document_approvals_approver_id_fkey(id, full_name, email, position)
`;

export function useDocumentApprovals(documentId: string | undefined) {
  return useQuery({
    queryKey: ["document-approvals", documentId],
    enabled: !!documentId && isValidUUID(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_approvals")
        .select(APPROVAL_SELECT)
        .eq("document_id", documentId!)
        .order("approval_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as DocumentApproval[];
    },
  });
}

export function useMyPendingDocumentApprovals() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-pending-document-approvals", profile?.id],
    enabled: !!profile?.id && isValidUUID(profile.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_approvals")
        .select(`
          *,
          approver:profiles!document_approvals_approver_id_fkey(id, full_name, email, position),
          document:documents(id, entry_number, title, description, priority, created_at, created_by, approval_workflow_status)
        `)
        .eq("approver_id", profile!.id)
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as PendingDocumentApproval[];
    },
  });
}

export function useRequestDocumentApprovals() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentId,
      approverIds,
      comments,
    }: {
      documentId: string;
      approverIds: string[];
      comments?: string;
    }) => {
      if (approverIds.length === 0) throw new Error("Seleccione pelo menos um aprovador.");

      const { data: existing } = await supabase
        .from("document_approvals")
        .select("approval_order")
        .eq("document_id", documentId)
        .order("approval_order", { ascending: false })
        .limit(1);

      const startOrder = (existing?.[0]?.approval_order ?? 0) + 1;

      const rows = approverIds.map((approverId, index) => ({
        document_id: documentId,
        approver_id: approverId,
        requested_by: user?.id ?? null,
        approval_order: startOrder + index,
        comments: comments?.trim() || null,
      }));

      const { error } = await supabase.from("document_approvals").insert(rows);
      if (error) {
        if (error.code === "23505") throw new Error("Um dos aprovadores já está associado a este documento.");
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-approvals", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Pedido de aprovação enviado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDecideDocumentApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      approvalId,
      status,
      comments,
    }: {
      approvalId: string;
      documentId?: string;
      status: Exclude<DocumentApprovalStatus, "pendente">;
      comments?: string;
    }) => {
      const { error } = await supabase
        .from("document_approvals")
        .update({
          status,
          comments: comments?.trim() || null,
          decided_at: new Date().toISOString(),
        })
        .eq("id", approvalId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-approvals", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-document-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      const messages: Record<string, string> = {
        aprovado: "Documento aprovado",
        rejeitado: "Documento rejeitado",
        devolvido: "Documento devolvido para revisão",
      };
      toast.success(messages[variables.status]);
    },
    onError: (error: Error) => toast.error("Erro ao registar decisão: " + error.message),
  });
}

export function useCancelDocumentApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId }: { approvalId: string; documentId?: string }) => {
      const { error } = await supabase.from("document_approvals").delete().eq("id", approvalId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-approvals", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-document-approvals"] });
      toast.success("Pedido de aprovação removido");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
