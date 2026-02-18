import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'permission' | 'error' | 'status_change';
  object: string;
  objectType: string;
  objectId: string;
  details: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
}

export interface AuditLogFilters {
  search?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditLogStats {
  total: number;
  creates: number;
  updates: number;
  deletes: number;
  statusChanges: number;
}

const mapAction = (action: string): AuditLogEntry['actionType'] => {
  if (action === 'create') return 'create';
  if (action === 'status_change') return 'status_change';
  if (action === 'update') return 'update';
  if (action === 'delete') return 'delete';
  return 'update';
};

const getSeverity = (action: string): AuditLogEntry['severity'] => {
  if (action === 'delete') return 'warning';
  if (action === 'status_change') return 'info';
  if (action === 'create') return 'info';
  return 'info';
};

const actionLabels: Record<string, string> = {
  create: 'Criou',
  status_change: 'Alterou estado',
  update: 'Actualizou',
  delete: 'Eliminou',
};

export function useAuditLogs(filters?: AuditLogFilters, limit = 50) {
  return useQuery({
    queryKey: ['audit-logs', filters, limit],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      // Fetch from all three audit log tables in parallel
      const [docResult, dispatchResult, processResult] = await Promise.all([
        supabase
          .from('document_audit_log')
          .select('id, action, description, old_values, new_values, performed_by, created_at, document_id, ip_address')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('dispatch_audit_log')
          .select('id, action, description, old_values, new_values, performed_by, created_at, dispatch_id')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('process_audit_log')
          .select('id, action, description, old_values, new_values, performed_by, created_at, process_id, ip_address')
          .order('created_at', { ascending: false })
          .limit(limit),
      ]);

      const entries: AuditLogEntry[] = [];

      // Map document audit logs
      (docResult.data || []).forEach((log) => {
        entries.push({
          id: log.id,
          timestamp: log.created_at,
          user: log.performed_by || 'Sistema',
          userId: log.performed_by || 'SYSTEM',
          action: actionLabels[log.action] || log.action,
          actionType: mapAction(log.action),
          object: log.description || 'Documento',
          objectType: 'Documento',
          objectId: log.document_id,
          details: log.description || '',
          ip: log.ip_address || '-',
          severity: getSeverity(log.action),
          beforeData: log.old_values as Record<string, unknown> | undefined,
          afterData: log.new_values as Record<string, unknown> | undefined,
        });
      });

      // Map dispatch audit logs
      (dispatchResult.data || []).forEach((log) => {
        entries.push({
          id: log.id,
          timestamp: log.created_at,
          user: log.performed_by || 'Sistema',
          userId: log.performed_by || 'SYSTEM',
          action: actionLabels[log.action] || log.action,
          actionType: mapAction(log.action),
          object: log.description || 'Despacho',
          objectType: 'Despacho',
          objectId: log.dispatch_id,
          details: log.description || '',
          ip: '-',
          severity: getSeverity(log.action),
          beforeData: log.old_values as Record<string, unknown> | undefined,
          afterData: log.new_values as Record<string, unknown> | undefined,
        });
      });

      // Map process audit logs
      (processResult.data || []).forEach((log) => {
        entries.push({
          id: log.id,
          timestamp: log.created_at,
          user: log.performed_by || 'Sistema',
          userId: log.performed_by || 'SYSTEM',
          action: actionLabels[log.action] || log.action,
          actionType: mapAction(log.action),
          object: log.description || 'Processo',
          objectType: 'Processo',
          objectId: log.process_id,
          details: log.description || '',
          ip: log.ip_address || '-',
          severity: getSeverity(log.action),
          beforeData: log.old_values as Record<string, unknown> | undefined,
          afterData: log.new_values as Record<string, unknown> | undefined,
        });
      });

      // Sort by timestamp descending
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply client-side filters
      let filtered = entries;

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.action.toLowerCase().includes(q) ||
            e.object.toLowerCase().includes(q) ||
            e.details.toLowerCase().includes(q) ||
            e.objectType.toLowerCase().includes(q)
        );
      }

      if (filters?.actionType) {
        filtered = filtered.filter((e) => e.actionType === filters.actionType);
      }

      if (filters?.dateFrom) {
        const from = new Date(filters.dateFrom);
        filtered = filtered.filter((e) => new Date(e.timestamp) >= from);
      }

      if (filters?.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((e) => new Date(e.timestamp) <= to);
      }

      return filtered;
    },
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ['audit-log-stats'],
    queryFn: async (): Promise<AuditLogStats> => {
      const [docResult, dispatchResult, processResult] = await Promise.all([
        supabase.from('document_audit_log').select('action'),
        supabase.from('dispatch_audit_log').select('action'),
        supabase.from('process_audit_log').select('action'),
      ]);

      const allActions = [
        ...(docResult.data || []),
        ...(dispatchResult.data || []),
        ...(processResult.data || []),
      ];

      return {
        total: allActions.length,
        creates: allActions.filter((a) => a.action === 'create').length,
        updates: allActions.filter((a) => a.action === 'update').length,
        deletes: allActions.filter((a) => a.action === 'delete').length,
        statusChanges: allActions.filter((a) => a.action === 'status_change').length,
      };
    },
  });
}
