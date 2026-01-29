import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ApprovalItemType = 'document' | 'process' | 'dispatch';

export interface ApprovalItem {
  id: string;
  type: ApprovalItemType;
  title: string;
  description: string | null;
  submitter: string;
  submitterInitials: string;
  department: string | null;
  submitted: string;
  submittedAt: string;
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  urgent: boolean;
  referenceId: string;
  // For dispatches
  dispatchNumber?: string;
  dispatchType?: string;
  approvalId?: string;
}

export interface ApprovalStats {
  pending: number;
  urgent: number;
  approvedToday: number;
  rejected: number;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `há ${diffMins} minutos`;
  if (diffHours < 24) return `há ${diffHours} horas`;
  if (diffDays === 1) return 'há 1 dia';
  return `há ${diffDays} dias`;
};

export function useApprovalQueue() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all pending approvals for the current user using profile.id
  const { data: approvalItems = [], isLoading, error } = useQuery({
    queryKey: ['approval-queue', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Fetch pending dispatch approvals for the current user
      const { data: dispatchApprovals, error: dispatchError } = await supabase
        .from('dispatch_approvals')
        .select(`
          id,
          dispatch_id,
          approval_order,
          status,
          created_at,
          dispatches (
            id,
            dispatch_number,
            subject,
            content,
            dispatch_type,
            priority,
            created_at,
            created_by,
            origin_unit_id,
            organizational_units:origin_unit_id (name)
          )
        `)
        .eq('approver_id', profile.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (dispatchError) {
        console.error('Error fetching dispatch approvals:', dispatchError);
        throw dispatchError;
      }

      // Fetch profile info for creators
      const creatorIds = dispatchApprovals
        ?.map((a: any) => a.dispatches?.created_by)
        .filter(Boolean) as string[];
      
      let creatorProfiles: Record<string, { full_name: string }> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        
        profiles?.forEach((p: any) => {
          creatorProfiles[p.user_id] = { full_name: p.full_name };
        });
      }

      // Transform dispatch approvals to approval items
      const items: ApprovalItem[] = (dispatchApprovals || []).map((approval: any) => {
        const dispatch = approval.dispatches;
        const creatorName = creatorProfiles[dispatch?.created_by]?.full_name || 'Desconhecido';
        const unitName = dispatch?.organizational_units?.name || null;

        return {
          id: approval.id,
          type: 'dispatch' as ApprovalItemType,
          title: dispatch?.subject || 'Sem assunto',
          description: dispatch?.content?.substring(0, 150) || null,
          submitter: creatorName,
          submitterInitials: getInitials(creatorName),
          department: unitName,
          submitted: formatTimeAgo(approval.created_at),
          submittedAt: approval.created_at,
          priority: dispatch?.priority || 'normal',
          urgent: dispatch?.priority === 'urgente' || dispatch?.priority === 'alta',
          referenceId: dispatch?.id,
          dispatchNumber: dispatch?.dispatch_number,
          dispatchType: dispatch?.dispatch_type,
          approvalId: approval.id,
        };
      });

      return items;
    },
    enabled: !!profile?.id,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['approval-queue-stats', profile?.id],
    queryFn: async (): Promise<ApprovalStats> => {
      if (!profile?.id) return { pending: 0, urgent: 0, approvedToday: 0, rejected: 0 };

      // Get pending count
      const { count: pendingCount } = await supabase
        .from('dispatch_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('approver_id', profile.id)
        .eq('status', 'pendente');

      // Get urgent count (pending with urgent/alta priority dispatches)
      const { data: urgentItems } = await supabase
        .from('dispatch_approvals')
        .select('dispatch_id, dispatches!inner(priority)')
        .eq('approver_id', profile.id)
        .eq('status', 'pendente')
        .in('dispatches.priority', ['urgente', 'alta']);

      // Get approved today count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: approvedTodayCount } = await supabase
        .from('dispatch_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('approver_id', profile.id)
        .eq('status', 'aprovado')
        .gte('approved_at', today.toISOString());

      // Get rejected (all time for this user)
      const { count: rejectedCount } = await supabase
        .from('dispatch_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('approver_id', profile.id)
        .eq('status', 'rejeitado');

      return {
        pending: pendingCount || 0,
        urgent: urgentItems?.length || 0,
        approvedToday: approvedTodayCount || 0,
        rejected: rejectedCount || 0,
      };
    },
    enabled: !!profile?.id,
  });

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: async ({ 
      approvalId, 
      decision, 
      comments 
    }: { 
      approvalId: string; 
      decision: 'aprovado' | 'rejeitado' | 'devolvido'; 
      comments?: string 
    }) => {
      const { error } = await supabase
        .from('dispatch_approvals')
        .update({
          status: decision,
          approved_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq('id', approvalId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      
      const messages = {
        aprovado: 'Item aprovado com sucesso',
        rejeitado: 'Item rejeitado',
        devolvido: 'Item devolvido para revisão',
      };
      toast.success(messages[variables.decision]);
    },
    onError: (error) => {
      console.error('Error processing approval:', error);
      toast.error('Erro ao processar aprovação');
    },
  });

  // Bulk approval mutation
  const bulkApprovalMutation = useMutation({
    mutationFn: async ({ 
      approvalIds, 
      decision, 
      comments 
    }: { 
      approvalIds: string[]; 
      decision: 'aprovado' | 'rejeitado' | 'devolvido'; 
      comments?: string 
    }) => {
      const { error } = await supabase
        .from('dispatch_approvals')
        .update({
          status: decision,
          approved_at: new Date().toISOString(),
          comments: comments || null,
        })
        .in('id', approvalIds);

      if (error) throw error;
      return approvalIds.length;
    },
    onSuccess: (count, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      
      const messages = {
        aprovado: `${count} ${count === 1 ? 'item aprovado' : 'itens aprovados'} com sucesso`,
        rejeitado: `${count} ${count === 1 ? 'item rejeitado' : 'itens rejeitados'}`,
        devolvido: `${count} ${count === 1 ? 'item devolvido' : 'itens devolvidos'} para revisão`,
      };
      toast.success(messages[variables.decision]);
    },
    onError: (error) => {
      console.error('Error processing bulk approval:', error);
      toast.error('Erro ao processar aprovações em massa');
    },
  });

  // Fetch approval history for a specific dispatch
  const getApprovalHistory = async (dispatchId: string) => {
    const { data, error } = await supabase
      .from('dispatch_approvals')
      .select(`
        id,
        status,
        approved_at,
        created_at,
        comments,
        approver_id,
        profiles:approver_id (full_name)
      `)
      .eq('dispatch_id', dispatchId)
      .order('approval_order', { ascending: true });

    if (error) {
      console.error('Error fetching approval history:', error);
      return [];
    }

    return data?.map((item: any) => ({
      user: item.profiles?.full_name || 'Desconhecido',
      action: item.status === 'aprovado' ? 'Aprovado' : 
              item.status === 'rejeitado' ? 'Rejeitado' : 
              item.status === 'devolvido' ? 'Devolvido' : 'Pendente',
      date: item.approved_at ? formatTimeAgo(item.approved_at) : formatTimeAgo(item.created_at),
      status: item.status,
    })) || [];
  };

  return {
    approvalItems,
    stats: stats || { pending: 0, urgent: 0, approvedToday: 0, rejected: 0 },
    isLoading,
    error,
    processApproval: processApprovalMutation.mutate,
    isProcessing: processApprovalMutation.isPending,
    processBulkApproval: bulkApprovalMutation.mutate,
    isBulkProcessing: bulkApprovalMutation.isPending,
    getApprovalHistory,
  };
}
