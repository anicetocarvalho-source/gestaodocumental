import { useEffect, useCallback } from "react";

interface KeyboardShortcutsConfig {
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRotate?: () => void;
  onFullscreen?: () => void;
  onCompare?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onNavigatePrev,
  onNavigateNext,
  onApprove,
  onReject,
  onZoomIn,
  onZoomOut,
  onRotate,
  onFullscreen,
  onCompare,
  enabled = true,
}: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't trigger if a dialog is open (except for specific keys)
      const hasOpenDialog = document.querySelector('[role="dialog"]');
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onNavigatePrev?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          onNavigateNext?.();
          break;
        case "Enter":
          if (!hasOpenDialog) {
            e.preventDefault();
            onApprove?.();
          }
          break;
        case "Backspace":
        case "Delete":
          if (!hasOpenDialog) {
            e.preventDefault();
            onReject?.();
          }
          break;
        case "+":
        case "=":
          e.preventDefault();
          onZoomIn?.();
          break;
        case "-":
          e.preventDefault();
          onZoomOut?.();
          break;
        case "r":
        case "R":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onRotate?.();
          }
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onFullscreen?.();
          }
          break;
        case "c":
        case "C":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onCompare?.();
          }
          break;
      }
    },
    [
      onNavigatePrev,
      onNavigateNext,
      onApprove,
      onReject,
      onZoomIn,
      onZoomOut,
      onRotate,
      onFullscreen,
      onCompare,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
};

// Helper component to show keyboard shortcuts guide
export const KeyboardShortcutsHelp = () => {
  const shortcuts = [
    { keys: ["←", "→"], action: "Navegar documentos" },
    { keys: ["Enter"], action: "Aprovar documento" },
    { keys: ["Del"], action: "Rejeitar documento" },
    { keys: ["+", "-"], action: "Zoom" },
    { keys: ["R"], action: "Rodar imagem" },
    { keys: ["F"], action: "Tela cheia" },
    { keys: ["C"], action: "Comparar" },
  ];

  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">Atalhos de Teclado</p>
      <div className="space-y-1.5">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{shortcut.action}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <kbd
                  key={keyIndex}
                  className="px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
