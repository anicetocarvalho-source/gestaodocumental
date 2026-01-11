import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  process_type: string;
  estimated_days: number;
  tags: string[];
  steps: any[];
  is_active: boolean;
  is_favorite: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProcessTemplates() {
  return useQuery({
    queryKey: ["process-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProcessTemplate[];
    },
  });
}

export function useCreateProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<ProcessTemplate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("process_templates")
        .insert({
          name: template.name,
          description: template.description,
          category: template.category || "Geral",
          process_type: template.process_type || "Administrativo",
          estimated_days: template.estimated_days || 5,
          tags: template.tags || [],
          steps: template.steps || [],
          is_active: template.is_active ?? true,
          is_favorite: template.is_favorite ?? false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] });
      toast.success("Template criado com sucesso");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

export function useUpdateProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("process_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] });
      toast.success("Template actualizado");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("Erro ao actualizar template");
    },
  });
}

export function useDeleteProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("process_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] });
      toast.success("Template eliminado");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Erro ao eliminar template");
    },
  });
}

export function useDuplicateProcessTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: ProcessTemplate) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("process_templates")
        .insert({
          name: `${template.name} (cópia)`,
          description: template.description,
          category: template.category,
          process_type: template.process_type,
          estimated_days: template.estimated_days,
          tags: template.tags,
          steps: template.steps,
          is_active: false,
          is_favorite: false,
          usage_count: 0,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] });
      toast.success("Template duplicado com sucesso");
    },
    onError: (error) => {
      console.error("Error duplicating template:", error);
      toast.error("Erro ao duplicar template");
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("process_templates")
        .update({ is_favorite })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { is_favorite }) => {
      queryClient.invalidateQueries({ queryKey: ["process-templates"] });
      toast.success(is_favorite ? "Adicionado aos favoritos" : "Removido dos favoritos");
    },
    onError: (error) => {
      console.error("Error toggling favorite:", error);
      toast.error("Erro ao actualizar favorito");
    },
  });
}
