import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreateMovementInput, 
  CreateCommentInput,
  DocumentStatus,
  MovementActionType,
  SignatureType
} from '@/types/database';

// =============================================
// Movimentações / Tramitações
// =============================================

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMovementInput & { 
      from_unit_id?: string;
      from_user_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('document_movements')
        .insert(input)
        .select(`
          *,
          from_unit:organizational_units!document_movements_from_unit_id_fkey(*),
          to_unit:organizational_units!document_movements_to_unit_id_fkey(*),
          from_user:profiles!document_movements_from_user_id_fkey(*),
          to_user:profiles!document_movements_to_user_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.document_id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// =============================================
// Ações de Workflow
// =============================================

export function useDispatchDocument() {
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  return useMutation({
    mutationFn: async ({
      documentId,
      toUnitId,
      toUserId,
      dispatchText,
      notes,
      fromUnitId,
      fromUserId,
    }: {
      documentId: string;
      toUnitId: string;
      toUserId?: string;
      dispatchText?: string;
      notes?: string;
      fromUnitId?: string;
      fromUserId?: string;
    }) => {
      // 1. Atualizar documento
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          current_unit_id: toUnitId,
          responsible_user_id: toUserId || null,
          status: 'dispatched',
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // 2. Criar movimento
      await createMovement.mutateAsync({
        document_id: documentId,
        from_unit_id: fromUnitId,
        to_unit_id: toUnitId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        action_type: 'dispatch',
        dispatch_text: dispatchText,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useForwardDocument() {
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  return useMutation({
    mutationFn: async ({
      documentId,
      toUnitId,
      toUserId,
      notes,
      fromUnitId,
      fromUserId,
    }: {
      documentId: string;
      toUnitId: string;
      toUserId?: string;
      notes?: string;
      fromUnitId?: string;
      fromUserId?: string;
    }) => {
      // 1. Atualizar documento - mover para nova unidade mantendo status
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          current_unit_id: toUnitId,
          responsible_user_id: toUserId || null,
          status: 'in_progress',
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // 2. Criar movimento de reencaminhamento
      await createMovement.mutateAsync({
        document_id: documentId,
        from_unit_id: fromUnitId,
        to_unit_id: toUnitId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        action_type: 'forward',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useValidateDocument() {
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  return useMutation({
    mutationFn: async ({
      documentId,
      currentUnitId,
      userId,
      notes,
    }: {
      documentId: string;
      currentUnitId: string;
      userId?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'validated' })
        .eq('id', documentId);

      if (error) throw error;

      await createMovement.mutateAsync({
        document_id: documentId,
        to_unit_id: currentUnitId,
        to_user_id: userId,
        action_type: 'validate',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useRejectDocument() {
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  return useMutation({
    mutationFn: async ({
      documentId,
      currentUnitId,
      userId,
      notes,
    }: {
      documentId: string;
      currentUnitId: string;
      userId?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'rejected' })
        .eq('id', documentId);

      if (error) throw error;

      await createMovement.mutateAsync({
        document_id: documentId,
        to_unit_id: currentUnitId,
        to_user_id: userId,
        action_type: 'reject',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useArchiveDocument() {
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  return useMutation({
    mutationFn: async ({
      documentId,
      archiveUnitId,
      userId,
      notes,
    }: {
      documentId: string;
      archiveUnitId: string;
      userId?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'archived',
          is_archived: true,
          archived_at: new Date().toISOString(),
          current_unit_id: archiveUnitId,
        })
        .eq('id', documentId);

      if (error) throw error;

      await createMovement.mutateAsync({
        document_id: documentId,
        to_unit_id: archiveUnitId,
        to_user_id: userId,
        action_type: 'archive',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useChangeDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      status,
    }: {
      documentId: string;
      status: DocumentStatus;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// =============================================
// Comentários
// =============================================

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCommentInput & { author_id?: string }) => {
      const { data, error } = await supabase
        .from('document_comments')
        .insert(input)
        .select(`
          *,
          author:profiles(*)
        `)
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.document_id] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, documentId }: { commentId: string; documentId: string }) => {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      return documentId;
    },
    onSuccess: (documentId) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}

// =============================================
// Assinaturas
// =============================================

export function useSignDocument() {
  const queryClient = useQueryClient();
  const createMovement = useCreateMovement();

  return useMutation({
    mutationFn: async ({
      documentId,
      signerId,
      signatureType,
      signatureData,
      currentUnitId,
    }: {
      documentId: string;
      signerId: string;
      signatureType: SignatureType;
      signatureData?: string;
      currentUnitId: string;
    }) => {
      // 1. Criar assinatura
      const { error: signError } = await supabase
        .from('document_signatures')
        .insert({
          document_id: documentId,
          signer_id: signerId,
          signature_type: signatureType,
          signature_data: signatureData,
          ip_address: null, // Capturar no cliente se necessário
          device_info: navigator.userAgent,
        });

      if (signError) throw signError;

      // 2. Atualizar status do documento
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'signed' })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // 3. Registar movimento
      await createMovement.mutateAsync({
        document_id: documentId,
        to_unit_id: currentUnitId,
        to_user_id: signerId,
        action_type: 'sign',
        notes: `Documento assinado (${signatureType})`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
