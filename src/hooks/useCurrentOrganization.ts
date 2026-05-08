import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCurrentOrganization() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;
  return useQuery({
    queryKey: ["current-organization", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string } | null;
    },
  });
}
