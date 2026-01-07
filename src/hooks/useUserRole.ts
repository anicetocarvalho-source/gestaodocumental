import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gestor" | "tecnico" | "consulta";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRole[];
    },
  });

  const primaryRole = roles?.[0]?.role ?? null;

  const hasRole = (role: AppRole): boolean => {
    return roles?.some((r) => r.role === role) ?? false;
  };

  const hasAnyRole = (requiredRoles: AppRole[]): boolean => {
    return roles?.some((r) => requiredRoles.includes(r.role)) ?? false;
  };

  // Role hierarchy check - admin > gestor > tecnico > consulta
  const hasRoleOrHigher = (minRole: AppRole): boolean => {
    const hierarchy: AppRole[] = ["admin", "gestor", "tecnico", "consulta"];
    const minIndex = hierarchy.indexOf(minRole);
    return roles?.some((r) => hierarchy.indexOf(r.role) <= minIndex) ?? false;
  };

  return {
    roles,
    primaryRole,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    hasRoleOrHigher,
    isAdmin: hasRole("admin"),
    isGestor: hasRole("gestor"),
    isTecnico: hasRole("tecnico"),
    isConsulta: hasRole("consulta"),
  };
}

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  tecnico: "Técnico",
  consulta: "Consulta",
};

export const roleDescriptions: Record<AppRole, string> = {
  admin: "Acesso total ao sistema, gestão de utilizadores e configurações",
  gestor: "Aprovação de processos, gestão de documentos e relatórios",
  tecnico: "Criação e tramitação de documentos e processos",
  consulta: "Visualização de documentos e processos (apenas leitura)",
};
