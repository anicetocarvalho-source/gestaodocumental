import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Organizations
export function useOrganizations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createOrganization = useMutation({
    mutationFn: async (org: {
      name: string;
      code: string;
      domain?: string;
      plan?: string;
      storage_quota_mb?: number;
      max_users?: number;
      contact_email?: string;
      contact_phone?: string;
      address?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("organizations")
        .insert(org)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organização criada com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar organização", description: err.message, variant: "destructive" });
    },
  });

  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organização actualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao actualizar", description: err.message, variant: "destructive" });
    },
  });

  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organização removida" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  return { ...query, createOrganization, updateOrganization, deleteOrganization };
}

// Platform stats
export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [orgs, docs, processes, profiles] = await Promise.all([
        supabase.from("organizations").select("id, storage_used_mb, storage_quota_mb, is_active", { count: "exact" }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("processes").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const orgData = orgs.data || [];
      const totalStorage = orgData.reduce((sum, o) => sum + (o.storage_used_mb || 0), 0);
      const totalQuota = orgData.reduce((sum, o) => sum + (o.storage_quota_mb || 0), 0);

      return {
        totalOrganizations: orgs.count || orgData.length,
        activeOrganizations: orgData.filter(o => o.is_active).length,
        totalDocuments: docs.count || 0,
        totalProcesses: processes.count || 0,
        totalUsers: profiles.count || 0,
        totalStorageUsedMb: totalStorage,
        totalStorageQuotaMb: totalQuota,
      };
    },
  });
}

// Platform settings
export function usePlatformSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("setting_key");
      if (error) throw error;
      return data;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, setting_value }: { id: string; setting_value: string }) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({ setting_value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({ title: "Configuração actualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao actualizar", description: err.message, variant: "destructive" });
    },
  });

  return { ...query, updateSetting };
}
