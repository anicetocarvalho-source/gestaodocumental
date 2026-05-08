/**
 * Memoriza preferências de impressão durante a sessão (sem localStorage).
 * Reset ao recarregar a página — comportamento intencional.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PrintMode } from "@/lib/printing/types";

interface PrintPreferences {
  lastMode: PrintMode;
  lastPrinterName: string | null;
  setLastMode: (m: PrintMode) => void;
  setLastPrinterName: (name: string | null) => void;
}

const Ctx = createContext<PrintPreferences | null>(null);

export function PrintPreferencesProvider({ children }: { children: ReactNode }) {
  const [lastMode, setLastMode] = useState<PrintMode>("agent");
  const [lastPrinterName, setLastPrinterName] = useState<string | null>(null);
  const value = useMemo(
    () => ({ lastMode, lastPrinterName, setLastMode, setLastPrinterName }),
    [lastMode, lastPrinterName],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrintPreferences(): PrintPreferences {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrintPreferences fora do PrintPreferencesProvider");
  return v;
}
