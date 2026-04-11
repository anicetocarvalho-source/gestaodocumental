import { useEffect, useCallback, useState, useRef } from "react";
import { driver, DriveStep, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole, roleLabels } from "@/hooks/useUserRole";

const TOUR_KEY_PREFIX = "nodidoc_tour_completed";
// Legacy key for backwards compat
const TOUR_LEGACY_KEY = "nodidoc_tour_completed";

function tourKey(role: AppRole | null): string {
  return role ? `${TOUR_KEY_PREFIX}_${role}` : TOUR_LEGACY_KEY;
}

export interface TourStep extends DriveStep {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  };
}

// ── Shared steps ──────────────────────────────────────────────

const welcomeStep = (role: AppRole): TourStep => ({
  popover: {
    title: `🎉 Bem-vindo ao NODIDOC como ${roleLabels[role]}!`,
    description: roleWelcomeText[role],
    side: "bottom",
    align: "center",
  },
});

const roleWelcomeText: Record<AppRole, string> = {
  admin:
    "Como Administrador, tem acesso total ao sistema. Vamos mostrar-lhe as funcionalidades de gestão, configuração e monitorização.",
  gestor:
    "Como Gestor, pode aprovar despachos, gerir processos e acompanhar relatórios. Vamos mostrar-lhe as áreas mais relevantes.",
  tecnico:
    "Como Técnico, pode registar documentos, criar processos e digitalizar ficheiros. Vamos guiá-lo pelas ferramentas de trabalho.",
  consulta:
    "Como perfil de Consulta, pode pesquisar e visualizar documentos e processos. Vamos mostrar-lhe como navegar no sistema.",
};

const sidebarStep: TourStep = {
  element: "[data-tour='sidebar']",
  popover: {
    title: "📋 Menu Principal",
    description:
      "Aqui encontra todas as secções do sistema. Use este menu para navegar entre as diferentes áreas.",
    side: "right",
    align: "start",
  },
};

const searchStep: TourStep = {
  element: "[data-tour='sidebar-search']",
  popover: {
    title: "🔍 Pesquisa Rápida",
    description:
      "Use a barra de pesquisa para encontrar rapidamente documentos, processos ou expedientes.",
    side: "right",
    align: "center",
  },
};

const notificationsStep: TourStep = {
  element: "[data-tour='notifications-btn']",
  popover: {
    title: "🔔 Notificações",
    description:
      "Receba alertas sobre movimentações de documentos, aprovações pendentes, prazos e outras actividades.",
    side: "bottom",
    align: "center",
  },
};

const profileStep: TourStep = {
  element: "[data-tour='user-menu']",
  popover: {
    title: "👤 Seu Perfil",
    description:
      "Aceda às suas configurações pessoais, veja o seu perfil e termine sessão quando necessário.",
    side: "left",
    align: "center",
  },
};

const doneStep = (role: AppRole): TourStep => ({
  popover: {
    title: "🚀 Pronto para Começar!",
    description: `O tour de ${roleLabels[role]} terminou! Pode reiniciá-lo a qualquer momento através do menu de ajuda. Bom trabalho!`,
    side: "bottom",
    align: "center",
  },
});

// ── Role-specific steps ───────────────────────────────────────

const quickActionsStep: TourStep = {
  element: "[data-tour='quick-actions']",
  popover: {
    title: "⚡ Acções Rápidas",
    description:
      "Acesse rapidamente as funções mais utilizadas: registar documentos, criar processos e consultar o repositório.",
    side: "top",
    align: "center",
  },
};

const statsStep: TourStep = {
  element: "[data-tour='stats-cards']",
  popover: {
    title: "📊 Indicadores de Desempenho",
    description:
      "Veja os principais indicadores: total de documentos, pendentes, taxa de conclusão e conformidade SLA.",
    side: "bottom",
    align: "center",
  },
};

const approvalsStep: TourStep = {
  element: "[data-tour='pending-approvals-btn']",
  popover: {
    title: "✅ Aprovações Pendentes",
    description:
      "Veja rapidamente quantas aprovações estão à sua espera. Clique para aceder à lista completa.",
    side: "bottom",
    align: "center",
  },
};

const userManagementStep: TourStep = {
  element: "[data-tour='nav-admin']",
  popover: {
    title: "👥 Administração",
    description:
      "Gira utilizadores, permissões, workflows e definições do sistema nesta secção.",
    side: "right",
    align: "center",
  },
};

const documentsNavStep: TourStep = {
  element: "[data-tour='nav-documents']",
  popover: {
    title: "📄 Gestão Documental",
    description:
      "Registe, pesquise e acompanhe documentos, processos, expedições e aprovações.",
    side: "right",
    align: "center",
  },
};

const digitizationNavStep: TourStep = {
  element: "[data-tour='nav-digitization']",
  popover: {
    title: "📷 Digitalização",
    description:
      "Digitalize documentos físicos, processe com OCR e classifique automaticamente.",
    side: "right",
    align: "center",
  },
};

const archiveNavStep: TourStep = {
  element: "[data-tour='nav-archive']",
  popover: {
    title: "🗄️ Arquivo",
    description:
      "Consulte pastas e o arquivo documental com políticas de retenção.",
    side: "right",
    align: "center",
  },
};

const reportsNavStep: TourStep = {
  element: "[data-tour='nav-tools']",
  popover: {
    title: "📈 Ferramentas e Relatórios",
    description:
      "Aceda ao assistente IA, relatórios avançados e documentação dos fluxos.",
    side: "right",
    align: "center",
  },
};

const helpStep: TourStep = {
  element: "[data-tour='help-btn']",
  popover: {
    title: "❓ Central de Ajuda",
    description:
      "Precisa de ajuda? Aceda à documentação, tutoriais e suporte técnico.",
    side: "bottom",
    align: "center",
  },
};

// ── Steps per role ────────────────────────────────────────────

function getStepsForRole(role: AppRole): TourStep[] {
  const base: TourStep[] = [welcomeStep(role), sidebarStep, searchStep];

  switch (role) {
    case "admin":
      return [
        ...base,
        quickActionsStep,
        statsStep,
        documentsNavStep,
        approvalsStep,
        digitizationNavStep,
        archiveNavStep,
        reportsNavStep,
        userManagementStep,
        notificationsStep,
        helpStep,
        profileStep,
        doneStep(role),
      ];
    case "gestor":
      return [
        ...base,
        quickActionsStep,
        statsStep,
        documentsNavStep,
        approvalsStep,
        archiveNavStep,
        reportsNavStep,
        notificationsStep,
        helpStep,
        profileStep,
        doneStep(role),
      ];
    case "tecnico":
      return [
        ...base,
        quickActionsStep,
        documentsNavStep,
        digitizationNavStep,
        archiveNavStep,
        notificationsStep,
        helpStep,
        profileStep,
        doneStep(role),
      ];
    case "consulta":
      return [
        ...base,
        archiveNavStep,
        reportsNavStep,
        notificationsStep,
        helpStep,
        profileStep,
        doneStep(role),
      ];
  }
}

// ── Exported page-level tours (unchanged API) ─────────────────

export const documentsTourSteps: TourStep[] = [
  {
    popover: {
      title: "📄 Gestão de Documentos",
      description:
        "Esta é a área de gestão de documentos. Aqui pode registar, pesquisar, visualizar e gerir todos os documentos.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='document-filters']",
    popover: {
      title: "🔍 Filtros Avançados",
      description:
        "Use os filtros para encontrar documentos por tipo, estado, data e outros critérios.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='document-table']",
    popover: {
      title: "📋 Lista de Documentos",
      description:
        "Veja todos os documentos registados. Clique em qualquer documento para ver os detalhes.",
      side: "top",
      align: "center",
    },
  },
];

export const processesTourSteps: TourStep[] = [
  {
    popover: {
      title: "📁 Gestão de Processos",
      description:
        "Gerencie processos administrativos. Crie, acompanhe e finalize processos de forma organizada.",
      side: "bottom",
      align: "center",
    },
  },
];

// ── Hook ──────────────────────────────────────────────────────

export function useGuidedTour() {
  const { isAuthenticated } = useAuth();
  const { primaryRole } = useUserRole();
  const driverRef = useRef<Driver | null>(null);
  const tourStartedRef = useRef(false);
  const currentRoleRef = useRef<AppRole | null>(null);

  const [isTourCompleted, setIsTourCompleted] = useState(() => {
    return localStorage.getItem(TOUR_LEGACY_KEY) === "true";
  });

  // Re-check completion when role changes
  useEffect(() => {
    if (primaryRole) {
      const completed = localStorage.getItem(tourKey(primaryRole)) === "true";
      setIsTourCompleted(completed);
      if (currentRoleRef.current !== primaryRole) {
        tourStartedRef.current = false;
        currentRoleRef.current = primaryRole;
      }
    }
  }, [primaryRole]);

  // Initialize driver instance
  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayOpacity: 0.2,
      stagePadding: 10,
      stageRadius: 10,
      popoverClass: "nodidoc-tour-popover",
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "Concluir ✓",
      onDestroyed: () => {
        if (primaryRole) {
          localStorage.setItem(tourKey(primaryRole), "true");
        }
        // Also set legacy key
        localStorage.setItem(TOUR_LEGACY_KEY, "true");
        setIsTourCompleted(true);
      },
    });

    driverRef.current = driverObj;

    return () => {
      driverObj.destroy();
      driverRef.current = null;
    };
  }, [primaryRole]);

  const startTour = useCallback((steps: TourStep[]) => {
    if (driverRef.current) {
      driverRef.current.setSteps(steps);
      driverRef.current.drive();
    }
  }, []);

  const startRoleTour = useCallback(
    (role?: AppRole) => {
      const r = role || primaryRole;
      if (r) startTour(getStepsForRole(r));
    },
    [primaryRole, startTour]
  );

  const startDashboardTour = useCallback(() => {
    startRoleTour();
  }, [startRoleTour]);

  const startDocumentsTour = useCallback(() => {
    startTour(documentsTourSteps);
  }, [startTour]);

  const startProcessesTour = useCallback(() => {
    startTour(processesTourSteps);
  }, [startTour]);

  const resetTour = useCallback(() => {
    if (primaryRole) {
      localStorage.removeItem(tourKey(primaryRole));
    }
    localStorage.removeItem(TOUR_LEGACY_KEY);
    setIsTourCompleted(false);
    tourStartedRef.current = false;
  }, [primaryRole]);

  // Auto-start tour for new users — role-aware
  useEffect(() => {
    if (
      isAuthenticated &&
      primaryRole &&
      !isTourCompleted &&
      driverRef.current &&
      !tourStartedRef.current
    ) {
      const key = tourKey(primaryRole);
      if (localStorage.getItem(key) === "true") return;

      tourStartedRef.current = true;
      const timer = setTimeout(() => {
        if (driverRef.current) {
          driverRef.current.setSteps(getStepsForRole(primaryRole));
          driverRef.current.drive();
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, primaryRole, isTourCompleted]);

  return {
    startTour,
    startRoleTour,
    startDashboardTour,
    startDocumentsTour,
    startProcessesTour,
    resetTour,
    isTourCompleted,
  };
}
