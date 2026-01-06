import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Document, 
  CreateDocumentInput, 
  UpdateDocumentInput, 
  DocumentFilters,
  PaginationParams,
  PaginatedResult
} from '@/types/database';

// =============================================
// Queries
// =============================================

export function useDocuments(filters?: DocumentFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['documents', filters, pagination],
    queryFn: async (): Promise<PaginatedResult<Document>> => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          document_type:document_types(*),
          classification:classification_codes(*),
          current_unit:organizational_units!documents_current_unit_id_fkey(*),
          responsible_user:profiles!documents_responsible_user_id_fkey(*)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }

      if (filters?.document_type_id) {
        query = query.eq('document_type_id', filters.document_type_id);
      }

      if (filters?.current_unit_id) {
        query = query.eq('current_unit_id', filters.current_unit_id);
      }

      if (filters?.responsible_user_id) {
        query = query.eq('responsible_user_id', filters.responsible_user_id);
      }

      if (filters?.classification_id) {
        query = query.eq('classification_id', filters.classification_id);
      }

      if (filters?.is_archived !== undefined) {
        query = query.eq('is_archived', filters.is_archived);
      }

      if (filters?.from_date) {
        query = query.gte('entry_date', filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte('entry_date', filters.to_date);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,entry_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      // Ordenação padrão
      query = query.order('entry_date', { ascending: false });

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

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async (): Promise<Document | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_type:document_types(*),
          classification:classification_codes(*),
          origin_unit:organizational_units!documents_origin_unit_id_fkey(*),
          current_unit:organizational_units!documents_current_unit_id_fkey(*),
          responsible_user:profiles!documents_responsible_user_id_fkey(*),
          files:document_files(*),
          movements:document_movements(
            *,
            from_unit:organizational_units!document_movements_from_unit_id_fkey(*),
            to_unit:organizational_units!document_movements_to_unit_id_fkey(*),
            from_user:profiles!document_movements_from_user_id_fkey(*),
            to_user:profiles!document_movements_to_user_id_fkey(*)
          ),
          signatures:document_signatures(
            *,
            signer:profiles(*)
          ),
          comments:document_comments(
            *,
            author:profiles(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      return data as unknown as Document;
    },
    enabled: !!id,
  });
}

// =============================================
// Mutations
// =============================================

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDocumentInput): Promise<Document> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertPayload: any = {
        title: input.title,
        description: input.description,
        document_type_id: input.document_type_id,
        classification_id: input.classification_id,
        origin: input.origin,
        origin_unit_id: input.origin_unit_id,
        current_unit_id: input.current_unit_id,
        responsible_user_id: input.responsible_user_id,
        priority: input.priority,
        confidentiality: input.confidentiality,
        due_date: input.due_date,
        subject: input.subject,
        sender_name: input.sender_name,
        sender_institution: input.sender_institution,
        external_reference: input.external_reference,
        created_by: user?.id,
      };
      
      const { data, error } = await supabase
        .from('documents')
        .insert(insertPayload)
        .select(`
          *,
          document_type:document_types(*),
          classification:classification_codes(*),
          current_unit:organizational_units!documents_current_unit_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      return data as unknown as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDocumentInput & { id: string }): Promise<Document> => {
      const { data, error } = await supabase
        .from('documents')
        .update(input)
        .eq('id', id)
        .select(`
          *,
          document_type:document_types(*),
          classification:classification_codes(*)
        `)
        .single();

      if (error) throw error;

      return data as unknown as Document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// =============================================
// Estatísticas
// =============================================

export function useDocumentStats() {
  return useQuery({
    queryKey: ['document-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('status, priority', { count: 'exact' });

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        pending: 0,
        urgent: 0,
      };

      data?.forEach((doc) => {
        stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
        stats.byPriority[doc.priority] = (stats.byPriority[doc.priority] || 0) + 1;
        
        if (['received', 'validating', 'in_progress', 'pending_signature'].includes(doc.status)) {
          stats.pending++;
        }
        
        if (doc.priority === 'urgent') {
          stats.urgent++;
        }
      });

      return stats;
    },
  });
}
