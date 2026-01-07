import { AppRole } from "@/hooks/useUserRole";

export interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppRole[]; // Roles que têm acesso a este item
}

// Define quais roles podem aceder a cada funcionalidade
export const navigationPermissions: Record<string, AppRole[]> = {
  // Principal - Acesso geral
  "/": ["admin", "gestor", "tecnico", "consulta"],
  "/documents": ["admin", "gestor", "tecnico", "consulta"],
  "/processes": ["admin", "gestor", "tecnico", "consulta"],
  "/dispatches": ["admin", "gestor", "tecnico"],
  "/approvals": ["admin", "gestor"],
  "/assistant": ["admin", "gestor", "tecnico", "consulta"],
  
  // Digitalização - Técnicos e acima
  "/digitization": ["admin", "gestor", "tecnico"],
  "/ocr-processing": ["admin", "gestor", "tecnico"],
  "/classification": ["admin", "gestor", "tecnico"],
  "/quality-review": ["admin", "gestor"],
  
  // Relatórios e Arquivo
  "/reports": ["admin", "gestor"],
  "/folders": ["admin", "gestor", "tecnico", "consulta"],
  "/archive": ["admin", "gestor", "tecnico", "consulta"],
  
  // Gestão - Admin e Gestor
  "/users": ["admin"],
  "/permissions": ["admin"],
  "/notifications": ["admin", "gestor", "tecnico", "consulta"],
  "/workflow-builder": ["admin"],
  "/process-templates": ["admin", "gestor"],
  "/settings": ["admin"],
  
  // Páginas de detalhe seguem as permissões das páginas pai
  "/documents/new": ["admin", "gestor", "tecnico"],
  "/processes/new": ["admin", "gestor", "tecnico"],
  "/dispatches/new": ["admin", "gestor", "tecnico"],
};

// Permissões de acção dentro das páginas
export const actionPermissions = {
  documents: {
    view: ["admin", "gestor", "tecnico", "consulta"] as AppRole[],
    create: ["admin", "gestor", "tecnico"] as AppRole[],
    edit: ["admin", "gestor", "tecnico"] as AppRole[],
    delete: ["admin", "gestor"] as AppRole[],
    archive: ["admin", "gestor"] as AppRole[],
    download: ["admin", "gestor", "tecnico", "consulta"] as AppRole[],
    classify: ["admin", "gestor", "tecnico"] as AppRole[],
    // Ações de workflow de documentos
    validate: ["admin", "gestor"] as AppRole[],
    reject: ["admin", "gestor"] as AppRole[],
    dispatch: ["admin", "gestor", "tecnico"] as AppRole[],
    requestCorrection: ["admin", "gestor", "tecnico"] as AppRole[],
    attachToProcess: ["admin", "gestor", "tecnico"] as AppRole[],
    returnToOrigin: ["admin", "gestor"] as AppRole[],
    sign: ["admin", "gestor", "tecnico"] as AppRole[],
    createProcess: ["admin", "gestor", "tecnico"] as AppRole[],
    addAttachment: ["admin", "gestor", "tecnico"] as AppRole[],
    addComment: ["admin", "gestor", "tecnico"] as AppRole[],
  },
  processes: {
    view: ["admin", "gestor", "tecnico", "consulta"] as AppRole[],
    create: ["admin", "gestor", "tecnico"] as AppRole[],
    edit: ["admin", "gestor", "tecnico"] as AppRole[],
    delete: ["admin", "gestor"] as AppRole[],
    approve: ["admin", "gestor"] as AppRole[],
    reject: ["admin", "gestor"] as AppRole[],
    dispatch: ["admin", "gestor", "tecnico"] as AppRole[],
    forward: ["admin", "gestor", "tecnico"] as AppRole[],
    requestInfo: ["admin", "gestor", "tecnico"] as AppRole[],
    assign: ["admin", "gestor"] as AppRole[],
    close: ["admin", "gestor"] as AppRole[],
    addDocument: ["admin", "gestor", "tecnico"] as AppRole[],
    addParecer: ["admin", "gestor", "tecnico"] as AppRole[],
    addComment: ["admin", "gestor", "tecnico"] as AppRole[],
  },
  users: {
    view: ["admin"] as AppRole[],
    create: ["admin"] as AppRole[],
    edit: ["admin"] as AppRole[],
    delete: ["admin"] as AppRole[],
  },
  settings: {
    view: ["admin"] as AppRole[],
    edit: ["admin"] as AppRole[],
  },
};

/**
 * Verifica se um role tem acesso a uma rota específica
 */
export function canAccessRoute(role: AppRole | null, path: string): boolean {
  if (!role) return false;
  
  // Verifica correspondência exacta
  if (navigationPermissions[path]) {
    return navigationPermissions[path].includes(role);
  }
  
  // Verifica rotas pai (ex: /documents/123 -> /documents)
  const segments = path.split('/').filter(Boolean);
  while (segments.length > 0) {
    const parentPath = '/' + segments.join('/');
    if (navigationPermissions[parentPath]) {
      return navigationPermissions[parentPath].includes(role);
    }
    segments.pop();
  }
  
  // Se a rota não está definida, permite acesso (fallback)
  return true;
}

/**
 * Verifica se um role pode executar uma acção específica
 */
export function canPerformAction(
  role: AppRole | null, 
  module: keyof typeof actionPermissions, 
  action: string
): boolean {
  if (!role) return false;
  
  const modulePermissions = actionPermissions[module];
  if (!modulePermissions) return false;
  
  const actionRoles = modulePermissions[action as keyof typeof modulePermissions];
  if (!actionRoles) return false;
  
  return actionRoles.includes(role);
}

/**
 * Filtra items de menu baseado no role do utilizador
 */
export function filterMenuItems<T extends { href: string }>(
  items: T[], 
  role: AppRole | null
): T[] {
  if (!role) return [];
  return items.filter(item => canAccessRoute(role, item.href));
}
