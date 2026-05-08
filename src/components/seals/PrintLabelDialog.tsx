/// <reference types="w3c-web-usb" />
/**
 * Modal de impressão de etiquetas — 3 modos:
 * 1) Agente Local NODIDOC (recomendado, institucional)
 * 2) WebUSB directo (Chrome/Edge, prototipagem)
 * 3) Print do navegador (fallback A4 8-up)
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Printer, RefreshCw, Usb, Globe2, Server, AlertTriangle, CheckCircle2, XCircle, Star, StarOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { Seal } from "@/lib/api/seals";
import type { AgentStatus, PrintMode, PrintOptions } from "@/lib/printing/types";
import { generateZPL } from "@/lib/printing/zpl";
import { checkAgent, printZPL } from "@/lib/printing/local-agent";
import { isWebUSBAvailable, printZPLViaUSB, requestZebraPrinter } from "@/lib/printing/webusb";
import { printViaBrowser } from "@/lib/printing/browser-print";
import { SealLabel } from "@/components/seals/SealLabel";
import { usePrintPreferences } from "@/contexts/PrintPreferencesContext";

export type SealForPrint = Pick<
  Seal,
  "id" | "protocol_number" | "protocol_type" | "created_at" | "pdf_hash" | "qr_payload"
>;

interface Props {
  seal: SealForPrint;
  organizationName: string;
  isDuplicate?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintLabelDialog({ seal, organizationName, isDuplicate = false, isOpen, onClose }: Props) {
  const prefs = usePrintPreferences();
  const [mode, setMode] = useState<PrintMode>(prefs.lastMode);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [agentChecking, setAgentChecking] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(
    prefs.defaultPrinterName ?? prefs.lastPrinterName,
  );
  const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
  const [copies, setCopies] = useState(1);
  const [speed, setSpeed] = useState<2 | 3 | 4 | 6>(4);
  const [density, setDensity] = useState(15);
  const [printing, setPrinting] = useState(false);

  const webusbAvailable = useMemo(() => isWebUSBAvailable(), []);

  // Health check ao abrir
  useEffect(() => {
    if (!isOpen) return;
    runAgentCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function runAgentCheck() {
    setAgentChecking(true);
    const status = await checkAgent();
    setAgentStatus(status);
    if (status.available && status.printers && status.printers.length > 0) {
      const preferred =
        status.printers.find((p) => p.name === prefs.defaultPrinterName) ??
        status.printers.find((p) => p.name === selectedPrinter) ??
        status.printers.find((p) => p.name === prefs.lastPrinterName) ??
        status.printers[0];
      setSelectedPrinter(preferred.name);
    }
    setAgentChecking(false);
  }

  async function handlePickUSB() {
    try {
      const dev = await requestZebraPrinter();
      setUsbDevice(dev);
      toast.success(`Impressora seleccionada: ${dev.productName ?? "USB"}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Selecção cancelada.";
      // Selecção cancelada é silenciosa
      if (!/cancel|canceled|cancelled|no device/i.test(msg)) {
        toast.error(msg);
      }
    }
  }

  async function handlePrint() {
    setPrinting(true);
    const options: PrintOptions = { isDuplicate, copies, speed, density };
    try {
      if (mode === "agent") {
        if (!agentStatus?.available) {
          throw new Error(agentStatus?.error ?? "Agente Local não disponível.");
        }
        const zpl = generateZPL({ seal, organizationName, options });
        await printZPL(zpl, selectedPrinter, copies);
      } else if (mode === "webusb") {
        if (!usbDevice) throw new Error("Seleccione uma impressora USB primeiro.");
        const zpl = generateZPL({ seal, organizationName, options });
        await printZPLViaUSB(usbDevice, zpl, copies);
      } else {
        await printViaBrowser({ seal, organizationName, isDuplicate, copies });
      }

      // Log temporário (será reportado ao backend num próximo prompt)
      console.info("[print]", {
        sealId: seal.id,
        protocol: seal.protocol_number,
        mode,
        copies,
        isDuplicate,
        ts: new Date().toISOString(),
      });

      prefs.setLastMode(mode);
      prefs.setLastPrinterName(selectedPrinter);
      toast.success("Etiqueta enviada para impressão");
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao imprimir.";
      toast.error(msg);
    } finally {
      setPrinting(false);
    }
  }

  const canPrint =
    !printing &&
    ((mode === "agent" && agentStatus?.available && !!selectedPrinter) ||
      (mode === "webusb" && !!usbDevice) ||
      mode === "browser");

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imprimir etiqueta {isDuplicate && "(duplicado)"}</DialogTitle>
          <DialogDescription>
            Pré-visualize a etiqueta e escolha o método de impressão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="flex items-start justify-center bg-muted/40 rounded-md p-6">
            <SealLabel
              protocolNumber={seal.protocol_number}
              protocolType={seal.protocol_type}
              createdAt={seal.created_at}
              pdfHashTruncated={seal.pdf_hash ? seal.pdf_hash.slice(0, 8) : null}
              organizationName={organizationName}
              qrPayload={seal.qr_payload}
              duplicate={isDuplicate}
            />
          </div>

          {/* Controlos */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de impressão</Label>

              <ModeCard
                active={mode === "agent"}
                onClick={() => setMode("agent")}
                icon={<Server className="h-5 w-5" />}
                title="Agente Local NODIDOC"
                badge="Recomendado"
              >
                <AgentIndicator
                  status={agentStatus}
                  checking={agentChecking}
                  onRefresh={runAgentCheck}
                />
                {agentStatus?.available && agentStatus.printers && agentStatus.printers.length > 0 && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Impressoras detectadas ({agentStatus.printers.length})</Label>
                      {prefs.defaultPrinterName && (
                        <button
                          type="button"
                          className="text-[10px] text-muted-foreground hover:text-foreground underline"
                          onClick={() => prefs.setDefaultPrinterName(null)}
                        >
                          Limpar padrão
                        </button>
                      )}
                    </div>
                    <ul className="rounded-md border divide-y bg-background max-h-44 overflow-y-auto">
                      {agentStatus.printers.map((p) => {
                        const isSelected = selectedPrinter === p.name;
                        const isDefault = prefs.defaultPrinterName === p.name;
                        return (
                          <li
                            key={p.name}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/60",
                              isSelected && "bg-primary/5",
                            )}
                            onClick={() => setSelectedPrinter(p.name)}
                          >
                            <input
                              type="radio"
                              name="agent-printer"
                              checked={isSelected}
                              onChange={() => setSelectedPrinter(p.name)}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{p.name}</div>
                              {(p.model || p.status) && (
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {p.model}
                                  {p.model && p.status ? " · " : ""}
                                  {p.status}
                                </div>
                              )}
                            </div>
                            {isDefault && (
                              <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Padrão
                              </span>
                            )}
                            <button
                              type="button"
                              title={isDefault ? "Remover como padrão" : "Definir como padrão"}
                              className="text-muted-foreground hover:text-amber-600 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                prefs.setDefaultPrinterName(isDefault ? null : p.name);
                              }}
                            >
                              {isDefault ? (
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              ) : (
                                <StarOff className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </ModeCard>

              {webusbAvailable && (
                <ModeCard
                  active={mode === "webusb"}
                  onClick={() => setMode("webusb")}
                  icon={<Usb className="h-5 w-5" />}
                  title="Impressora USB directa"
                  badge="Chrome/Edge"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={usbDevice ? "text-green-700" : "text-muted-foreground"}>
                      {usbDevice
                        ? `Conectada: ${usbDevice.productName ?? "Impressora USB"}`
                        : "Não conectada"}
                    </span>
                    <Button size="sm" variant="outline" onClick={handlePickUSB} type="button">
                      Seleccionar impressora
                    </Button>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-xs rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      Modo experimental. Para uso institucional, recomendamos o Agente Local NODIDOC.
                    </span>
                  </div>
                </ModeCard>
              )}

              <ModeCard
                active={mode === "browser"}
                onClick={() => setMode("browser")}
                icon={<Globe2 className="h-5 w-5" />}
                title="Print do navegador"
                badge="Fallback"
              >
                <p className="text-xs text-muted-foreground">
                  Use papel A4 com layout 2×4 de etiquetas auto-adesivas (88,9 × 67,7 mm). Imprime
                  até 8 etiquetas por folha.
                </p>
              </ModeCard>
            </div>

            {/* Opções */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div>
                <Label className="text-xs">Cópias</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  className="h-9"
                />
              </div>
              {mode !== "browser" && (
                <>
                  <div>
                    <Label className="text-xs">Velocidade (ips)</Label>
                    <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v) as 2 | 3 | 4 | 6)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 6].map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            {v} ips
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Densidade</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={density}
                      onChange={(e) => setDensity(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                      className="h-9"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={printing}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={!canPrint}>
            {printing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A enviar...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border p-3 transition-colors",
        active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <div className="font-medium text-sm">{title}</div>
        {badge && (
          <span className="ml-auto text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </button>
  );
}

function AgentIndicator({
  status,
  checking,
  onRefresh,
}: {
  status: AgentStatus | null;
  checking: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        {checking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : status?.available ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-destructive" />
        )}
        <span className="truncate">
          {checking
            ? "A verificar agente..."
            : status?.available
              ? `Agente conectado${status.version ? ` v${status.version}` : ""}${
                  status.printers?.length
                    ? ` · ${status.printers.length} impressora(s)`
                    : " · sem impressoras"
                }`
              : (status?.error ?? "Agente não detectado.")}
        </span>
      </div>
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onRefresh(); }} type="button" className="h-7 px-2">
        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Procurar
      </Button>
    </div>
  );
}
