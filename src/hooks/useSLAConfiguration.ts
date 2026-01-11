import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SLARule {
  id: string;
  name: string;
  description: string | null;
  process_type: string;
  priority: string;
  duration_hours: number;
  warning_threshold: number;
  critical_threshold: number;
  escalation_rules: any[];
  alert_config: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SLAPriority {
  id: string;
  priority_key: string;
  label: string;
  color: string;
  time_multiplier: number;
  initial_escalation_role: string | null;
  created_at: string;
  updated_at: string;
}

export function useSLARules() {
  return useQuery({
    queryKey: ["sla-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_rules")
        .select("*")
        .order("process_type");

      if (error) throw error;
      return data as SLARule[];
    },
  });
}

export function useSLAPriorities() {
  return useQuery({
    queryKey: ["sla-priorities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_priorities")
        .select("*")
        .order("time_multiplier");

      if (error) throw error;
      return data as SLAPriority[];
    },
  });
}

export function useCreateSLARule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<SLARule>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("sla_rules")
        .insert({
          name: rule.name,
          description: rule.description,
          process_type: rule.process_type,
          priority: rule.priority || "normal",
          duration_hours: rule.duration_hours || 48,
          warning_threshold: rule.warning_threshold || 75,
          critical_threshold: rule.critical_threshold || 90,
          escalation_rules: rule.escalation_rules || [],
          alert_config: rule.alert_config || {},
          is_active: rule.is_active ?? true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-rules"] });
      toast.success("Regra SLA criada com sucesso");
    },
    onError: (error) => {
      console.error("Error creating SLA rule:", error);
      toast.error("Erro ao criar regra SLA");
    },
  });
}

export function useUpdateSLARule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SLARule> & { id: string }) => {
      const { data, error } = await supabase
        .from("sla_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-rules"] });
      toast.success("Regra SLA actualizada");
    },
    onError: (error) => {
      console.error("Error updating SLA rule:", error);
      toast.error("Erro ao actualizar regra SLA");
    },
  });
}

export function useDeleteSLARule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sla_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-rules"] });
      toast.success("Regra SLA eliminada");
    },
    onError: (error) => {
      console.error("Error deleting SLA rule:", error);
      toast.error("Erro ao eliminar regra SLA");
    },
  });
}

export function useUpdateSLAPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SLAPriority> & { id: string }) => {
      const { data, error } = await supabase
        .from("sla_priorities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-priorities"] });
      toast.success("Prioridade actualizada");
    },
    onError: (error) => {
      console.error("Error updating priority:", error);
      toast.error("Erro ao actualizar prioridade");
    },
  });
}
