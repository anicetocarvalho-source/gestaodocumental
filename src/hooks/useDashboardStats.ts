import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalDocuments: number;
  documentsByStatus: Record<string, number>;
  documentsByPriority: Record<string, number>;
  pendingDocuments: number;
  urgentDocuments: number;
  processedThisMonth: number;
  processedLastMonth: number;
  slaCompliance: number;
}

export interface DocumentsByUnit {
  unidade: string;
  total: number;
}

export interface DocumentsByType {
  name: string;
  value: number;
  color: string;
}

export interface DocumentsByClassification {
  classificacao: string;
  quantidade: number;
}

export interface RecentActivity {
  id: string;
  type: 'dispatch' | 'forward' | 'approve' | 'reject' | 'create' | 'comment';
  title: string;
  description: string;
  time: string;
  document_id: string;
}

export interface RecentDocumentData {
  id: string;
  title: string;
  entry_number: string;
  status: string;
  priority: string;
  entry_date: string;
  document_type?: { name: string; code: string } | null;
  responsible_user?: { full_name: string } | null;
}

// Hook for dashboard KPI statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get all documents
      const { data: documents, error } = await supabase
        .from('documents')
        .select('status, priority, entry_date, due_date');

      if (error) throw error;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const stats: DashboardStats = {
        totalDocuments: documents?.length || 0,
        documentsByStatus: {},
        documentsByPriority: {},
        pendingDocuments: 0,
        urgentDocuments: 0,
        processedThisMonth: 0,
        processedLastMonth: 0,
        slaCompliance: 0,
      };

      let withinSLA = 0;
      let totalWithDueDate = 0;

      documents?.forEach((doc) => {
        // Count by status
        stats.documentsByStatus[doc.status] = (stats.documentsByStatus[doc.status] || 0) + 1;
        
        // Count by priority
        stats.documentsByPriority[doc.priority] = (stats.documentsByPriority[doc.priority] || 0) + 1;
        
        // Pending documents
        if (['received', 'validating', 'in_progress', 'pending_signature'].includes(doc.status)) {
          stats.pendingDocuments++;
        }
        
        // Urgent documents
        if (doc.priority === 'urgent') {
          stats.urgentDocuments++;
        }

        // This month processed (completed/archived)
        const entryDate = new Date(doc.entry_date);
        if (doc.status === 'completed' || doc.status === 'archived') {
          if (entryDate >= thisMonthStart) {
            stats.processedThisMonth++;
          } else if (entryDate >= lastMonthStart && entryDate <= lastMonthEnd) {
            stats.processedLastMonth++;
          }
        }

        // SLA compliance
        if (doc.due_date) {
          totalWithDueDate++;
          const dueDate = new Date(doc.due_date);
          if (doc.status === 'completed' || doc.status === 'archived') {
            if (entryDate <= dueDate) {
              withinSLA++;
            }
          } else if (now <= dueDate) {
            withinSLA++;
          }
        }
      });

      stats.slaCompliance = totalWithDueDate > 0 ? Math.round((withinSLA / totalWithDueDate) * 100) : 100;

      return stats;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Hook for documents by organizational unit
export function useDocumentsByUnit() {
  return useQuery({
    queryKey: ['documents-by-unit'],
    queryFn: async (): Promise<DocumentsByUnit[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          current_unit_id,
          current_unit:organizational_units!documents_current_unit_id_fkey(name)
        `);

      if (error) throw error;

      const unitCounts: Record<string, number> = {};
      
      data?.forEach((doc) => {
        const unitName = (doc.current_unit as { name: string } | null)?.name || 'Sem unidade';
        unitCounts[unitName] = (unitCounts[unitName] || 0) + 1;
      });

      return Object.entries(unitCounts)
        .map(([unidade, total]) => ({ unidade, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
    },
  });
}

// Hook for documents by type
export function useDocumentsByType() {
  return useQuery({
    queryKey: ['documents-by-type'],
    queryFn: async (): Promise<DocumentsByType[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          document_type_id,
          document_type:document_types(name)
        `);

      if (error) throw error;

      const typeCounts: Record<string, number> = {};
      
      data?.forEach((doc) => {
        const typeName = (doc.document_type as { name: string } | null)?.name || 'Outros';
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
      });

      const colors = [
        'hsl(var(--primary))',
        'hsl(var(--info))',
        'hsl(var(--success))',
        'hsl(var(--warning))',
        'hsl(var(--muted-foreground))',
      ];

      return Object.entries(typeCounts)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });
}

// Hook for documents by classification
export function useDocumentsByClassification() {
  return useQuery({
    queryKey: ['documents-by-classification'],
    queryFn: async (): Promise<DocumentsByClassification[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          classification_id,
          classification:classification_codes(code, name)
        `);

      if (error) throw error;

      const classificationCounts: Record<string, number> = {};
      
      data?.forEach((doc) => {
        const classification = doc.classification as { code: string; name: string } | null;
        const label = classification ? `${classification.code} - ${classification.name}` : 'Sem classificação';
        classificationCounts[label] = (classificationCounts[label] || 0) + 1;
      });

      return Object.entries(classificationCounts)
        .map(([classificacao, quantidade]) => ({ classificacao, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 6);
    },
  });
}

// Hook for recent documents
export function useRecentDocuments(limit = 5) {
  return useQuery({
    queryKey: ['recent-documents', limit],
    queryFn: async (): Promise<RecentDocumentData[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          entry_number,
          status,
          priority,
          entry_date,
          document_type:document_types(name, code),
          responsible_user:profiles!documents_responsible_user_id_fkey(full_name)
        `)
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []) as unknown as RecentDocumentData[];
    },
  });
}

// Hook for recent activities (document movements)
export function useRecentActivities(limit = 6) {
  return useQuery({
    queryKey: ['recent-activities', limit],
    queryFn: async (): Promise<RecentActivity[]> => {
      const { data, error } = await supabase
        .from('document_movements')
        .select(`
          id,
          action_type,
          dispatch_text,
          notes,
          created_at,
          document_id,
          document:documents(title, entry_number),
          from_user:profiles!document_movements_from_user_id_fkey(full_name),
          to_unit:organizational_units!document_movements_to_unit_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const getActivityType = (actionType: string): RecentActivity['type'] => {
        switch (actionType) {
          case 'dispatch': return 'dispatch';
          case 'forward': return 'forward';
          case 'approve': return 'approve';
          case 'reject': return 'reject';
          default: return 'create';
        }
      };

      const getTimeAgo = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `há ${diffMins} min`;
        if (diffHours < 24) return `há ${diffHours} horas`;
        if (diffDays === 1) return 'há 1 dia';
        return `há ${diffDays} dias`;
      };

      return (data || []).map((movement) => {
        const doc = movement.document as { title: string; entry_number: string } | null;
        const fromUser = movement.from_user as { full_name: string } | null;
        const toUnit = movement.to_unit as { name: string } | null;

        const actionLabels: Record<string, string> = {
          dispatch: 'Documento despachado',
          forward: 'Documento reencaminhado',
          approve: 'Documento aprovado',
          reject: 'Documento rejeitado',
          receive: 'Documento recebido',
        };

        return {
          id: movement.id,
          type: getActivityType(movement.action_type),
          title: actionLabels[movement.action_type] || 'Acção realizada',
          description: `${doc?.title || 'Documento'} ${toUnit ? `para ${toUnit.name}` : ''} ${fromUser ? `por ${fromUser.full_name}` : ''}`.trim(),
          time: getTimeAgo(movement.created_at),
          document_id: movement.document_id,
        };
      });
    },
  });
}
