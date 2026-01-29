import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingApprovalsRealtime } from "./usePendingApprovalsRealtime";

interface PendingApprovalsResult {
  total: number;
  urgent: number;
  hasUrgent: boolean;
}

export function usePendingApprovalsCount(): PendingApprovalsResult {
  const { profile } = useAuth();

  const { data = { total: 0, urgent: 0, hasUrgent: false } } = useQuery({
    queryKey: ['pending-approvals-count', profile?.id],
    queryFn: async (): Promise<PendingApprovalsResult> => {
      if (!profile?.id) return { total: 0, urgent: 0, hasUrgent: false };

      // Fetch total pending approvals using profile.id (not user.id)
      const { count: totalCount } = await supabase
        .from('dispatch_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('approver_id', profile.id)
        .eq('status', 'pendente');

      // Fetch urgent pending approvals (join with dispatches to check priority)
      const { data: urgentData } = await supabase
        .from('dispatch_approvals')
        .select('id, dispatches!inner(priority)')
        .eq('approver_id', profile.id)
        .eq('status', 'pendente')
        .eq('dispatches.priority', 'urgente');

      const urgent = urgentData?.length || 0;
      const total = totalCount || 0;

      return { total, urgent, hasUrgent: urgent > 0 };
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  // Subscribe to realtime updates
  usePendingApprovalsRealtime();

  return data;
}
