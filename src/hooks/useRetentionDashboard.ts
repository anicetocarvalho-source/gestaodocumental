import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, format } from 'date-fns';

export interface ExpiringDocument {
  id: string;
  document_id: string;
  scheduled_destruction_date: string;
  status: string;
  document: {
    id: string;
    title: string;
    entry_number: string;
    classification?: {
      code: string;
      name: string;
    };
  };
}

export interface RetentionSummary {
  expiringThisWeek: ExpiringDocument[];
  expiringNextMonth: ExpiringDocument[];
  totalPending: number;
  totalApproved: number;
  upcomingDestructions: number;
}

export function useRetentionDashboard() {
  return useQuery({
    queryKey: ['retention-dashboard'],
    queryFn: async (): Promise<RetentionSummary> => {
      const now = new Date();
      
      // Calcular intervalos de datas
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const nextMonthStart = format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd');
      const nextMonthEnd = format(endOfMonth(addMonths(now, 1)), 'yyyy-MM-dd');

      // Documentos a expirar esta semana
      const { data: thisWeek, error: weekError } = await supabase
        .from('document_retention')
        .select(`
          id,
          document_id,
          scheduled_destruction_date,
          status,
          document:documents(
            id,
            title,
            entry_number,
            classification:classification_codes(code, name)
          )
        `)
        .gte('scheduled_destruction_date', weekStart)
        .lte('scheduled_destruction_date', weekEnd)
        .in('status', ['pending', 'approved'])
        .order('scheduled_destruction_date', { ascending: true });

      if (weekError) throw weekError;

      // Documentos a expirar no próximo mês
      const { data: nextMonth, error: monthError } = await supabase
        .from('document_retention')
        .select(`
          id,
          document_id,
          scheduled_destruction_date,
          status,
          document:documents(
            id,
            title,
            entry_number,
            classification:classification_codes(code, name)
          )
        `)
        .gte('scheduled_destruction_date', nextMonthStart)
        .lte('scheduled_destruction_date', nextMonthEnd)
        .in('status', ['pending', 'approved'])
        .order('scheduled_destruction_date', { ascending: true });

      if (monthError) throw monthError;

      // Contagem total pendente
      const { count: totalPending, error: pendingError } = await supabase
        .from('document_retention')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Contagem total aprovado
      const { count: totalApproved, error: approvedError } = await supabase
        .from('document_retention')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      if (approvedError) throw approvedError;

      // Próximas destruições (30 dias)
      const thirtyDaysFromNow = format(addMonths(now, 1), 'yyyy-MM-dd');
      const { count: upcomingDestructions, error: upcomingError } = await supabase
        .from('document_retention')
        .select('*', { count: 'exact', head: true })
        .lte('scheduled_destruction_date', thirtyDaysFromNow)
        .in('status', ['pending', 'approved']);

      if (upcomingError) throw upcomingError;

      return {
        expiringThisWeek: (thisWeek as unknown as ExpiringDocument[]) || [],
        expiringNextMonth: (nextMonth as unknown as ExpiringDocument[]) || [],
        totalPending: totalPending || 0,
        totalApproved: totalApproved || 0,
        upcomingDestructions: upcomingDestructions || 0,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
