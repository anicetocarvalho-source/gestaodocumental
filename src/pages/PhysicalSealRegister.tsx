import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  UploadCloud,
  X,
  FileText,
  Loader2,
  Stamp,
  Printer,
  Eye,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SealLabel } from "@/components/seals/SealLabel";
import { PrintLabelDialog, type SealForPrint } from "@/components/seals/PrintLabelDialog";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { createSeal, type CreateSealResponse, type ProtocolType } from "@/lib/api/seals";

const TYPE_OPTIONS: Array<{
  value: ProtocolType;
  label: string;
  icon: typeof ArrowDownToLine;
  hint: string;
}> = [
  { value: "ENT", label: "Entrada", icon: ArrowDownToLine, hint: "Recebido pela organização" },
  { value: "SAI", label: "Saída", icon: ArrowUpFromLine, hint: "Enviado para o exterior" },
  { value: "INT", label: "Interno", icon: Repeat, hint: "Circulação interna" },
];

const MAX_PDF = 25 * 1024 * 1024;
const PROTOCOL_PLACEHOLDER = "XXX-2026-00000";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PhysicalSealRegister() {
  const navigate = useNavigate();
  const { data: org } = useCurrentOrganization();

  const [type, setType] = useState<ProtocolType>("ENT");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState<CreateSealResponse | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printDuplicate, setPrintDuplicate] = useState(false);

  const sealForPrint: SealForPrint | null = success
    ? {
        id: success.id ?? "",
        protocol_number: success.protocol_number,
        protocol_type: type,
        created_at: success.created_at,
        pdf_hash: success.pdf_hash,
        qr_payload: success.qr_payload,
      }
    : null;

  const orgName = org?.name ?? "Organização";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Indique o título do documento.";
    if (title.length > 200) next.title = "Máximo 200 caracteres.";
    if (!subject.trim()) next.subject = "Indique o assunto.";
    if (subject.length > 500) next.subject = "Máximo 500 caracteres.";
    if (type === "ENT" && !sender.trim()) next.sender = "O remetente é obrigatório para entradas.";
    if (type === "SAI" && !recipient.trim()) next.recipient = "O destinatário é obrigatório para saídas.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setPdfFile = (file: File | null) => {
    setPdfError(null);
    if (!file) {
      setPdf(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("Apenas ficheiros PDF são aceites.");
      return;
    }
    if (file.size > MAX_PDF) {
      setPdfError("O ficheiro excede o limite de 25 MB.");
      return;
    }
    setPdf(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("protocol_type", type);
      fd.append("document_title", title.trim());
      fd.append("subject", subject.trim());
      if (sender.trim()) fd.append("sender_name", sender.trim());
      if (recipient.trim()) fd.append("recipient_name", recipient.trim());
      if (pdf) fd.append("pdf_file", pdf);
      return createSeal(fd);
    },
    onSuccess: (res) => {
      toast.success(`Selo ${res.protocol_number} registado com sucesso.`);
      setSuccess(res);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Não foi possível registar o selo. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const reset = () => {
    setType("ENT");
    setTitle("");
    setSubject("");
    setSender("");
    setRecipient("");
    setPdf(null);
    setPdfError(null);
    setErrors({});
    setSuccess(null);
  };

  const previewProtocol = useMemo(
    () => `${type}-${new Date().getFullYear()}-XXXXX`,
    [type],
  );

  if (success) {
    return (
      <DashboardLayout title="Selo registado" subtitle="Etiqueta gerada com sucesso">
        <PageBreadcrumb
          items={[
            { label: "Documentos", href: "/documents" },
            { label: "Selos", href: "/seals" },
            { label: "Novo" },
          ]}
        />
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stamp className="h-5 w-5 text-primary" /> Selo emitido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Protocolo:</span>{" "}
                  <span className="font-mono font-semibold">{success.protocol_number}</span>
                </div>
                <div className="break-all">
                  <span className="text-muted-foreground">Token de validação:</span>{" "}
                  <span className="font-mono">{success.validation_token}</span>
                </div>
                {success.pdf_hash && (
                  <div className="break-all">
                    <span className="text-muted-foreground">Hash PDF (SHA-256):</span>{" "}
                    <span className="font-mono text-xs">{success.pdf_hash}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => { setPrintDuplicate(false); setPrintOpen(true); }}
                  variant="default"
                >
                  <Printer className="h-4 w-4 mr-2" /> Imprimir Etiqueta
                </Button>
                <Button
                  onClick={() => { setPrintDuplicate(true); setPrintOpen(true); }}
                  variant="outline"
                >
                  <Printer className="h-4 w-4 mr-2" /> Imprimir Duplicado
                </Button>
                <Button onClick={reset} variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Registar Outro
                </Button>
                {success.id && (
                  <Button asChild variant="outline">
                    <Link to={`/seals/${success.id}`}>
                      <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                    </Link>
                  </Button>
                )}
                {!success.id && (
                  <Button asChild variant="outline">
                    <Link to="/seals">
                      <Eye className="h-4 w-4 mr-2" /> Voltar à lista
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <SealLabel
                protocolNumber={success.protocol_number}
                protocolType={type}
                createdAt={success.created_at}
                pdfHashTruncated={success.pdf_hash ? success.pdf_hash.slice(0, 8) : null}
                organizationName={orgName}
                qrPayload={success.qr_payload}
              />
              <SealLabel
                duplicate
                protocolNumber={success.protocol_number}
                protocolType={type}
                createdAt={success.created_at}
                pdfHashTruncated={success.pdf_hash ? success.pdf_hash.slice(0, 8) : null}
                organizationName={orgName}
                qrPayload={success.qr_payload}
              />
            </CardContent>
          </Card>
        </div>
        {sealForPrint && (
          <PrintLabelDialog
            seal={sealForPrint}
            organizationName={orgName}
            isDuplicate={printDuplicate}
            isOpen={printOpen}
            onClose={() => setPrintOpen(false)}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Novo Selo" subtitle="Registar selo físico de rastreabilidade">
      <PageBreadcrumb
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Selos", href: "/seals" },
          { label: "Novo" },
        ]}
      />

      <form
        onSubmit={handleSubmit}
        className="grid lg:grid-cols-[1fr_minmax(360px,420px)] gap-6"
      >
        <div className="space-y-5">
          {/* Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de protocolo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = type === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={cn(
                        "rounded-lg border p-4 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 mb-2",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.hint}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dados */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título do documento</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className={errors.title ? "border-destructive" : ""}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {errors.title ? <span className="text-destructive">{errors.title}</span> : <span />}
                  <span>{title.length}/200</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Assunto</Label>
                <Textarea
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className={errors.subject ? "border-destructive" : ""}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {errors.subject ? <span className="text-destructive">{errors.subject}</span> : <span />}
                  <span>{subject.length}/500</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sender">
                    Remetente {type === "ENT" && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="sender"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    maxLength={200}
                    className={errors.sender ? "border-destructive" : ""}
                  />
                  {errors.sender && (
                    <p className="text-xs text-destructive">{errors.sender}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipient">
                    Destinatário {type === "SAI" && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    maxLength={200}
                    className={errors.recipient ? "border-destructive" : ""}
                  />
                  {errors.recipient && (
                    <p className="text-xs text-destructive">{errors.recipient}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDF */}
          <Card>
            <CardHeader>
              <CardTitle>PDF original (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              {pdf ? (
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{pdf.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBytes(pdf.size)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">SHA-256 será calculado</Badge>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPdfFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    setPdfFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 cursor-pointer text-center transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    Arraste o PDF para esta zona ou{" "}
                    <span className="text-primary font-medium">clique para escolher</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF · até 25 MB</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              {pdfError && <p className="text-xs text-destructive mt-2">{pdfError}</p>}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={mutation.isPending}
              size="lg"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registar e Gerar Etiqueta
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4 self-start">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização da etiqueta</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <SealLabel
                protocolNumber={previewProtocol}
                protocolType={type}
                createdAt={new Date()}
                pdfHashTruncated={null}
                organizationName={orgName}
                qrPayload=""
              />
              <p className="text-xs text-muted-foreground text-center">
                O QR e o número de protocolo são gerados ao registar.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </DashboardLayout>
  );
}
