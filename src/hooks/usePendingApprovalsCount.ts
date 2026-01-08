import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePendingApprovalsCount() {
  const { user } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ['pending-approvals-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count } = await supabase
        .from('dispatch_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('approver_id', user.id)
        .eq('status', 'pendente');

      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return count;
}
