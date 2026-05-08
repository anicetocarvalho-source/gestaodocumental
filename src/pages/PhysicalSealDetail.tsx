import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  Printer,
  Loader2,
  Copy,
  Download,
  Sparkles,
  ArrowRightLeft,
  Archive,
  Undo2,
  ScanLine,
  Plus,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { SealLabel } from "@/components/seals/SealLabel";
import { RegisterMovementModal } from "@/components/seals/RegisterMovementModal";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import {
  cancelSeal,
  getSeal,
  getSealMovements,
  getSignedPdfUrl,
  type MovementType,
  type SealMovement,
} from "@/lib/api/seals";

const MOVEMENT_META: Record<MovementType, { label: string; Icon: typeof Sparkles; tone: string }> = {
  initial: { label: "Emissão inicial", Icon: Sparkles, tone: "text-primary bg-primary/10" },
  handoff: { label: "Transferência", Icon: ArrowRightLeft, tone: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300" },
  archive: { label: "Arquivamento", Icon: Archive, tone: "text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300" },
  return: { label: "Devolução", Icon: Undo2, tone: "text-rose-700 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300" },
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function MovementItem({ m, last }: { m: SealMovement; last: boolean }) {
  const meta = MOVEMENT_META[m.movement_type] || MOVEMENT_META.handoff;
  const Icon = meta.Icon;
  return (
    <div className="relative pl-10 pb-6">
      {!last && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-border" aria-hidden />
      )}
      <div
        className={cn(
          "absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center",
          meta.tone,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{meta.label}</span>
        {m.scanned_qr && (
          <Badge variant="secondary" className="gap-1">
            <ScanLine className="h-3 w-3" /> Por leitura de QR
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
            {initials(m.from_user_name)}
          </span>
          <span className="text-muted-foreground">{m.from_user_name || "—"}</span>
          {m.from_department && (
            <span className="text-xs text-muted-foreground">({m.from_department})</span>
          )}
        </span>
        <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
            {initials(m.to_user_name)}
          </span>
          <span>{m.to_user_name || "—"}</span>
          {m.to_department && (
            <span className="text-xs text-muted-foreground">({m.to_department})</span>
          )}
        </span>
      </div>
      {m.notes && (
        <p className="mt-2 text-sm text-muted-foreground italic border-l-2 border-border pl-3">
          {m.notes}
        </p>
      )}
    </div>
  );
}

export default function PhysicalSealDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: org } = useCurrentOrganization();

  const [movementOpen, setMovementOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [downloading, setDownloading] = useState(false);

  const { data: seal, isLoading } = useQuery({
    queryKey: ["seal", id],
    enabled: !!id,
    queryFn: () => getSeal(id!),
  });

  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ["seal-movements", id],
    enabled: !!id,
    queryFn: () => getSealMovements(id!),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSeal(id!, cancelReason.trim()),
    onSuccess: () => {
      toast.success("Selo cancelado.");
      qc.invalidateQueries({ queryKey: ["seal", id] });
      setCancelOpen(false);
      setCancelReason("");
    },
    onError: (e: any) => toast.error(e?.message || "Não foi possível cancelar o selo."),
  });

  const copyHash = async () => {
    if (!seal?.pdf_hash) return;
    try {
      await navigator.clipboard.writeText(seal.pdf_hash);
      toast.success("Hash copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const downloadPdf = async () => {
    if (!seal?.pdf_storage_path) return;
    setDownloading(true);
    const url = await getSignedPdfUrl(seal.pdf_storage_path, 120);
    setDownloading(false);
    if (url) window.open(url, "_blank");
    else toast.error("Não foi possível obter o ficheiro.");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Detalhe do selo">
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar...
        </div>
      </DashboardLayout>
    );
  }

  if (!seal) {
    return (
      <DashboardLayout title="Selo não encontrado">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10" />
            <p>O selo solicitado não existe ou foi removido.</p>
            <Button asChild variant="outline">
              <Link to="/seals"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar à lista</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const orgName = org?.name ?? "Organização";

  return (
    <DashboardLayout title="Detalhe do selo" subtitle={seal.protocol_number}>
      <PageBreadcrumb
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Selos", href: "/seals" },
          { label: seal.protocol_number },
        ]}
      />

      {/* Cabeçalho */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono">{seal.protocol_type}</Badge>
                {seal.status === "active" ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Activo</Badge>
                ) : (
                  <Badge variant="destructive">Cancelado</Badge>
                )}
              </div>
              <h1
                className="font-bold text-primary"
                style={{ fontFamily: "Georgia, serif", fontSize: "28pt", lineHeight: 1 }}
              >
                {seal.protocol_number}
              </h1>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <div>
                  Criado em {format(new Date(seal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                </div>
                {seal.cancelled_at && (
                  <div className="text-destructive">
                    Cancelado em {format(new Date(seal.cancelled_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    {seal.cancellation_reason && <> · {seal.cancellation_reason}</>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <SealLabel
                protocolNumber={seal.protocol_number}
                protocolType={seal.protocol_type}
                createdAt={seal.created_at}
                pdfHashTruncated={seal.pdf_hash ? seal.pdf_hash.slice(0, 8) : null}
                organizationName={orgName}
                qrPayload={seal.qr_payload}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Impressão será disponibilizada em breve.")}
                >
                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                </Button>
                {seal.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do documento */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Dados do documento</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Título</div>
            <div className="font-medium">{seal.document_title}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Assunto</div>
            <div>{seal.subject}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Remetente</div>
            <div>{seal.sender_name || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Destinatário</div>
            <div>{seal.recipient_name || "—"}</div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
              Hash SHA-256 do PDF
            </div>
            {seal.pdf_hash ? (
              <div className="flex items-start gap-2">
                <code className="flex-1 font-mono text-xs break-all bg-muted rounded px-2 py-1.5">
                  {seal.pdf_hash}
                </code>
                <Button variant="outline" size="icon" onClick={copyHash} title="Copiar">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Sem PDF associado</span>
            )}
          </div>

          {seal.pdf_storage_path && (
            <div className="sm:col-span-2">
              <Button onClick={downloadPdf} disabled={downloading} variant="outline">
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descarregar PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cadeia de custódia */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cadeia de custódia</CardTitle>
          {seal.status === "active" && (
            <Button onClick={() => setMovementOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Registar Movimento
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingMovements ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar movimentos...
            </div>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ainda não há movimentos registados.
            </p>
          ) : (
            <div className="pt-2">
              {movements.map((m, i) => (
                <MovementItem key={m.id} m={m} last={i === movements.length - 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RegisterMovementModal
        sealId={seal.id}
        open={movementOpen}
        onOpenChange={setMovementOpen}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar selo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta operação é irreversível. Indique a razão do cancelamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Razão do cancelamento"
            rows={3}
            maxLength={500}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
