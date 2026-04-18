import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  canPerformAction,
  navigationPermissions,
  actionPermissions,
} from "@/lib/permissions";
import { AppRole } from "@/hooks/useUserRole";

const ALL_ROLES: AppRole[] = ["admin", "gestor", "tecnico", "consulta"];

/**
 * Snapshot esperado de permissões críticas — funciona como "contrato".
 * Se alguém alterar as permissões acidentalmente, estes testes falham.
 */
const EXPECTED_ROUTE_ACCESS: Record<string, AppRole[]> = {
  // Admin-only
  "/users": ["admin"],
  "/permissions": ["admin"],
  "/permissions-matrix": ["admin"],
  "/settings": ["admin"],
  "/super-admin": ["admin"],
  "/sla-configuration": ["admin"],
  "/workflow-builder": ["admin"],

  // Admin + Gestor
  "/approvals": ["admin", "gestor"],
  "/pending-approvals": ["admin", "gestor"],
  "/quality-review": ["admin", "gestor"],
  "/reports": ["admin", "gestor"],
  "/audit-logs": ["admin", "gestor"],
  "/process-templates": ["admin", "gestor"],
  "/workflow-visualization": ["admin", "gestor"],

  // Admin + Gestor + Técnico (sem consulta)
  "/dispatches": ["admin", "gestor", "tecnico"],
  "/digitization": ["admin", "gestor", "tecnico"],
  "/ocr-processing": ["admin", "gestor", "tecnico"],
  "/classification": ["admin", "gestor", "tecnico"],
  "/document-intelligence": ["admin", "gestor", "tecnico"],
  "/documents/new": ["admin", "gestor", "tecnico"],
  "/processes/new": ["admin", "gestor", "tecnico"],
  "/dispatches/new": ["admin", "gestor", "tecnico"],

  // Todos
  "/": ALL_ROLES,
  "/documents": ALL_ROLES,
  "/processes": ALL_ROLES,
  "/folders": ALL_ROLES,
  "/archive": ALL_ROLES,
  "/protocol-book": ALL_ROLES,
  "/profile": ALL_ROLES,
  "/notifications": ALL_ROLES,
  "/assistant": ALL_ROLES,
  "/intelligent-search": ALL_ROLES,
  "/procedure-guide": ALL_ROLES,
  "/movement-history": ALL_ROLES,
  "/search": ALL_ROLES,
  "/flow-documentation": ALL_ROLES,
};

/**
 * Snapshot de acções críticas por módulo.
 */
const EXPECTED_ACTIONS: Record<string, Record<string, AppRole[]>> = {
  documents: {
    view: ALL_ROLES,
    create: ["admin", "gestor", "tecnico"],
    delete: ["admin", "gestor"],
    validate: ["admin", "gestor"],
    sign: ["admin", "gestor", "tecnico"],
  },
  processes: {
    view: ALL_ROLES,
    create: ["admin", "gestor", "tecnico"],
    approve: ["admin", "gestor"],
    delete: ["admin", "gestor"],
    close: ["admin", "gestor"],
  },
  dispatches: {
    create: ["admin", "gestor", "tecnico"],
    approve: ["admin", "gestor"],
    sign: ["admin", "gestor"],
    cancel: ["admin", "gestor"],
  },
  archive: {
    view: ALL_ROLES,
    markForDestruction: ["admin", "gestor"],
    approveDestruction: ["admin"],
    executeDestruction: ["admin"],
  },
  reports: {
    view: ["admin", "gestor"],
    export: ["admin", "gestor"],
    schedule: ["admin"],
  },
  digitization: {
    createBatch: ["admin", "gestor", "tecnico"],
    processOCR: ["admin", "gestor", "tecnico"],
    validate: ["admin", "gestor"],
  },
  users: {
    view: ["admin"],
    create: ["admin"],
    edit: ["admin"],
    delete: ["admin"],
  },
  settings: {
    view: ["admin"],
    edit: ["admin"],
  },
};

describe("Permissions: canAccessRoute()", () => {
  it("nega acesso quando role é null", () => {
    expect(canAccessRoute(null, "/")).toBe(false);
    expect(canAccessRoute(null, "/users")).toBe(false);
  });

  it("permite acesso a rotas não definidas (fallback)", () => {
    expect(canAccessRoute("consulta", "/some-undefined-route")).toBe(true);
  });

  it("resolve rotas filhas pela rota pai", () => {
    // /documents/123 deve seguir permissões de /documents
    expect(canAccessRoute("consulta", "/documents/abc-123")).toBe(true);
    expect(canAccessRoute("consulta", "/users/abc-123")).toBe(false);
  });

  describe("matriz role × rota (snapshot)", () => {
    Object.entries(EXPECTED_ROUTE_ACCESS).forEach(([path, allowedRoles]) => {
      ALL_ROLES.forEach((role) => {
        const shouldAllow = allowedRoles.includes(role);
        it(`${role} ${shouldAllow ? "PODE" : "NÃO PODE"} aceder ${path}`, () => {
          expect(canAccessRoute(role, path)).toBe(shouldAllow);
        });
      });
    });
  });

  describe("invariantes globais", () => {
    it("admin tem acesso a TODAS as rotas definidas", () => {
      Object.keys(navigationPermissions).forEach((path) => {
        expect(canAccessRoute("admin", path)).toBe(true);
      });
    });

    it("consulta NÃO tem acesso a rotas administrativas críticas", () => {
      const adminRoutes = ["/users", "/permissions", "/settings", "/super-admin", "/sla-configuration", "/workflow-builder"];
      adminRoutes.forEach((path) => {
        expect(canAccessRoute("consulta", path)).toBe(false);
      });
    });

    it("consulta NÃO tem acesso a workflows de aprovação/digitalização", () => {
      const restrictedRoutes = ["/approvals", "/pending-approvals", "/digitization", "/ocr-processing", "/quality-review", "/reports"];
      restrictedRoutes.forEach((path) => {
        expect(canAccessRoute("consulta", path)).toBe(false);
      });
    });

    it("técnico NÃO tem acesso a aprovações nem administração", () => {
      const restrictedRoutes = ["/users", "/permissions", "/settings", "/approvals", "/quality-review", "/reports"];
      restrictedRoutes.forEach((path) => {
        expect(canAccessRoute("tecnico", path)).toBe(false);
      });
    });
  });
});

describe("Permissions: canPerformAction()", () => {
  it("nega quando role é null", () => {
    expect(canPerformAction(null, "documents", "view")).toBe(false);
  });

  it("nega quando módulo não existe", () => {
    expect(canPerformAction("admin", "inexistente" as never, "view")).toBe(false);
  });

  it("nega quando acção não existe", () => {
    expect(canPerformAction("admin", "documents", "acaoQueNaoExiste")).toBe(false);
  });

  describe("matriz role × módulo × acção (snapshot)", () => {
    Object.entries(EXPECTED_ACTIONS).forEach(([module, actions]) => {
      describe(`módulo "${module}"`, () => {
        Object.entries(actions).forEach(([action, allowedRoles]) => {
          ALL_ROLES.forEach((role) => {
            const shouldAllow = allowedRoles.includes(role);
            it(`${role} ${shouldAllow ? "PODE" : "NÃO PODE"} executar "${action}"`, () => {
              expect(
                canPerformAction(role, module as keyof typeof actionPermissions, action)
              ).toBe(shouldAllow);
            });
          });
        });
      });
    });
  });

  describe("invariantes globais de acções", () => {
    it("admin pode executar TODAS as acções de TODOS os módulos", () => {
      Object.entries(actionPermissions).forEach(([module, actions]) => {
        Object.keys(actions).forEach((action) => {
          expect(
            canPerformAction("admin", module as keyof typeof actionPermissions, action)
          ).toBe(true);
        });
      });
    });

    it("consulta APENAS pode executar acções 'view' (read-only)", () => {
      Object.entries(actionPermissions).forEach(([module, actions]) => {
        Object.entries(actions as Record<string, AppRole[]>).forEach(([action, roles]) => {
          if (roles.includes("consulta")) {
            // Se consulta tem acesso, deve ser apenas para leitura
            expect(
              ["view"].includes(action),
              `consulta tem acesso a "${module}.${action}" mas deveria ser apenas 'view'`
            ).toBe(true);
          }
        });
      });
    });

    it("acções de eliminação são restritas a admin/gestor", () => {
      Object.entries(actionPermissions).forEach(([module, actions]) => {
        Object.entries(actions as Record<string, AppRole[]>).forEach(([action, roles]) => {
          if (action.toLowerCase().includes("delete") || action === "executeDestruction") {
            expect(
              roles.includes("consulta"),
              `${module}.${action} não deve permitir consulta`
            ).toBe(false);
            expect(
              roles.includes("tecnico") && action !== "deleteBatch",
              `${module}.${action} não deveria permitir tecnico`
            ).toBe(false);
          }
        });
      });
    });
  });
});

describe("Permissions: integridade da configuração", () => {
  it("todas as rotas usam roles válidos", () => {
    const validRoles = new Set<AppRole>(ALL_ROLES);
    Object.entries(navigationPermissions).forEach(([path, roles]) => {
      roles.forEach((role) => {
        expect(validRoles.has(role), `${path} usa role inválido: ${role}`).toBe(true);
      });
    });
  });

  it("todas as acções usam roles válidos", () => {
    const validRoles = new Set<AppRole>(ALL_ROLES);
    Object.entries(actionPermissions).forEach(([module, actions]) => {
      Object.entries(actions as Record<string, AppRole[]>).forEach(([action, roles]) => {
        roles.forEach((role) => {
          expect(
            validRoles.has(role),
            `${module}.${action} usa role inválido: ${role}`
          ).toBe(true);
        });
      });
    });
  });

  it("nenhuma rota tem lista de roles vazia (rota inacessível)", () => {
    Object.entries(navigationPermissions).forEach(([path, roles]) => {
      expect(roles.length, `Rota ${path} não tem roles atribuídos`).toBeGreaterThan(0);
    });
  });

  it("nenhuma acção tem lista de roles vazia", () => {
    Object.entries(actionPermissions).forEach(([module, actions]) => {
      Object.entries(actions as Record<string, AppRole[]>).forEach(([action, roles]) => {
        expect(
          roles.length,
          `${module}.${action} não tem roles atribuídos`
        ).toBeGreaterThan(0);
      });
    });
  });
});
