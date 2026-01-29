import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function usePendingApprovalsRealtime() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Use profile.id (FK to dispatch_approvals.approver_id), not user.id (auth.users.id)
    if (!profile?.id) {
      return;
    }

    // Clean up existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`pending-approvals-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dispatch_approvals',
          filter: `approver_id=eq.${profile.id}`,
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

          // Invalidate queries to refresh counts
          queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', profile.id] });
          queryClient.invalidateQueries({ queryKey: ['approval-items'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dispatch_approvals',
          filter: `approver_id=eq.${profile.id}`,
        },
        () => {
          // Refresh counts when approval status changes
          queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', profile.id] });
          queryClient.invalidateQueries({ queryKey: ['approval-items'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id, queryClient]);
}
