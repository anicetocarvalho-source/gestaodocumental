/**
 * Memoriza preferências de impressão durante a sessão (sem localStorage).
 * Reset ao recarregar a página — comportamento intencional.
 *
 * `defaultPrinterName` é a impressora marcada como padrão para etiquetas.
 * `lastPrinterName` é a última usada (pode diferir do padrão se o utilizador
 *  trocou pontualmente).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PrintMode } from "@/lib/printing/types";

interface PrintPreferences {
  lastMode: PrintMode;
  lastPrinterName: string | null;
  defaultPrinterName: string | null;
  setLastMode: (m: PrintMode) => void;
  setLastPrinterName: (name: string | null) => void;
  setDefaultPrinterName: (name: string | null) => void;
}

const Ctx = createContext<PrintPreferences | null>(null);

export function PrintPreferencesProvider({ children }: { children: ReactNode }) {
  const [lastMode, setLastMode] = useState<PrintMode>("agent");
  const [lastPrinterName, setLastPrinterName] = useState<string | null>(null);
  const [defaultPrinterName, setDefaultPrinterName] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      lastMode,
      lastPrinterName,
      defaultPrinterName,
      setLastMode,
      setLastPrinterName,
      setDefaultPrinterName,
    }),
    [lastMode, lastPrinterName, defaultPrinterName],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrintPreferences(): PrintPreferences {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrintPreferences fora do PrintPreferencesProvider");
  return v;
}
