import { ReactNode } from "react";
import { DemoRole } from "@/contexts/DemoAuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedContentProps {
  children: ReactNode;
  /** Roles que podem ver este conteúdo */
  roles?: DemoRole[];
  /** Módulo e acção para verificar permissão */
  permission?: {
    module: "documents" | "processes" | "users" | "settings";
    action: string;
  };
  /** Conteúdo alternativo quando não autorizado */
  fallback?: ReactNode;
  /** Se true, mostra conteúdo desabilitado em vez de esconder */
  showDisabled?: boolean;
}

/**
 * Componente para proteger conteúdo baseado em permissões
 * Esconde ou desabilita conteúdo que o utilizador não tem acesso
 */
export function ProtectedContent({
  children,
  roles,
  permission,
  fallback = null,
  showDisabled = false,
}: ProtectedContentProps) {
  const { hasRole, canDo } = usePermissions();

  let hasAccess = true;

  // Verifica roles se especificado
  if (roles && roles.length > 0) {
    hasAccess = hasRole(roles);
  }

  // Verifica permissão específica se especificada
  if (permission && hasAccess) {
    hasAccess = canDo(permission.module, permission.action);
  }

  // Se tem acesso, mostra o conteúdo
  if (hasAccess) {
    return <>{children}</>;
  }

  // Se deve mostrar desabilitado
  if (showDisabled) {
    return (
      <div className="opacity-50 pointer-events-none cursor-not-allowed">
        {children}
      </div>
    );
  }

  // Mostra fallback ou nada
  return <>{fallback}</>;
}

/**
 * Componente wrapper para botões protegidos
 */
interface ProtectedButtonProps {
  children: ReactNode;
  roles?: DemoRole[];
  permission?: {
    module: "documents" | "processes" | "users" | "settings";
    action: string;
  };
  /** Tooltip a mostrar quando desabilitado */
  disabledTooltip?: string;
}

export function ProtectedButton({
  children,
  roles,
  permission,
}: ProtectedButtonProps) {
  return (
    <ProtectedContent roles={roles} permission={permission}>
      {children}
    </ProtectedContent>
  );
}
