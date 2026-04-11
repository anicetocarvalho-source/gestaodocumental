import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkflowNodeData {
  id: string;
  type: "start" | "task" | "gateway" | "end";
  x: number;
  y: number;
  name: string;
  description?: string;
  assignee?: string;
  sla?: string;
  condition?: string;
  taskType?: string;
}

export interface WorkflowConnectionData {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  nodes: WorkflowNodeData[];
  connections: WorkflowConnectionData[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useWorkflows() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((w: any) => ({
        ...w,
        nodes: (w.nodes || []) as WorkflowNodeData[],
        connections: (w.connections || []) as WorkflowConnectionData[],
      })) as Workflow[];
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      nodes: WorkflowNodeData[];
      connections: WorkflowConnectionData[];
    }) => {
      const { data, error } = await supabase
        .from("workflows")
        .insert({
          name: input.name,
          description: input.description || null,
          nodes: JSON.parse(JSON.stringify(input.nodes)),
          connections: JSON.parse(JSON.stringify(input.connections)),
          created_by: user?.id,
          status: "draft",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar workflow: " + error.message);
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      status?: string;
      nodes?: WorkflowNodeData[];
      connections?: WorkflowConnectionData[];
    }) => {
      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status !== undefined) updates.status = input.status;
      if (input.nodes !== undefined) updates.nodes = JSON.parse(JSON.stringify(input.nodes));
      if (input.connections !== undefined) updates.connections = JSON.parse(JSON.stringify(input.connections));

      const { data, error } = await supabase
        .from("workflows")
        .update(updates)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow guardado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao guardar workflow: " + error.message);
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar workflow: " + error.message);
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
  };
}
