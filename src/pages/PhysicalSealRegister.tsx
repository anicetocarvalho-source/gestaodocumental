import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Upload, FileCheck2, Printer, Plus, ShieldCheck, Stamp } from "lucide-react";
import { validateFiles, MAX_FILE_SIZE_MB } from "@/lib/validation-constants";

type ProtocolType = "ENT" | "SAI" | "INT";

interface CreatedSeal {
  id: string;
  protocol_number: string;
  protocol_type: ProtocolType;
  document_title: string;
  subject: string;
  sender_name: string | null;
  recipient_name: string | null;
  validation_token: string;
  qr_payload: string;
  pdf_hash: string | null;
  created_at: string;
}

async function sha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function PhysicalSealRegister() {
  const { profile } = useAuth();
  const [protocolType, setProtocolType] = useState<ProtocolType>("ENT");
  const [documentTitle, setDocumentTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfHash, setPdfHash] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seal, setSeal] = useState<CreatedSeal | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const handleFile = async (f: File | null) => {
    if (!f) {
      setPdfFile(null);
      setPdfHash(null);
      return;
    }
    const valid = validateFiles([f], MAX_FILE_SIZE_MB);
    if (valid.length === 0) return;
    setPdfFile(f);
    setHashing(true);
    try {
      const h = await sha256(f);
      setPdfHash(h);
    } catch {
      toast.error("Falha ao calcular SHA-256");
      setPdfHash(null);
    } finally {
      setHashing(false);
    }
  };

  const resetForm = () => {
    setSeal(null);
    setDocumentTitle("");
    setSubject("");
    setSenderName("");
    setRecipientName("");
    setPdfFile(null);
    setPdfHash(null);
  };

  const handleSubmit = async () => {
    if (!profile?.organization_id) {
      toast.error("Organização não identificada");
      return;
    }
    if (!documentTitle.trim() || !subject.trim()) {
      toast.error("Preencha título e assunto");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Get next protocol number
      const year = new Date().getFullYear();
      const { data: protoNum, error: protoErr } = await supabase.rpc(
        "get_next_protocol_number",
        { org_id: profile.organization_id, ptype: protocolType, yr: year }
      );
      if (protoErr || !protoNum) throw protoErr ?? new Error("Falha no protocolo");

      const validationToken = crypto.randomUUID();
      const qrPayload = `${window.location.origin}/validate-seal/${validationToken}`;

      // 2. Optional PDF upload
      let pdfStoragePath: string | null = null;
      if (pdfFile) {
        const path = `seals/${profile.organization_id}/${protoNum}-${Date.now()}.pdf`;
        const { error: upErr } = await supabase.storage
          .from("documents")
          .upload(path, pdfFile, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;
        pdfStoragePath = path;
      }

      // 3. Insert seal
      const { data: inserted, error: insErr } = await supabase
        .from("physical_seals")
        .insert({
          protocol_number: protoNum as string,
          protocol_type: protocolType,
          document_title: documentTitle.trim(),
          subject: subject.trim(),
          sender_name: senderName.trim() || null,
          recipient_name: recipientName.trim() || null,
          pdf_hash: pdfHash,
          pdf_storage_path: pdfStoragePath,
          validation_token: validationToken,
          qr_payload: qrPayload,
          created_by: profile.user_id,
        })
        .select()
        .maybeSingle();

      if (insErr || !inserted) throw insErr ?? new Error("Falha ao registar selo");

      setSeal(inserted as CreatedSeal);
      toast.success(`Selo ${protoNum} criado`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar selo");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!labelRef.current) return;
    const html = labelRef.current.innerHTML;
    const w = window.open("", "_blank", "width=600,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>Selo ${seal?.protocol_number}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 16px; }
        .label { border: 2px solid #000; padding: 12px; width: 320px; }
        .row { display: flex; gap: 12px; align-items: center; }
        h2 { margin: 0 0 4px; font-size: 16px; }
        .muted { color: #555; font-size: 11px; }
        .mono { font-family: ui-monospace, monospace; font-size: 11px; word-break: break-all; }
      </style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <DashboardLayout
      title="Selo Físico de Rastreabilidade"
      subtitle="Registe documentos físicos e gere etiquetas com QR para validação pública"
    >
      <PageBreadcrumb
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Selo Físico" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" />
              Dados do Documento Físico
            </CardTitle>
            <CardDescription>
              O número de protocolo é gerado automaticamente após registo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de Protocolo *</Label>
                <Select
                  value={protocolType}
                  onValueChange={(v) => setProtocolType(v as ProtocolType)}
                  disabled={submitting || !!seal}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENT">ENT — Entrada</SelectItem>
                    <SelectItem value="SAI">SAI — Saída</SelectItem>
                    <SelectItem value="INT">INT — Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input value={new Date().getFullYear()} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título do Documento *</Label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value.slice(0, 200))}
                placeholder="Ex: Ofício n.º 123/2026"
                disabled={submitting || !!seal}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Textarea
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 2000))}
                placeholder="Descrição breve do conteúdo"
                disabled={submitting || !!seal}
                maxLength={2000}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Remetente</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nome / instituição"
                  disabled={submitting || !!seal}
                />
              </div>
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nome / instituição"
                  disabled={submitting || !!seal}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>PDF do Documento (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  disabled={submitting || !!seal}
                />
                {hashing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {pdfFile && pdfHash && (
                <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2 text-xs">
                  <FileCheck2 className="h-4 w-4 text-success mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{pdfFile.name}</div>
                    <div className="font-mono text-muted-foreground break-all">
                      SHA-256: {pdfHash}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                O hash garante que o PDF apresentado na validação pública é o original. Máx. {MAX_FILE_SIZE_MB}MB.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {!seal ? (
                <Button onClick={handleSubmit} disabled={submitting || hashing} className="flex-1">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A registar...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Registar e Gerar Selo</>
                  )}
                </Button>
              ) : (
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" /> Registar Novo Selo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Label preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Etiqueta de Rastreabilidade
            </CardTitle>
            <CardDescription>
              {seal
                ? "Imprima e cole no documento físico."
                : "A etiqueta será apresentada após registo."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!seal ? (
              <div className="flex h-72 items-center justify-center rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground">
                Aguardando registo...
              </div>
            ) : (
              <div className="space-y-4">
                <div ref={labelRef}>
                  <div className="label rounded-lg border-2 border-foreground p-4 bg-background">
                    <div className="row flex items-start gap-4">
                      <QRCodeCanvas
                        value={seal.qr_payload}
                        size={128}
                        level="M"
                        includeMargin={false}
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold leading-tight">
                          {seal.protocol_number}
                        </h2>
                        <Badge variant="outline" className="mt-1">
                          {seal.protocol_type}
                        </Badge>
                        <p className="muted mt-2 text-[11px] text-muted-foreground line-clamp-2">
                          {seal.document_title}
                        </p>
                        <p className="muted mt-1 text-[10px] text-muted-foreground">
                          {new Date(seal.created_at).toLocaleString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="mono text-[10px] break-all text-muted-foreground">
                      {seal.qr_payload}
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
                  <div><span className="font-medium">Token:</span> <span className="font-mono">{seal.validation_token}</span></div>
                  {seal.pdf_hash && (
                    <div className="break-all">
                      <span className="font-medium">SHA-256:</span>{" "}
                      <span className="font-mono">{seal.pdf_hash}</span>
                    </div>
                  )}
                </div>

                <Button onClick={handlePrint} variant="outline" className="w-full">
                  <Printer className="h-4 w-4 mr-2" /> Imprimir Etiqueta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
