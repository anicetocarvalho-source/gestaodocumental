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
  "/ged": ["admin", "gestor", "tecnico", "consulta"],
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
  "/permissions-matrix": ["admin"],
  "/notifications": ["admin", "gestor", "tecnico", "consulta"],
  "/workflow-builder": ["admin"],
  "/process-templates": ["admin", "gestor"],
  "/settings": ["admin"],
  "/super-admin": ["admin"],
  "/flow-documentation": ["admin", "gestor", "tecnico", "consulta"],
  "/profile": ["admin", "gestor", "tecnico", "consulta"],
  "/protocol-book": ["admin", "gestor", "tecnico", "consulta"],
  "/protocol-flow": ["admin", "gestor", "tecnico", "consulta"],

  // Rotas sensíveis - acesso restrito
  "/audit-logs": ["admin", "gestor"],
  "/traceability": ["admin", "gestor"],
  "/archive/advanced-reports": ["admin", "gestor"],
  "/sla-configuration": ["admin"],
  "/pending-approvals": ["admin", "gestor"],
  "/workflow-visualization": ["admin", "gestor"],
  "/document-intelligence": ["admin", "gestor", "tecnico"],
  "/intelligent-search": ["admin", "gestor", "tecnico", "consulta"],
  "/procedure-guide": ["admin", "gestor", "tecnico", "consulta"],
  "/movement-history": ["admin", "gestor", "tecnico", "consulta"],
  "/search": ["admin", "gestor", "tecnico", "consulta"],
  
  // Páginas de detalhe seguem as permissões das páginas pai
  "/documents/new": ["admin", "gestor", "tecnico"],
  "/physical-seals": ["admin", "gestor", "tecnico", "consulta"],
  "/physical-seals/new": ["admin", "gestor", "tecnico"],
  "/processes/new": ["admin", "gestor", "tecnico"],
  "/dispatches/new": ["admin", "gestor", "tecnico"],
  "/dispatches/decisions": ["admin", "gestor", "tecnico"],

  // Arquivo físico e integrações
  "/archive/locations": ["admin", "gestor", "tecnico"],
  "/archive/tracking": ["admin", "gestor", "tecnico"],
  "/archive/loans": ["admin", "gestor", "tecnico", "consulta"],
  "/archive/history": ["admin", "gestor", "tecnico", "consulta"],
  "/archive/reports": ["admin", "gestor"],
  "/integrations": ["admin"],
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
  dispatches: {
    view: ["admin", "gestor", "tecnico"] as AppRole[],
    create: ["admin", "gestor", "tecnico"] as AppRole[],
    edit: ["admin", "gestor", "tecnico"] as AppRole[],
    delete: ["admin", "gestor"] as AppRole[],
    approve: ["admin", "gestor"] as AppRole[],
    reject: ["admin", "gestor"] as AppRole[],
    sign: ["admin", "gestor"] as AppRole[],
    cancel: ["admin", "gestor"] as AppRole[],
    addApprover: ["admin", "gestor"] as AppRole[],
    removeApprover: ["admin", "gestor"] as AppRole[],
    addRecipient: ["admin", "gestor", "tecnico"] as AppRole[],
    emit: ["admin", "gestor"] as AppRole[],
  },
  archive: {
    view: ["admin", "gestor", "tecnico", "consulta"] as AppRole[],
    markForDestruction: ["admin", "gestor"] as AppRole[],
    approveDestruction: ["admin"] as AppRole[],
    executeDestruction: ["admin"] as AppRole[],
    cancelDestruction: ["admin", "gestor"] as AppRole[],
    extendRetention: ["admin", "gestor"] as AppRole[],
    bulkOperations: ["admin", "gestor"] as AppRole[],
    exportReport: ["admin", "gestor"] as AppRole[],
  },
  reports: {
    view: ["admin", "gestor"] as AppRole[],
    export: ["admin", "gestor"] as AppRole[],
    schedule: ["admin"] as AppRole[],
    configureAlerts: ["admin"] as AppRole[],
    viewAnalytics: ["admin", "gestor"] as AppRole[],
    viewKPIs: ["admin", "gestor"] as AppRole[],
  },
  digitization: {
    view: ["admin", "gestor", "tecnico"] as AppRole[],
    createBatch: ["admin", "gestor", "tecnico"] as AppRole[],
    editBatch: ["admin", "gestor", "tecnico"] as AppRole[],
    deleteBatch: ["admin", "gestor"] as AppRole[],
    processOCR: ["admin", "gestor", "tecnico"] as AppRole[],
    validate: ["admin", "gestor"] as AppRole[],
    qualityReview: ["admin", "gestor"] as AppRole[],
    classify: ["admin", "gestor", "tecnico"] as AppRole[],
    assignOperator: ["admin", "gestor"] as AppRole[],
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
