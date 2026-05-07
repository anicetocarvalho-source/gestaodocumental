import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowRight, Archive, Undo2, Send, QrCode, Loader2, Plus, Clock, Stamp,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePhysicalSeal, useSealMovements, useCreateSealMovement, MovementType,
} from "@/hooks/usePhysicalSeals";

const MOVEMENT_META: Record<MovementType, { label: string; icon: typeof Send; color: string }> = {
  initial: { label: "Registo Inicial", icon: Stamp, color: "text-muted-foreground" },
  handoff: { label: "Encaminhamento", icon: Send, color: "text-primary" },
  archive: { label: "Arquivamento", icon: Archive, color: "text-success" },
  return: { label: "Devolução", icon: Undo2, color: "text-warning" },
};

export default function PhysicalSealDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: seal, isLoading } = usePhysicalSeal(id);
  const { data: movements = [], isLoading: loadingMov } = useSealMovements(id);
  const createMov = useCreateSealMovement();

  const [movType, setMovType] = useState<MovementType>("handoff");
  const [fromDept, setFromDept] = useState("");
  const [toDept, setToDept] = useState("");
  const [notes, setNotes] = useState("");
  const [scannedQr, setScannedQr] = useState(false);

  const handleAdd = async () => {
    if (!id) return;
    if (movType === "handoff" && !toDept.trim()) {
      toast.error("Indique o destino");
      return;
    }
    try {
      await createMov.mutateAsync({
        seal_id: id,
        movement_type: movType,
        from_department: fromDept.trim() || null,
        to_department: toDept.trim() || null,
        notes: notes.trim() || null,
        scanned_qr: scannedQr,
      });
      toast.success("Movimento registado");
      setFromDept(""); setToDept(""); setNotes(""); setScannedQr(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registar movimento");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Selo Físico">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar...
        </div>
      </DashboardLayout>
    );
  }

  if (!seal) {
    return (
      <DashboardLayout title="Selo não encontrado">
        <p className="text-muted-foreground">O selo solicitado não existe ou foi removido.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/physical-seals">Voltar à lista</Link>
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={seal.protocol_number} subtitle={seal.document_title}>
      <PageBreadcrumb
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Selos Físicos", href: "/physical-seals" },
          { label: seal.protocol_number },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seal info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" /> Informação do Selo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">Tipo:</span> <Badge variant="outline">{seal.protocol_type}</Badge></div>
            <div><span className="text-muted-foreground">Estado:</span>{" "}
              <Badge variant={seal.status === "active" ? "default" : "secondary"}>
                {seal.status === "active" ? "Activo" : "Cancelado"}
              </Badge>
            </div>
            <div><span className="text-muted-foreground">Remetente:</span> {seal.sender_name ?? "—"}</div>
            <div><span className="text-muted-foreground">Destinatário:</span> {seal.recipient_name ?? "—"}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Assunto:</span> {seal.subject}</div>
            {seal.pdf_hash && (
              <div className="sm:col-span-2 break-all">
                <span className="text-muted-foreground">SHA-256:</span>{" "}
                <span className="font-mono text-xs">{seal.pdf_hash}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Etiqueta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <QRCodeCanvas value={seal.qr_payload} size={140} level="M" />
            <p className="text-xs font-mono text-muted-foreground break-all text-center">
              {seal.validation_token}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        {/* Add movement */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-primary" /> Registar Movimento
            </CardTitle>
            <CardDescription>Documente entregas, arquivamentos ou devoluções.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={movType} onValueChange={(v) => setMovType(v as MovementType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="handoff">Encaminhamento</SelectItem>
                  <SelectItem value="archive">Arquivamento</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>De (Unidade/Pessoa)</Label>
              <Input value={fromDept} onChange={(e) => setFromDept(e.target.value)} placeholder="Origem" />
            </div>
            <div className="space-y-2">
              <Label>Para (Unidade/Pessoa) {movType === "handoff" && "*"}</Label>
              <Input value={toDept} onChange={(e) => setToDept(e.target.value)} placeholder="Destino" />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={scannedQr} onCheckedChange={(c) => setScannedQr(!!c)} />
              <span className="flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> QR foi escaneado
              </span>
            </label>
            <Button onClick={handleAdd} disabled={createMov.isPending} className="w-full">
              {createMov.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A guardar...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Adicionar Movimento</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Movimentos</CardTitle>
            <CardDescription>{movements.length} registo(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMov ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sem movimentos registados.
              </p>
            ) : (
              <ol className="relative border-l border-border ml-3 space-y-5">
                {movements.map((m) => {
                  const meta = MOVEMENT_META[m.movement_type] ?? MOVEMENT_META.handoff;
                  const Icon = meta.icon;
                  return (
                    <li key={m.id} className="ml-6">
                      <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border">
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{meta.label}</span>
                        {m.scanned_qr && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <QrCode className="h-3 w-3" /> QR escaneado
                          </Badge>
                        )}
                      </div>
                      {(m.from_department || m.to_department) && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{m.from_department || "—"}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{m.to_department || "—"}</span>
                        </div>
                      )}
                      {m.notes && <p className="text-sm mt-1">{m.notes}</p>}
                      <Separator className="my-2" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(m.created_at).toLocaleString("pt-PT")}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
