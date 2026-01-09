import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaginationParams, PaginatedResult, Document } from '@/types/database';

export type ArchiveStatus = 'archived' | 'permanent' | 'pending_destruction';

export interface ArchiveFilters {
  search?: string;
  document_type_id?: string;
  classification_id?: string;
  unit_id?: string;
  archive_status?: ArchiveStatus;
  from_date?: string;
  to_date?: string;
}

export interface ArchiveStats {
  total: number;
  permanent: number;
  pendingDestruction: number;
  consultedThisMonth: number;
}

// =============================================
// Queries
// =============================================

export function useArchivedDocuments(filters?: ArchiveFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['archived-documents', filters, pagination],
    queryFn: async (): Promise<PaginatedResult<Document>> => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          document_type:document_types(*),
          classification:classification_codes(*),
          current_unit:organizational_units!documents_current_unit_id_fkey(*),
          responsible_user:profiles!documents_responsible_user_id_fkey(*),
          created_by_user:profiles!documents_created_by_fkey(*)
        `, { count: 'exact' })
        .eq('is_archived', true);

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,entry_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      if (filters?.document_type_id) {
        query = query.eq('document_type_id', filters.document_type_id);
      }

      if (filters?.classification_id) {
        query = query.eq('classification_id', filters.classification_id);
      }

      if (filters?.unit_id) {
        query = query.eq('current_unit_id', filters.unit_id);
      }

      if (filters?.from_date) {
        query = query.gte('archived_at', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('archived_at', filters.to_date);
      }

      // Ordenação por data de arquivo
      query = query.order('archived_at', { ascending: false });

      // Paginação
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data as unknown as Document[]) || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}

export function useArchiveStats() {
  return useQuery({
    queryKey: ['archive-stats'],
    queryFn: async (): Promise<ArchiveStats> => {
      // Total de documentos arquivados
      const { count: total, error: totalError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', true);

      if (totalError) throw totalError;

      // Documentos com status archived (que consideramos permanentes por agora)
      const { count: permanent, error: permanentError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', true)
        .eq('status', 'archived');

      if (permanentError) throw permanentError;

      // Documentos consultados este mês (baseado em movements com action_type = 'view' ou similar)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: consulted, error: consultedError } = await supabase
        .from('document_movements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      if (consultedError) throw consultedError;

      return {
        total: total || 0,
        permanent: permanent || 0,
        pendingDestruction: 0, // Para implementar futuramente com tabela de retenção
        consultedThisMonth: consulted || 0,
      };
    },
  });
}

// =============================================
// Mutations
// =============================================

export function useRestoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      targetUnitId,
      notes,
    }: {
      documentId: string;
      targetUnitId: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Atualizar documento - restaurar do arquivo
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          is_archived: false,
          archived_at: null,
          status: 'received',
          current_unit_id: targetUnitId,
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // 2. Registar movimento de restauração
      const { error: movementError } = await supabase
        .from('document_movements')
        .insert({
          document_id: documentId,
          to_unit_id: targetUnitId,
          to_user_id: user?.id,
          action_type: 'receive',
          notes: notes || 'Documento restaurado do arquivo',
        });

      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-documents'] });
      queryClient.invalidateQueries({ queryKey: ['archive-stats'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useMarkForDestruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      scheduledDate,
      reason,
    }: {
      documentId: string;
      scheduledDate: Date;
      reason?: string;
    }) => {
      // Para futuras implementações com tabela de gestão de retenção
      // Por agora, apenas registamos no campo de notas via movimento
      const { data: { user } } = await supabase.auth.getUser();

      const { data: doc } = await supabase
        .from('documents')
        .select('current_unit_id')
        .eq('id', documentId)
        .single();

      const { error: movementError } = await supabase
        .from('document_movements')
        .insert({
          document_id: documentId,
          to_unit_id: doc?.current_unit_id,
          to_user_id: user?.id,
          action_type: 'archive',
          notes: `Documento marcado para eliminação em ${scheduledDate.toLocaleDateString('pt-PT')}. Motivo: ${reason || 'Fim do período de retenção'}`,
        });

      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-documents'] });
    },
  });
}
