import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, FileCheck2, FileX2, Upload, Search,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

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

        <IntegritySection
          hasHash={seal.has_pdf_hash}
          match={result.pdf_hash_match}
        />
      </CardContent>
    </Card>
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
