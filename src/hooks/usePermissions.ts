import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { canAccessRoute, canPerformAction, actionPermissions } from "@/lib/permissions";

/**
 * Hook para verificar permissões do utilizador actual
 */
export function usePermissions() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { primaryRole, isLoading: roleLoading, hasRole, hasAnyRole, hasRoleOrHigher } = useUserRole();

  const isLoading = authLoading || roleLoading;

  /**
   * Verifica se o utilizador pode aceder a uma rota
   */
  const canAccess = (path: string): boolean => {
    if (!isAuthenticated || !primaryRole) return false;
    return canAccessRoute(primaryRole, path);
  };

  /**
   * Verifica se o utilizador pode executar uma acção
   */
  const canDo = (
    module: keyof typeof actionPermissions,
    action: string
  ): boolean => {
    if (!isAuthenticated || !primaryRole) return false;
    return canPerformAction(primaryRole, module, action);
  };

  /**
   * Verifica se o utilizador tem um dos roles especificados
   */
  const hasRoles = (roles: AppRole[]): boolean => {
    return hasAnyRole(roles);
  };

  /**
   * Retorna true se o utilizador é admin
   */
  const isAdmin = primaryRole === "admin";

  /**
   * Retorna true se o utilizador é gestor ou admin
   */
  const isManagerOrAbove = primaryRole === "admin" || primaryRole === "gestor";

  /**
   * Retorna true se o utilizador pode editar (não é apenas consulta)
   */
  const canEdit = primaryRole !== "consulta" && primaryRole !== null;

  return {
    role: primaryRole,
    isAuthenticated,
    isLoading,
    canAccess,
    canDo,
    hasRole: hasRoles,
    isAdmin,
    isManagerOrAbove,
    canEdit,
  };
}
