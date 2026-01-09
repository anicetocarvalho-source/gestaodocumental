import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaginationParams, PaginatedResult, Document } from '@/types/database';

export type ArchiveStatus = 'archived' | 'permanent' | 'pending_destruction';
export type RetentionStatus = 'pending' | 'approved' | 'rejected' | 'destroyed';

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

export interface DocumentRetention {
  id: string;
  document_id: string;
  status: RetentionStatus;
  scheduled_destruction_date: string;
  retention_reason: string | null;
  destruction_reason: string | null;
  legal_basis: string | null;
  marked_by: string | null;
  marked_at: string;
  approved_by: string | null;
  approved_at: string | null;
  destroyed_by: string | null;
  destroyed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  document?: Document;
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

      // Documentos pendentes de eliminação
      const { count: pendingDestruction, error: pendingError } = await supabase
        .from('document_retention')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Documentos consultados este mês
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
        pendingDestruction: pendingDestruction || 0,
        consultedThisMonth: consulted || 0,
      };
    },
  });
}

// Query para registos de retenção
export function useDocumentRetentions(status?: RetentionStatus) {
  return useQuery({
    queryKey: ['document-retentions', status],
    queryFn: async (): Promise<DocumentRetention[]> => {
      let query = supabase
        .from('document_retention')
        .select(`
          *,
          document:documents(*)
        `)
        .order('scheduled_destruction_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as unknown as DocumentRetention[]) || [];
    },
  });
}

// Verificar se documento tem registo de retenção
export function useDocumentRetention(documentId: string) {
  return useQuery({
    queryKey: ['document-retention', documentId],
    queryFn: async (): Promise<DocumentRetention | null> => {
      const { data, error } = await supabase
        .from('document_retention')
        .select('*')
        .eq('document_id', documentId)
        .maybeSingle();

      if (error) throw error;

      return data as DocumentRetention | null;
    },
    enabled: !!documentId,
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

      // 2. Remover registo de retenção se existir
      await supabase
        .from('document_retention')
        .delete()
        .eq('document_id', documentId);

      // 3. Registar movimento de restauração
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
      queryClient.invalidateQueries({ queryKey: ['document-retentions'] });
    },
  });
}

export function useMarkForDestruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentIds,
      scheduledDate,
      retentionReason,
      destructionReason,
      legalBasis,
      notes,
    }: {
      documentIds: string[];
      scheduledDate: Date;
      retentionReason?: string;
      destructionReason: string;
      legalBasis?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Inserir registos de retenção para cada documento
      const retentionRecords = documentIds.map(documentId => ({
        document_id: documentId,
        status: 'pending' as const,
        scheduled_destruction_date: scheduledDate.toISOString().split('T')[0],
        retention_reason: retentionReason || null,
        destruction_reason: destructionReason,
        legal_basis: legalBasis || null,
        marked_by: user?.id,
        notes: notes || null,
      }));

      const { error } = await supabase
        .from('document_retention')
        .upsert(retentionRecords, { onConflict: 'document_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-documents'] });
      queryClient.invalidateQueries({ queryKey: ['archive-stats'] });
      queryClient.invalidateQueries({ queryKey: ['document-retentions'] });
    },
  });
}

export function useApproveDestruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (retentionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('document_retention')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', retentionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-retentions'] });
      queryClient.invalidateQueries({ queryKey: ['archive-stats'] });
    },
  });
}

export function useRejectDestruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      retentionId,
      reason,
    }: {
      retentionId: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('document_retention')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes: reason,
        })
        .eq('id', retentionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-retentions'] });
      queryClient.invalidateQueries({ queryKey: ['archive-stats'] });
    },
  });
}

export function useCancelDestruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (retentionId: string) => {
      const { error } = await supabase
        .from('document_retention')
        .delete()
        .eq('id', retentionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-retentions'] });
      queryClient.invalidateQueries({ queryKey: ['archive-stats'] });
    },
  });
}
