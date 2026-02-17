import { useEffect, useCallback, useState, useRef } from "react";
import { driver, DriveStep, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";

const TOUR_COMPLETED_KEY = "nodidoc_tour_completed";

export interface TourStep extends DriveStep {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  };
}

// Tour steps for the main dashboard
export const dashboardTourSteps: TourStep[] = [
  {
    popover: {
      title: "🎉 Bem-vindo ao NODIDOC!",
      description: "Vamos fazer um tour rápido pelas principais funcionalidades do sistema de gestão documental. Este tour vai ajudá-lo a familiarizar-se com a interface.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "📋 Menu Principal",
      description: "Aqui encontra todas as secções do sistema: Documentos, Processos, Expediente, Arquivo e muito mais. Use este menu para navegar entre as diferentes áreas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-search']",
    popover: {
      title: "🔍 Pesquisa Rápida",
      description: "Use a barra de pesquisa para encontrar rapidamente documentos, processos ou expedientes. Basta digitar palavras-chave.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour='quick-actions']",
    popover: {
      title: "⚡ Acções Rápidas",
      description: "Acesse rapidamente as funções mais utilizadas: registar documentos, criar processos, emitir despachos e consultar o repositório.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "[data-tour='stats-cards']",
    popover: {
      title: "📊 Indicadores de Desempenho",
      description: "Veja os principais indicadores: total de documentos, documentos pendentes, taxa de conclusão e conformidade com SLA.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='notifications-btn']",
    popover: {
      title: "🔔 Notificações",
      description: "Receba alertas sobre movimentações de documentos, aprovações pendentes, prazos e outras actividades importantes.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='pending-approvals-btn']",
    popover: {
      title: "✅ Aprovações Pendentes",
      description: "Veja rapidamente quantas aprovações estão à sua espera. Clique para aceder à lista completa de itens pendentes.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='help-btn']",
    popover: {
      title: "❓ Central de Ajuda",
      description: "Precisa de ajuda? Clique aqui para aceder à documentação completa do sistema, tutoriais e suporte técnico.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='user-menu']",
    popover: {
      title: "👤 Seu Perfil",
      description: "Aceda às suas configurações pessoais, veja seu perfil e termine sessão quando necessário.",
      side: "left",
      align: "center",
    },
  },
  {
    popover: {
      title: "🚀 Pronto para Começar!",
      description: "O tour terminou! Pode iniciar o tour novamente a qualquer momento através do menu de ajuda. Bom trabalho!",
      side: "bottom",
      align: "center",
    },
  },
];

// Tour steps for documents page
export const documentsTourSteps: TourStep[] = [
  {
    popover: {
      title: "📄 Gestão de Documentos",
      description: "Esta é a área de gestão de documentos. Aqui pode registar, pesquisar, visualizar e gerir todos os documentos do sistema.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='document-filters']",
    popover: {
      title: "🔍 Filtros Avançados",
      description: "Use os filtros para encontrar documentos por tipo, estado, data, unidade orgânica e outros critérios.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='document-table']",
    popover: {
      title: "📋 Lista de Documentos",
      description: "Veja todos os documentos registados. Clique em qualquer documento para ver os detalhes completos.",
      side: "top",
      align: "center",
    },
  },
];

// Tour steps for processes page
export const processesTourSteps: TourStep[] = [
  {
    popover: {
      title: "📁 Gestão de Processos",
      description: "Gerencie processos administrativos completos. Crie, acompanhe e finalize processos de forma organizada.",
      side: "bottom",
      align: "center",
    },
  },
];

export function useGuidedTour() {
  const { isAuthenticated } = useAuth();
  const driverRef = useRef<Driver | null>(null);
  const tourStartedRef = useRef(false);
  const [isTourCompleted, setIsTourCompleted] = useState(() => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
  });

  // Initialize driver instance once
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
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        setIsTourCompleted(true);
      },
    });

    driverRef.current = driverObj;

    return () => {
      driverObj.destroy();
      driverRef.current = null;
    };
  }, []);

  const startTour = useCallback((steps: TourStep[] = dashboardTourSteps) => {
    if (driverRef.current) {
      driverRef.current.setSteps(steps);
      driverRef.current.drive();
    }
  }, []);

  const startDashboardTour = useCallback(() => {
    startTour(dashboardTourSteps);
  }, [startTour]);

  const startDocumentsTour = useCallback(() => {
    startTour(documentsTourSteps);
  }, [startTour]);

  const startProcessesTour = useCallback(() => {
    startTour(processesTourSteps);
  }, [startTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setIsTourCompleted(false);
    tourStartedRef.current = false;
  }, []);

  // Auto-start tour for new users — only once per session
  useEffect(() => {
    if (isAuthenticated && !isTourCompleted && driverRef.current && !tourStartedRef.current) {
      tourStartedRef.current = true;
      const timer = setTimeout(() => {
        if (driverRef.current) {
          driverRef.current.setSteps(dashboardTourSteps);
          driverRef.current.drive();
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isTourCompleted]);

  return {
    startTour,
    startDashboardTour,
    startDocumentsTour,
    startProcessesTour,
    resetTour,
    isTourCompleted,
  };
}
