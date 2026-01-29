import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type DemoRole = "admin" | "gestor" | "tecnico" | "consulta" | null;

interface DemoUser {
  name: string;
  email: string;
  role: DemoRole;
  department: string;
  avatar?: string;
}

interface DemoAuthContextType {
  isAuthenticated: boolean;
  user: DemoUser | null;
  role: DemoRole;
  login: (role: DemoRole) => void;
  logout: () => void;
  hasPermission: (requiredRoles: DemoRole[]) => boolean;
}

const demoUsers: Record<Exclude<DemoRole, null>, DemoUser> = {
  admin: {
    name: "Administrador do Sistema",
    email: "admin@minagrif.gov.ao",
    role: "admin",
    department: "Tecnologias de Informação",
  },
  gestor: {
    name: "Maria Santos",
    email: "maria.santos@minagrif.gov.ao",
    role: "gestor",
    department: "Gabinete do Ministro",
  },
  tecnico: {
    name: "João Silva",
    email: "joao.silva@minagrif.gov.ao",
    role: "tecnico",
    department: "Secretaria de Educação",
  },
  consulta: {
    name: "Ana Ferreira",
    email: "ana.ferreira@minagrif.gov.ao",
    role: "consulta",
    department: "Arquivo Central",
  },
};

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    // Check for existing demo session
    const savedRole = localStorage.getItem("demo_role") as DemoRole;
    if (savedRole && demoUsers[savedRole]) {
      const demoUser = demoUsers[savedRole];
      setUser(demoUser);
      setIsAuthenticated(true);
      
      // Sync with AuthContext
      auth.setDemoAuthenticated(true);
      auth.setDemoProfile({
        id: `demo-${savedRole}`,
        user_id: `demo-${savedRole}`,
        full_name: demoUser.name,
        email: demoUser.email,
        phone: null,
        position: demoUser.department,
        unit_id: null,
        avatar_url: demoUser.avatar || null,
        is_active: true,
      });
    }
  }, []);

  const login = (role: DemoRole) => {
    if (role && demoUsers[role]) {
      const demoUser = demoUsers[role];
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem("demo_role", role);
      
      // Sync with AuthContext
      auth.setDemoAuthenticated(true);
      auth.setDemoProfile({
        id: `demo-${role}`,
        user_id: `demo-${role}`,
        full_name: demoUser.name,
        email: demoUser.email,
        phone: null,
        position: demoUser.department,
        unit_id: null,
        avatar_url: demoUser.avatar || null,
        is_active: true,
      });
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("demo_role");
    
    // Sync with AuthContext
    auth.setDemoAuthenticated(false);
    auth.setDemoProfile(null);
  };

  const hasPermission = (requiredRoles: DemoRole[]) => {
    if (!user || !user.role) return false;
    return requiredRoles.includes(user.role);
  };

  return (
    <DemoAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        role: user?.role ?? null,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
}

export const roleLabels: Record<Exclude<DemoRole, null>, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  tecnico: "Técnico",
  consulta: "Consulta",
};

export const roleDescriptions: Record<Exclude<DemoRole, null>, string> = {
  admin: "Acesso total ao sistema, gestão de utilizadores e configurações",
  gestor: "Aprovação de processos, gestão de documentos e relatórios",
  tecnico: "Criação e tramitação de documentos e processos",
  consulta: "Visualização de documentos e processos (apenas leitura)",
};

export const rolePermissions: Record<Exclude<DemoRole, null>, string[]> = {
  admin: [
    "Gerir utilizadores e permissões",
    "Configurar sistema e workflows",
    "Acesso a logs de auditoria",
    "Todas as permissões de Gestor",
  ],
  gestor: [
    "Aprovar e rejeitar processos",
    "Gerir documentos do departamento",
    "Acesso a relatórios",
    "Todas as permissões de Técnico",
  ],
  tecnico: [
    "Criar e editar documentos",
    "Tramitar processos",
    "Registar despachos",
    "Consultar arquivo",
  ],
  consulta: [
    "Visualizar documentos",
    "Consultar processos",
    "Pesquisar no sistema",
    "Descarregar documentos",
  ],
};