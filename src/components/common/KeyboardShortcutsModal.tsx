import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { keyboardShortcutsList } from "@/hooks/useGlobalKeyboardShortcuts";

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setOpen(true);
    window.addEventListener("show-shortcuts-modal", handleShowShortcuts);
    return () => window.removeEventListener("show-shortcuts-modal", handleShowShortcuts);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⌨️ Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {keyboardShortcutsList.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category.category}
              </h4>
              <div className="space-y-1.5">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Prima <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px] font-mono">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px] font-mono">?</kbd> para mostrar este painel
        </p>
      </DialogContent>
    </Dialog>
  );
}
