import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface GlobalShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: GlobalShortcut[] = [
    {
      key: "k",
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-tour="global-search"] input, .global-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          navigate("/search");
        }
      },
      description: "Pesquisa global",
    },
    {
      key: "n",
      ctrl: true,
      shift: true,
      action: () => navigate("/documents/new"),
      description: "Novo documento",
    },
    {
      key: "p",
      ctrl: true,
      shift: true,
      action: () => navigate("/processes/new"),
      description: "Novo processo",
    },
    {
      key: "d",
      alt: true,
      action: () => navigate("/"),
      description: "Ir para Dashboard",
    },
    {
      key: "h",
      alt: true,
      action: () => navigate("/documents"),
      description: "Ir para Documentos",
    },
    {
      key: "?",
      shift: true,
      action: () => {
        // Dispatch custom event to show shortcuts modal
        window.dispatchEvent(new CustomEvent("show-shortcuts-modal"));
      },
      description: "Mostrar atalhos",
    },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        // Allow Escape to blur inputs
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // Don't trigger if a dialog is open
      const hasOpenDialog = document.querySelector('[role="dialog"]');
      if (hasOpenDialog && e.key !== "Escape") {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        
        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Keyboard Shortcuts Modal Component
export const keyboardShortcutsList = [
  { category: "Navegação", shortcuts: [
    { keys: ["Ctrl", "K"], description: "Pesquisa global" },
    { keys: ["Alt", "D"], description: "Ir para Dashboard" },
    { keys: ["Alt", "H"], description: "Ir para Documentos" },
    { keys: ["Shift", "?"], description: "Mostrar atalhos" },
  ]},
  { category: "Criação", shortcuts: [
    { keys: ["Ctrl", "Shift", "N"], description: "Novo documento" },
    { keys: ["Ctrl", "Shift", "P"], description: "Novo processo" },
  ]},
  { category: "Geral", shortcuts: [
    { keys: ["Esc"], description: "Fechar modal / limpar foco" },
    { keys: ["←", "→"], description: "Navegar documentos (na revisão)" },
    { keys: ["Enter"], description: "Aprovar (na revisão)" },
  ]},
];
