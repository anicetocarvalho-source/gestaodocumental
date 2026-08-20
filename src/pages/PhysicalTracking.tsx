import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  ScanLine,
  Camera,
  CameraOff,
  Loader2,
  MapPin,
  FileText,
  ArrowRightLeft,
  LogOut,
  LogIn,
  Archive as ArchiveIcon,
  CheckCircle2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  lookupScannedCode,
  movementTypeLabels,
  physicalStatusLabels,
  useCreateLoan,
  useRegisterPhysicalMovement,
  useReturnLoan,
  useStorageLocations,
  type PhysicalMovementType,
  type ScanLookupResult,
} from "@/hooks/usePhysicalArchive";

type Html5QrcodeInstance = {
  start: (
    camera: { facingMode: string },
    config: { fps: number; qrbox: number },
    onSuccess: (text: string) => void,
    onError: (err: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

const quickActions: { type: PhysicalMovementType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "entrada", label: "Entrada", icon: LogIn },
  { type: "saida", label: "Saída (empréstimo)", icon: LogOut },
  { type: "devolucao", label: "Devolução", icon: ArrowRightLeft },
  { type: "transferencia", label: "Transferência", icon: MapPin },
  { type: "arquivo", label: "Arquivo", icon: ArchiveIcon },
];

const PhysicalTracking = () => {
  const [code, setCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState<ScanLookupResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);

  const [action, setAction] = useState<PhysicalMovementType>("entrada");
  const [targetLocation, setTargetLocation] = useState<string>("");
  const [borrower, setBorrower] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [scannedQr, setScannedQr] = useState(false);

  const { data: locations = [] } = useStorageLocations();
  const registerMovement = useRegisterPhysicalMovement();
  const createLoan = useCreateLoan();
  const returnLoan = useReturnLoan();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLookup = async (value: string, fromCamera = false) => {
    if (!value.trim()) return;
    setLooking(true);
    try {
      const res = await lookupScannedCode(value);
      setResult(res);
      setScannedQr(fromCamera);
      setHistory((h) => [value, ...h.filter((x) => x !== value)].slice(0, 8));
      if (res.kind === "none") {
        toast.error("Código não reconhecido");
      } else if (res.kind === "location") {
        setTargetLocation(res.location!.id);
        setAction("transferencia");
      } else {
        setAction(res.activeLoan ? "devolucao" : "entrada");
        setTargetLocation(res.currentLocation?.id ?? "");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na leitura");
    } finally {
      setLooking(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* ignora */
      }
      scannerRef.current = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      setCameraOn(true);
      // aguarda a montagem do contentor
      await new Promise((r) => setTimeout(r, 50));
      const scanner = new Html5Qrcode("qr-reader") as unknown as Html5QrcodeInstance;
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          void stopCamera();
          setCode(text);
          void handleLookup(text, true);
        },
        () => {
          /* ignora falhas de frame */
        },
      );
    } catch {
      setCameraOn(false);
      toast.error("Não foi possível aceder à câmara. Utilize o leitor ou introduza o código.");
    }
  };

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  const resetAfterAction = () => {
    setResult(null);
    setCode("");
    setNotes("");
    setBorrower("");
    setDueDate("");
    setScannedQr(false);
    inputRef.current?.focus();
  };

  const handleSubmitAction = async () => {
    if (result?.kind !== "document" || !result.document) return;
    const documentId = result.document.id;

    try {
      if (action === "saida") {
        if (!dueDate) {
          toast.error("Indique o prazo de devolução");
          return;
        }
        await createLoan.mutateAsync({
          document_id: documentId,
          borrower_name: borrower.trim() || null,
          reason: notes.trim() || null,
          due_date: dueDate,
          scanned_qr: scannedQr,
        });
        toast.success("Saída registada");
      } else if (action === "devolucao" && result.activeLoan) {
        await returnLoan.mutateAsync({
          loan_id: result.activeLoan.id,
          document_id: documentId,
          returned_location_id: targetLocation || null,
          return_notes: notes.trim() || null,
          scanned_qr: scannedQr,
        });
        toast.success("Devolução registada");
      } else {
        if ((action === "transferencia" || action === "arquivo" || action === "entrada") && !targetLocation) {
          toast.error("Seleccione a localização de destino");
          return;
        }
        await registerMovement.mutateAsync({
          document_id: documentId,
          movement_type: action,
          to_location_id: targetLocation || null,
          notes: notes.trim() || null,
          scanned_qr: scannedQr,
        });
        toast.success(`${movementTypeLabels[action]} registada`);
      }
      resetAfterAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registar o movimento");
    }
  };

  const isPending = registerMovement.isPending || createLoan.isPending || returnLoan.isPending;

  return (
    <DashboardLayout
      title="Leitura e Rastreamento"
      subtitle="Leia o QR do documento ou da localização para registar movimentos em série"
    >
      <PageBreadcrumb
        items={[{ label: "Arquivo", href: "/archive" }, { label: "Leitura e Rastreamento" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                Leitura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleLookup(code);
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código QR, código da localização ou nº de entrada"
                  autoComplete="off"
                />
                <Button type="submit" disabled={looking}>
                  {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground">
                Os leitores USB funcionam como teclado — mantenha o cursor neste campo para ler em série.
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => (cameraOn ? void stopCamera() : void startCamera())}
              >
                {cameraOn ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Parar câmara
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Ler com a câmara
                  </>
                )}
              </Button>

              {cameraOn && <div id="qr-reader" className="rounded-lg overflow-hidden border" />}

              {history.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Leituras recentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setCode(h);
                          void handleLookup(h);
                        }}
                        className="text-xs font-mono px-2 py-1 rounded border hover:bg-muted"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!result && (
            <Card>
              <CardContent className="py-16 text-center">
                <ScanLine className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Aguardando leitura</p>
                <p className="text-sm text-muted-foreground">
                  Leia uma etiqueta para ver o estado e registar um movimento.
                </p>
              </CardContent>
            </Card>
          )}

          {result?.kind === "none" && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-warning mb-3" />
                <p className="font-medium">Código não encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Verifique se a etiqueta pertence a este arquivo.
                </p>
              </CardContent>
            </Card>
          )}

          {result?.kind === "location" && result.location && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Localização {result.location.code}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{result.location.name}</p>
                <p className="text-sm text-muted-foreground">{result.location.path}</p>
                <p className="text-sm text-muted-foreground">
                  Leia agora a etiqueta do documento para o colocar nesta localização.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/archive/locations">Ver estrutura do arquivo</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {result?.kind === "document" && result.document && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {result.document.entry_number}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-medium">{result.document.title}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {result.physicalStatus
                        ? physicalStatusLabels[result.physicalStatus]
                        : "Sem localização"}
                    </Badge>
                    {result.currentLocation && (
                      <Badge variant="outline" className="font-mono">
                        {result.currentLocation.code}
                      </Badge>
                    )}
                  </div>
                  {result.currentLocation && (
                    <p className="text-sm text-muted-foreground">{result.currentLocation.path}</p>
                  )}
                  {result.activeLoan && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                      <p className="font-medium">Empréstimo activo</p>
                      <p className="text-muted-foreground">
                        {result.activeLoan.borrower_name ?? "Destinatário interno"} — devolução até{" "}
                        {format(new Date(result.activeLoan.due_date), "dd/MM/yyyy", { locale: pt })}
                      </p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/documents/${result.document.id}`}>Abrir documento</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registar movimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {quickActions.map((qa) => {
                      const Icon = qa.icon;
                      const active = action === qa.type;
                      return (
                        <button
                          key={qa.type}
                          type="button"
                          onClick={() => setAction(qa.type)}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {qa.label}
                        </button>
                      );
                    })}
                  </div>

                  {action !== "saida" && (
                    <div className="space-y-2">
                      <Label>Localização de destino</Label>
                      <Select value={targetLocation} onValueChange={setTargetLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione a localização" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.code} — {l.path ?? l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {action === "saida" && (
                    <>
                      <div className="space-y-2">
                        <Label>Destinatário</Label>
                        <Input
                          value={borrower}
                          onChange={(e) => setBorrower(e.target.value)}
                          placeholder="Nome do requisitante ou unidade"
                          maxLength={150}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prazo de devolução</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="scanned"
                      checked={scannedQr}
                      onCheckedChange={(v) => setScannedQr(!!v)}
                    />
                    <Label htmlFor="scanned" className="text-sm font-normal">
                      Registo efectuado por leitura de QR
                    </Label>
                  </div>

                  <Button className="w-full" onClick={handleSubmitAction} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Registar {movementTypeLabels[action].toLowerCase()}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PhysicalTracking;
