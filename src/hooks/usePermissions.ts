import { useDemoAuth, DemoRole } from "@/contexts/DemoAuthContext";
import { canAccessRoute, canPerformAction, actionPermissions } from "@/lib/permissions";

/**
 * Hook para verificar permissões do utilizador actual
 */
export function usePermissions() {
  const { role, isAuthenticated } = useDemoAuth();

  /**
   * Verifica se o utilizador pode aceder a uma rota
   */
  const canAccess = (path: string): boolean => {
    if (!isAuthenticated || !role) return false;
    return canAccessRoute(role, path);
  };

  /**
   * Verifica se o utilizador pode executar uma acção
   */
  const canDo = (
    module: keyof typeof actionPermissions,
    action: string
  ): boolean => {
    if (!isAuthenticated || !role) return false;
    return canPerformAction(role, module, action);
  };

  /**
   * Verifica se o utilizador tem um dos roles especificados
   */
  const hasRole = (roles: DemoRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  /**
   * Retorna true se o utilizador é admin
   */
  const isAdmin = role === "admin";

  /**
   * Retorna true se o utilizador é gestor ou admin
   */
  const isManagerOrAbove = role === "admin" || role === "gestor";

  /**
   * Retorna true se o utilizador pode editar (não é apenas consulta)
   */
  const canEdit = role !== "consulta" && role !== null;

  return {
    role,
    isAuthenticated,
    canAccess,
    canDo,
    hasRole,
    isAdmin,
    isManagerOrAbove,
    canEdit,
  };
}
