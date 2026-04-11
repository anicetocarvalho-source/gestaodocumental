import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { canAccessRoute, canPerformAction } from "@/lib/permissions";

// ── Mocks ──────────────────────────────────────────────

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

// Mock useUserRole
const mockUseUserRole = vi.fn();
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockUseUserRole(),
  roleLabels: { admin: "Administrador", gestor: "Gestor", tecnico: "Técnico", consulta: "Consulta" },
  roleDescriptions: {},
}));

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// ── Lazy import components after mocks ──────────────────

import ProtectedRoute from "@/components/common/ProtectedRoute";

// ── Helpers ─────────────────────────────────────────────

function setAuthState(opts: { authenticated: boolean; loading?: boolean }) {
  mockUseAuth.mockReturnValue({
    user: opts.authenticated ? { id: "u1" } : null,
    session: opts.authenticated ? { user: { id: "u1" } } : null,
    profile: opts.authenticated ? { full_name: "Test" } : null,
    isLoading: opts.loading ?? false,
    isAuthenticated: opts.authenticated,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  });
}

function setRole(role: string | null, loading = false) {
  mockUseUserRole.mockReturnValue({
    roles: role ? [{ role }] : [],
    primaryRole: role,
    isLoading: loading,
    error: null,
    hasRole: (r: string) => r === role,
    hasAnyRole: (rs: string[]) => rs.includes(role as string),
    hasRoleOrHigher: () => true,
    isAdmin: role === "admin",
    isGestor: role === "gestor",
    isTecnico: role === "tecnico",
    isConsulta: role === "consulta",
  });
}

function renderWithRouter(initialRoute: string, element: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/auth" element={<div data-testid="auth-page">Auth</div>} />
          <Route path="/access-denied" element={<div data-testid="access-denied">Access Denied</div>} />
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ── Tests ───────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProtectedRoute — redirects", () => {
  it("redirects to /auth when not authenticated", () => {
    setAuthState({ authenticated: false });
    setRole(null);

    renderWithRouter("/documents", (
      <ProtectedRoute><div data-testid="content">Documents</div></ProtectedRoute>
    ));

    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("shows loading spinner while checking auth", () => {
    setAuthState({ authenticated: false, loading: true });
    setRole(null);

    renderWithRouter("/documents", (
      <ProtectedRoute><div>Documents</div></ProtectedRoute>
    ));

    expect(screen.getByText("A verificar autenticação...")).toBeInTheDocument();
  });

  it("renders content when authenticated with valid role", () => {
    setAuthState({ authenticated: true });
    setRole("admin");

    renderWithRouter("/documents", (
      <ProtectedRoute><div data-testid="content">Documents</div></ProtectedRoute>
    ));

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("redirects to /access-denied when role lacks permission", () => {
    setAuthState({ authenticated: true });
    setRole("consulta");

    renderWithRouter("/users", (
      <ProtectedRoute><div data-testid="content">Users</div></ProtectedRoute>
    ));

    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("shows loading spinner while checking roles", () => {
    setAuthState({ authenticated: true });
    setRole(null, true);

    renderWithRouter("/documents", (
      <ProtectedRoute><div>Documents</div></ProtectedRoute>
    ));

    expect(screen.getByText("A verificar permissões...")).toBeInTheDocument();
  });
});

describe("canAccessRoute — unit tests", () => {
  it("admin can access all routes", () => {
    expect(canAccessRoute("admin", "/")).toBe(true);
    expect(canAccessRoute("admin", "/users")).toBe(true);
    expect(canAccessRoute("admin", "/settings")).toBe(true);
    expect(canAccessRoute("admin", "/reports")).toBe(true);
  });

  it("consulta cannot access admin routes", () => {
    expect(canAccessRoute("consulta", "/users")).toBe(false);
    expect(canAccessRoute("consulta", "/permissions")).toBe(false);
    expect(canAccessRoute("consulta", "/settings")).toBe(false);
    expect(canAccessRoute("consulta", "/workflow-builder")).toBe(false);
  });

  it("consulta can access read-only routes", () => {
    expect(canAccessRoute("consulta", "/")).toBe(true);
    expect(canAccessRoute("consulta", "/documents")).toBe(true);
    expect(canAccessRoute("consulta", "/processes")).toBe(true);
    expect(canAccessRoute("consulta", "/archive")).toBe(true);
  });

  it("tecnico can access digitization but not reports", () => {
    expect(canAccessRoute("tecnico", "/digitization")).toBe(true);
    expect(canAccessRoute("tecnico", "/ocr-processing")).toBe(true);
    expect(canAccessRoute("tecnico", "/reports")).toBe(false);
  });

  it("returns true for undefined routes (fallback)", () => {
    expect(canAccessRoute("consulta", "/some-unknown-route")).toBe(true);
  });

  it("resolves child routes via parent permissions", () => {
    expect(canAccessRoute("consulta", "/documents/abc-123")).toBe(true);
    expect(canAccessRoute("consulta", "/dispatches/xyz")).toBe(false);
  });

  it("returns false when role is null", () => {
    expect(canAccessRoute(null, "/")).toBe(false);
  });
});

describe("canPerformAction — unit tests", () => {
  it("admin can delete documents", () => {
    expect(canPerformAction("admin", "documents", "delete")).toBe(true);
  });

  it("tecnico cannot delete documents", () => {
    expect(canPerformAction("tecnico", "documents", "delete")).toBe(false);
  });

  it("consulta can only view documents", () => {
    expect(canPerformAction("consulta", "documents", "view")).toBe(true);
    expect(canPerformAction("consulta", "documents", "create")).toBe(false);
    expect(canPerformAction("consulta", "documents", "edit")).toBe(false);
  });

  it("returns false for unknown module", () => {
    expect(canPerformAction("admin", "unknown" as any, "view")).toBe(false);
  });

  it("returns false for unknown action", () => {
    expect(canPerformAction("admin", "documents", "fly")).toBe(false);
  });

  it("returns false when role is null", () => {
    expect(canPerformAction(null, "documents", "view")).toBe(false);
  });
});
