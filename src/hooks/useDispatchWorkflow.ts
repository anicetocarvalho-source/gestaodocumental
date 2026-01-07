import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

export interface DispatchApproval {
  id: string;
  dispatch_id: string;
  approver_id: string | null;
  approval_order: number;
  status: ApprovalStatus;
  comments: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  approver?: { id: string; full_name: string; position: string | null } | null;
}

export interface DispatchSignature {
  id: string;
  dispatch_id: string;
  signer_id: string;
  signature_type: "digital" | "manuscrita" | "certificado";
  signature_data: string | null;
  signed_at: string;
  is_valid: boolean;
  ip_address: string | null;
  device_info: string | null;
  signer?: { id: string; full_name: string; position: string | null } | null;
}

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  devolvido: "Devolvido",
};

export const workflowStatusLabels: Record<string, string> = {
  nao_iniciado: "Não Iniciado",
  em_aprovacao: "Em Aprovação",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  assinado: "Assinado",
};

export function useDispatchApprovals(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ["dispatch-approvals", dispatchId],
    queryFn: async () => {
      if (!dispatchId) return [];
      
      const { data, error } = await supabase
        .from("dispatch_approvals")
        .select(`
          *,
          approver:profiles!approver_id(id, full_name, position)
        `)
        .eq("dispatch_id", dispatchId)
        .order("approval_order");

      if (error) throw error;
      return data as DispatchApproval[];
    },
    enabled: !!dispatchId,
  });
}

export function useDispatchSignatures(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ["dispatch-signatures", dispatchId],
    queryFn: async () => {
      if (!dispatchId) return [];
      
      const { data, error } = await supabase
        .from("dispatch_signatures")
        .select(`
          *,
          signer:profiles!signer_id(id, full_name, position)
        `)
        .eq("dispatch_id", dispatchId)
        .order("signed_at", { ascending: false });

      if (error) throw error;
      return data as DispatchSignature[];
    },
    enabled: !!dispatchId,
  });
}

export function useAddApprover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dispatchId,
      approverId,
      order,
    }: {
      dispatchId: string;
      approverId: string;
      order: number;
    }) => {
      const { data, error } = await supabase
        .from("dispatch_approvals")
        .insert({
          dispatch_id: dispatchId,
          approver_id: approverId,
          approval_order: order,
        })
        .select()
        .single();

      if (error) throw error;

      // Update dispatch to require approval
      await supabase
        .from("dispatches")
        .update({ requires_approval: true, workflow_status: "em_aprovacao" })
        .eq("id", dispatchId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-approvals", variables.dispatchId] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", variables.dispatchId] });
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      approvalId,
      status,
      comments,
    }: {
      approvalId: string;
      status: "aprovado" | "rejeitado" | "devolvido";
      comments?: string;
    }) => {
      const { data, error } = await supabase
        .from("dispatch_approvals")
        .update({
          status,
          comments,
          approved_at: status === "aprovado" ? new Date().toISOString() : null,
        })
        .eq("id", approvalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-approvals", data.dispatch_id] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", data.dispatch_id] });
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useSignDispatch() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      dispatchId,
      signatureType,
      signatureData,
    }: {
      dispatchId: string;
      signatureType: "digital" | "manuscrita" | "certificado";
      signatureData?: string;
    }) => {
      if (!profile) throw new Error("Utilizador não autenticado");

      const { data, error } = await supabase
        .from("dispatch_signatures")
        .insert({
          dispatch_id: dispatchId,
          signer_id: profile.id,
          signature_type: signatureType,
          signature_data: signatureData,
          ip_address: null, // Would need to capture from request
          device_info: navigator.userAgent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-signatures", data.dispatch_id] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", data.dispatch_id] });
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useRemoveApprover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (approvalId: string) => {
      const { data: approval } = await supabase
        .from("dispatch_approvals")
        .select("dispatch_id")
        .eq("id", approvalId)
        .single();

      const { error } = await supabase
        .from("dispatch_approvals")
        .delete()
        .eq("id", approvalId);

      if (error) throw error;
      return approval?.dispatch_id;
    },
    onSuccess: (dispatchId) => {
      if (dispatchId) {
        queryClient.invalidateQueries({ queryKey: ["dispatch-approvals", dispatchId] });
        queryClient.invalidateQueries({ queryKey: ["dispatch", dispatchId] });
      }
    },
  });
}

export function useMyPendingApprovals() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-pending-approvals", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("dispatch_approvals")
        .select(`
          *,
          dispatch:dispatches(id, dispatch_number, subject, dispatch_type, created_at)
        `)
        .eq("approver_id", profile.id)
        .eq("status", "pendente")
        .order("created_at");

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
}
