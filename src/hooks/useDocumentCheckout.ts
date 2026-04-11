import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch all active checkouts (for document list lock icons)
export function useActiveCheckouts() {
  return useQuery({
    queryKey: ['active-checkouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_checkouts')
        .select('document_id, checked_out_by, expires_at, profile:profiles!document_checkouts_checked_out_by_fkey(full_name)')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return (data || []) as Array<{
        document_id: string;
        checked_out_by: string;
        expires_at: string;
        profile?: { full_name: string };
      }>;
    },
    refetchInterval: 30000,
  });
}

interface CheckoutStatus {
  id: string;
  document_id: string;
  checked_out_by: string;
  checked_out_at: string;
  expires_at: string;
  notes: string | null;
  profile?: {
    full_name: string;
    email: string;
  };
}

export function useCheckoutStatus(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-checkout', documentId],
    queryFn: async (): Promise<CheckoutStatus | null> => {
      if (!documentId) return null;

      const { data, error } = await supabase
        .from('document_checkouts')
        .select('*, profile:profiles!document_checkouts_checked_out_by_fkey(full_name, email)')
        .eq('document_id', documentId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data as unknown as CheckoutStatus | null;
    },
    enabled: !!documentId,
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, notes }: { documentId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Clean up any expired checkouts first
      await supabase
        .from('document_checkouts')
        .delete()
        .eq('document_id', documentId)
        .lt('expires_at', new Date().toISOString());

      const { data, error } = await supabase
        .from('document_checkouts')
        .insert({
          document_id: documentId,
          checked_out_by: user.id,
          notes,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este documento já está em edição por outro utilizador.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-checkout', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('document_checkouts')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['document-checkout', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useForceCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('document_checkouts')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['document-checkout', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useExtendCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const newExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('document_checkouts')
        .update({ expires_at: newExpiry })
        .eq('document_id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['document-checkout', documentId] });
    },
  });
}
