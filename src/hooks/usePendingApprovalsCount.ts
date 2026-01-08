import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PendingApprovalsResult {
  total: number;
  urgent: number;
  hasUrgent: boolean;
}

export function usePendingApprovalsCount(): PendingApprovalsResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data = { total: 0, urgent: 0, hasUrgent: false } } = useQuery({
    queryKey: ['pending-approvals-count', user?.id],
    queryFn: async (): Promise<PendingApprovalsResult> => {
      if (!user?.id) return { total: 0, urgent: 0, hasUrgent: false };

      // Fetch total pending approvals
      const { count: totalCount } = await supabase
        .from('dispatch_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('approver_id', user.id)
        .eq('status', 'pendente');

      // Fetch urgent pending approvals (join with dispatches to check priority)
      const { data: urgentData } = await supabase
        .from('dispatch_approvals')
        .select('id, dispatches!inner(priority)')
        .eq('approver_id', user.id)
        .eq('status', 'pendente')
        .eq('dispatches.priority', 'urgente');

      const urgent = urgentData?.length || 0;
      const total = totalCount || 0;

      return { total, urgent, hasUrgent: urgent > 0 };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Real-time subscription for new approvals
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('pending-approvals-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dispatch_approvals',
          filter: `approver_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch dispatch details to check priority
          const { data: dispatch } = await supabase
            .from('dispatches')
            .select('subject, priority')
            .eq('id', payload.new.dispatch_id)
            .single();

          const isUrgent = dispatch?.priority === 'urgente';
          
          // Show toast notification
          toast.info(
            isUrgent ? '🔴 Nova aprovação urgente!' : 'Nova aprovação pendente',
            {
              description: dispatch?.subject || 'Um novo item requer sua aprovação',
              action: {
                label: 'Ver',
                onClick: () => window.location.href = '/approvals',
              },
              duration: isUrgent ? 10000 : 5000,
            }
          );

          // Invalidate query to refresh counts
          queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['approval-items'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dispatch_approvals',
          filter: `approver_id=eq.${user.id}`,
        },
        () => {
          // Refresh counts when approval status changes
          queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['approval-items'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return data;
}
