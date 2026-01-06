import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MovementWithDetails {
  id: string;
  document_id: string;
  action_type: string;
  dispatch_text: string | null;
  notes: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  from_unit: { id: string; name: string; code: string } | null;
  to_unit: { id: string; name: string; code: string } | null;
  from_user: { id: string; full_name: string } | null;
  to_user: { id: string; full_name: string } | null;
  document: { 
    id: string; 
    title: string; 
    entry_number: string;
    status: string;
    priority: string;
  } | null;
}

export interface MovementFilters {
  dateFrom?: string;
  dateTo?: string;
  unitId?: string;
  actionType?: string;
  documentId?: string;
}

export function useMovements(filters?: MovementFilters) {
  return useQuery({
    queryKey: ['movements', filters],
    queryFn: async (): Promise<MovementWithDetails[]> => {
      let query = supabase
        .from('document_movements')
        .select(`
          id,
          document_id,
          action_type,
          dispatch_text,
          notes,
          is_read,
          read_at,
          created_at,
          from_unit:organizational_units!document_movements_from_unit_id_fkey(id, name, code),
          to_unit:organizational_units!document_movements_to_unit_id_fkey(id, name, code),
          from_user:profiles!document_movements_from_user_id_fkey(id, full_name),
          to_user:profiles!document_movements_to_user_id_fkey(id, full_name),
          document:documents!document_movements_document_id_fkey(id, title, entry_number, status, priority)
        `)
        .order('created_at', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
      }

      if (filters?.unitId) {
        query = query.or(`from_unit_id.eq.${filters.unitId},to_unit_id.eq.${filters.unitId}`);
      }

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.documentId) {
        query = query.eq('document_id', filters.documentId);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      return data as MovementWithDetails[];
    },
  });
}

export const actionTypeLabels: Record<string, string> = {
  despacho: 'Despacho',
  encaminhamento: 'Encaminhamento',
  recebimento: 'Recebimento',
  devolucao: 'Devolução',
  arquivamento: 'Arquivamento',
  reativacao: 'Reativação',
  informacao: 'Informação',
  parecer: 'Parecer',
};

export const actionTypeVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  despacho: 'default',
  encaminhamento: 'secondary',
  recebimento: 'success',
  devolucao: 'warning',
  arquivamento: 'outline',
  reativacao: 'success',
  informacao: 'secondary',
  parecer: 'default',
};
