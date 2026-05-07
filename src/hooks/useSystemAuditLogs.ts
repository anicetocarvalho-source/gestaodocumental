import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemAuditFilters {
  organizationId?: string;
  tableName?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SystemAuditEntry {
  id: string;
  created_at: string;
  action: string;
  table_name: string;
  record_id: string;
  user_id: string | null;
  user_name: string | null;
  organization_id: string | null;
  organization_name: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

export function useSystemAuditTables() {
  return useQuery({
    queryKey: ["system-audit-tables"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("table_name")
        .limit(1000);
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r) => r.table_name))).sort();
    },
  });
}

export function useSystemAuditOrganizations() {
  return useQuery({
    queryKey: ["system-audit-orgs"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSystemAuditLogs(filters: SystemAuditFilters, limit = 200) {
  return useQuery({
    queryKey: ["system-audit-logs", filters, limit],
    queryFn: async (): Promise<SystemAuditEntry[]> => {
      let q = supabase
        .from("audit_log")
        .select("id, created_at, action, table_name, record_id, user_id, old_data, new_data")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (filters.tableName) q = q.eq("table_name", filters.tableName);
      if (filters.action) q = q.eq("action", filters.action);
      if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        q = q.lte("created_at", to.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [];

      // Enrich with profile (user name + org)
      const userIds = Array.from(
        new Set(rows.map((r) => r.user_id).filter(Boolean) as string[])
      );
      let profileMap = new Map<
        string,
        { full_name: string | null; organization_id: string | null }
      >();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, organization_id")
          .in("user_id", userIds);
        (profiles ?? []).forEach((p) =>
          profileMap.set(p.user_id, {
            full_name: p.full_name,
            organization_id: p.organization_id,
          })
        );
      }

      const orgIds = Array.from(
        new Set(
          Array.from(profileMap.values())
            .map((p) => p.organization_id)
            .filter(Boolean) as string[]
        )
      );
      let orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);
        (orgs ?? []).forEach((o) => orgMap.set(o.id, o.name));
      }

      const enriched: SystemAuditEntry[] = rows.map((r) => {
        const prof = r.user_id ? profileMap.get(r.user_id) : undefined;
        const orgId = prof?.organization_id ?? null;
        return {
          id: r.id,
          created_at: r.created_at,
          action: r.action,
          table_name: r.table_name,
          record_id: r.record_id,
          user_id: r.user_id,
          user_name: prof?.full_name ?? null,
          organization_id: orgId,
          organization_name: orgId ? orgMap.get(orgId) ?? null : null,
          old_data: r.old_data as Record<string, unknown> | null,
          new_data: r.new_data as Record<string, unknown> | null,
        };
      });

      // Filter by organization client-side (after enrichment)
      if (filters.organizationId) {
        return enriched.filter((e) => e.organization_id === filters.organizationId);
      }
      return enriched;
    },
  });
}
