import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isValidUUID } from "@/lib/validation";
import { toast } from "sonner";

export interface DocumentSignature {
  id: string;
  document_id: string;
  signer_id: string;
  signer_name: string | null;
  signer_role: string | null;
  reason: string | null;
  signature_type: string;
  signature_data: string | null;
  sequence_order: number;
  document_hash: string | null;
  previous_hash: string | null;
  signature_hash: string | null;
  is_valid: boolean;
  signed_at: string;
  approval_id: string | null;
  signer?: { id: string; full_name: string; position: string | null } | null;
}

export interface SignatureChainCheck {
  signature_id: string;
  sequence_order: number;
  signer_name: string | null;
  signed_at: string;
  is_chain_valid: boolean;
}

export function useDocumentSignatures(documentId: string | undefined) {
  return useQuery({
    queryKey: ["document-signatures", documentId],
    enabled: !!documentId && isValidUUID(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_signatures")
        .select(
          `*, signer:profiles!document_signatures_signer_id_fkey(id, full_name, position)`,
        )
        .eq("document_id", documentId!)
        .order("sequence_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as DocumentSignature[];
    },
  });
}

export function useVerifySignatureChain(documentId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("verify_document_signatures", {
        _document_id: documentId!,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SignatureChainCheck[];
    },
    onError: (error: Error) => toast.error("Erro ao verificar assinaturas: " + error.message),
  });
}

export interface SignDocumentInput {
  documentId: string;
  signatureImage: string;
  signerName: string;
  signerRole?: string;
  reason?: string;
  approvalId?: string | null;
}

export function useSignDocument() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: SignDocumentInput) => {
      if (!profile?.id) throw new Error("Perfil de utilizador não encontrado.");

      const { data, error } = await supabase
        .from("document_signatures")
        .insert({
          document_id: input.documentId,
          signer_id: profile.id,
          signature_type: "electronica_desenhada",
          signature_data: input.signatureImage,
          signer_name: input.signerName,
          signer_role: input.signerRole || null,
          reason: input.reason || null,
          approval_id: input.approvalId || null,
          device_info: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 255) : null,
        })
        .select("id, sequence_order, signature_hash")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-signatures", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["document-audit", variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
