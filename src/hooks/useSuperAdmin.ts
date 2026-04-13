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
    mutationFn: async (input: {
      name: string;
      code: string;
      domain?: string;
      plan?: string;
      storage_quota_mb?: number;
      max_users?: number;
      contact_email?: string;
      notes?: string;
      admin_email: string;
      admin_password: string;
      admin_full_name: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-organization", {
        body: {
          org_name: input.name,
          org_code: input.code,
          domain: input.domain,
          contact_email: input.contact_email,
          plan: input.plan,
          admin_email: input.admin_email,
          admin_password: input.admin_password,
          admin_full_name: input.admin_full_name,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Update quota/max_users if non-default
      if (data?.organization?.id && (input.storage_quota_mb || input.max_users || input.notes)) {
        await supabase.from("organizations").update({
          storage_quota_mb: input.storage_quota_mb ?? 5120,
          max_users: input.max_users ?? 50,
          notes: input.notes || null,
        }).eq("id", data.organization.id);
      }
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
