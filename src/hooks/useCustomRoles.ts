import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  user_count: number;
  permissions: Record<string, string[]>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomRoles() {
  return useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("is_system", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as CustomRole[];
    },
  });
}

export function useCreateCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: Partial<CustomRole>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("custom_roles")
        .insert({
          name: role.name,
          description: role.description,
          permissions: role.permissions || {},
          is_system: false,
          user_count: 0,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success("Perfil criado com sucesso");
    },
    onError: (error) => {
      console.error("Error creating role:", error);
      toast.error("Erro ao criar perfil");
    },
  });
}

export function useUpdateCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomRole> & { id: string }) => {
      const { data, error } = await supabase
        .from("custom_roles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success("Perfil actualizado");
    },
    onError: (error) => {
      console.error("Error updating role:", error);
      toast.error("Erro ao actualizar perfil");
    },
  });
}

export function useDeleteCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success("Perfil eliminado");
    },
    onError: (error) => {
      console.error("Error deleting role:", error);
      toast.error("Erro ao eliminar perfil");
    },
  });
}

export function useDuplicateCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: CustomRole) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("custom_roles")
        .insert({
          name: `${role.name} (Cópia)`,
          description: role.description,
          permissions: role.permissions,
          is_system: false,
          user_count: 0,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success("Perfil duplicado com sucesso");
    },
    onError: (error) => {
      console.error("Error duplicating role:", error);
      toast.error("Erro ao duplicar perfil");
    },
  });
}
