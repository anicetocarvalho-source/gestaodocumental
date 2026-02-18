import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveProcess {
  id: string;
  name: string;
  stage: string;
  progress: number;
  deadline: string | null;
  assignees: number;
  priority: 'high' | 'medium' | 'low';
}

export function useActiveProcesses(limit = 4) {
  return useQuery({
    queryKey: ['active-processes', limit],
    queryFn: async (): Promise<ActiveProcess[]> => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          id,
          subject,
          status,
          priority,
          deadline,
          process_number,
          stages:process_stages(id, name, status, stage_order)
        `)
        .in('status', ['em_andamento', 'aguardando_aprovacao', 'rascunho'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((proc) => {
        const stages = (proc.stages as Array<{ id: string; name: string; status: string; stage_order: number }>) || [];
        const totalStages = stages.length || 1;
        const completedStages = stages.filter((s) => s.status === 'completed').length;
        const progress = Math.round((completedStages / totalStages) * 100);
        
        const currentStage = stages
          .sort((a, b) => a.stage_order - b.stage_order)
          .find((s) => s.status !== 'completed');

        const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
          urgent: 'high',
          high: 'high',
          normal: 'medium',
          low: 'low',
        };

        return {
          id: proc.id,
          name: proc.subject || proc.process_number || 'Processo sem título',
          stage: currentStage?.name || 'Em andamento',
          progress,
          deadline: proc.deadline,
          assignees: stages.length,
          priority: priorityMap[proc.priority] || 'medium',
        };
      });
    },
  });
}
