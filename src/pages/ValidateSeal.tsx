import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, FileCheck2, FileX2, Upload, Search,
  Send, Archive, Undo2, Stamp, QrCode, ArrowRight, Activity, Clock, Filter, X,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

type MovementType = "initial" | "handoff" | "archive" | "return";

interface LastMovement {
  movement_type: MovementType;
  from_department: string | null;
  to_department: string | null;
  scanned_qr: boolean;
  created_at: string;
}

interface ValidationResult {
  valid: boolean;
  status?: string;
  error?: string;
  seal?: {
    protocol_number: string;
    protocol_type: string;
    document_title: string;
    subject: string;
    sender_name: string | null;
    recipient_name: string | null;
    created_at: string;
    has_pdf_hash: boolean;
    organization_name: string | null;
  };
  movements_count?: number;
  last_movement?: LastMovement | null;
  movements?: LastMovement[];
  pdf_hash_match: boolean | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ValidateSeal() {
  usePageTitle("Validar Selo");
  const { token: tokenParam } = useParams<{ token?: string }>();
  const [token, setToken] = useState(tokenParam ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [hashing, setHashing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = async (overrideToken?: string) => {
    const t = (overrideToken ?? token).trim();
    if (!UUID_RE.test(t)) {
      setResult({ valid: false, error: "Token inválido", pdf_hash_match: null });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let pdf_hash: string | null = null;
      if (pdfFile) {
        setHashing(true);
        pdf_hash = await sha256(pdfFile);
        setHashing(false);
      }
      const { data, error } = await supabase.functions.invoke("validate-seal", {
        body: { token: t, pdf_hash },
      });
      if (error) throw error;
      setResult(data as ValidationResult);
    } catch (e: any) {
      setResult({ valid: false, error: e?.message ?? "Erro de validação", pdf_hash_match: null });
    } finally {
      setLoading(false);
      setHashing(false);
    }
  };

  // Auto-validate when arriving via URL
  useEffect(() => {
    if (tokenParam && UUID_RE.test(tokenParam)) {
      validate(tokenParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam]);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="container max-w-3xl mx-auto py-4 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold leading-tight">Portal de Validação</h1>
            <p className="text-xs text-muted-foreground">Confirme a autenticidade de um documento físico</p>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto py-8 flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inserir Código</CardTitle>
            <CardDescription>
              Insira o token impresso na etiqueta ou escaneie o QR. Opcionalmente, anexe o PDF para verificar integridade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Token de Validação</Label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>PDF Original (opcional)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
              {pdfFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Upload className="h-3 w-3" /> {pdfFile.name}
                </p>
              )}
            </div>
            <Button onClick={() => validate()} disabled={loading || hashing} className="w-full">
              {loading || hashing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A validar...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" /> Validar</>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && <ResultCard result={result} />}

        <p className="text-xs text-center text-muted-foreground">
          Esta consulta é registada para fins de auditoria. Nenhum dado pessoal é exposto.
        </p>
      </main>
    </div>
  );
}

function ResultCard({ result }: { result: ValidationResult }) {
  if (!result.seal) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="py-8 flex flex-col items-center text-center gap-2">
          <ShieldX className="h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Selo não encontrado</h2>
          <p className="text-sm text-muted-foreground">
            {result.error ?? "O token fornecido não corresponde a nenhum registo."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isActive = result.valid;
  const seal = result.seal;
  const StatusIcon = isActive ? ShieldCheck : ShieldAlert;

  return (
    <Card className={isActive ? "border-success/40" : "border-warning/40"}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <StatusIcon className={`h-10 w-10 ${isActive ? "text-success" : "text-warning"}`} />
          <div>
            <CardTitle>
              {isActive ? "Selo Autêntico" : "Selo Cancelado"}
            </CardTitle>
            <CardDescription>
              Documento registado em sistema oficial
              {seal.organization_name ? ` por ${seal.organization_name}` : ""}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Field label="Protocolo" value={<span className="font-mono">{seal.protocol_number}</span>} />
          <Field label="Tipo" value={<Badge variant="outline">{seal.protocol_type}</Badge>} />
          <Field label="Data" value={new Date(seal.created_at).toLocaleString("pt-PT")} />
          <Field label="Estado" value={
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Activo" : "Cancelado"}
            </Badge>
          } />
          <div className="sm:col-span-2"><Field label="Título" value={seal.document_title} /></div>
          <div className="sm:col-span-2"><Field label="Assunto" value={seal.subject} /></div>
          {seal.sender_name && <Field label="Remetente" value={seal.sender_name} />}
          {seal.recipient_name && <Field label="Destinatário" value={seal.recipient_name} />}
        </div>

        <Separator />

        <LastMovementSection
          last={result.last_movement ?? null}
          count={result.movements_count ?? 0}
        />

        <Separator />

        <MovementsHistorySection movements={result.movements ?? []} />

        <Separator />

        <IntegritySection
          hasHash={seal.has_pdf_hash}
          match={result.pdf_hash_match}
        />
      </CardContent>
    </Card>
  );
}

const MOV_META: Record<MovementType, { label: string; icon: typeof Send; color: string }> = {
  initial: { label: "Registo Inicial", icon: Stamp, color: "text-muted-foreground" },
  handoff: { label: "Encaminhamento", icon: Send, color: "text-primary" },
  archive: { label: "Arquivamento", icon: Archive, color: "text-success" },
  return: { label: "Devolução", icon: Undo2, color: "text-warning" },
};

function LastMovementSection({ last, count }: { last: LastMovement | null; count: number }) {
  if (!last) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Sem movimentos registados</p>
          <p className="text-xs text-muted-foreground">
            Este selo ainda não tem encaminhamentos, arquivamentos ou devoluções.
          </p>
        </div>
      </div>
    );
  }

  const meta = MOV_META[last.movement_type] ?? MOV_META.handoff;
  const Icon = meta.icon;

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${meta.color}`} />
          <span className="font-medium text-sm">Último Movimento: {meta.label}</span>
          {last.scanned_qr && (
            <Badge variant="outline" className="gap-1 text-xs">
              <QrCode className="h-3 w-3" /> QR escaneado
            </Badge>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {count} no total
        </Badge>
      </div>
      {(last.from_department || last.to_department) && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>{last.from_department || "—"}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{last.to_department || "—"}</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {new Date(last.created_at).toLocaleString("pt-PT")}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function IntegritySection({ hasHash, match }: { hasHash: boolean; match: boolean | null }) {
  if (!hasHash) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
        <FileX2 className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Sem hash registado</p>
          <p className="text-xs text-muted-foreground">
            Este selo não tem PDF associado para verificação de integridade.
          </p>
        </div>
      </div>
    );
  }
  if (match === null) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
        <FileCheck2 className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium">Anexe o PDF para verificar integridade</p>
          <p className="text-xs text-muted-foreground">
            Este selo tem hash registado. Faça upload do PDF para confirmar que não foi adulterado.
          </p>
        </div>
      </div>
    );
  }
  if (match) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-success/10 border border-success/30 p-3 text-sm">
        <FileCheck2 className="h-5 w-5 text-success mt-0.5" />
        <div>
          <p className="font-medium text-success">PDF íntegro ✓</p>
          <p className="text-xs text-muted-foreground">
            O hash SHA-256 corresponde ao registado. O documento não foi modificado.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm">
      <FileX2 className="h-5 w-5 text-destructive mt-0.5" />
      <div>
        <p className="font-medium text-destructive">PDF NÃO corresponde ✗</p>
        <p className="text-xs text-muted-foreground">
          O ficheiro fornecido difere do original registado. Pode ter sido alterado.
        </p>
      </div>
    </div>
  );
}

function MovementsHistorySection({ movements }: { movements: LastMovement[] }) {
  const [type, setType] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (type !== "all" && m.movement_type !== type) return false;
      if (from && !(m.from_department ?? "").toLowerCase().includes(from.toLowerCase())) return false;
      if (to && !(m.to_department ?? "").toLowerCase().includes(to.toLowerCase())) return false;
      if (dateFrom && new Date(m.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(m.created_at) > end) return false;
      }
      return true;
    });
  }, [movements, type, from, to, dateFrom, dateTo]);

  const hasFilters = type !== "all" || from || to || dateFrom || dateTo;
  const clear = () => {
    setType("all"); setFrom(""); setTo(""); setDateFrom(""); setDateTo("");
  };

  if (movements.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Histórico de Movimentos</span>
        <Badge variant="secondary" className="text-xs ml-auto">
          {filtered.length} de {movements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="initial">Registo Inicial</SelectItem>
            <SelectItem value="handoff">Encaminhamento</SelectItem>
            <SelectItem value="archive">Arquivamento</SelectItem>
            <SelectItem value="return">Devolução</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Origem (departamento)"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 text-xs"
        />
        <Input
          placeholder="Destino (departamento)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 text-xs"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 text-xs"
          aria-label="Data inicial"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 text-xs"
          aria-label="Data final"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-xs">
            <X className="h-3 w-3 mr-1" /> Limpar filtros
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-4">
            Nenhum movimento corresponde aos filtros.
          </p>
        ) : (
          filtered.map((m, i) => {
            const meta = MOV_META[m.movement_type] ?? MOV_META.handoff;
            const Icon = meta.icon;
            return (
              <div key={i} className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    <span className="font-medium">{meta.label}</span>
                    {m.scanned_qr && (
                      <Badge variant="outline" className="gap-1 text-[10px] py-0 h-4">
                        <QrCode className="h-2.5 w-2.5" /> QR
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(m.created_at).toLocaleString("pt-PT")}
                  </span>
                </div>
                {(m.from_department || m.to_department) && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span>{m.from_department || "—"}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{m.to_department || "—"}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
