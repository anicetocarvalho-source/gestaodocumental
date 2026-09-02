import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useProtocolFlowEntries,
  useProtocolEntryMovements,
  useProtocolFlowAction,
  PROTOCOL_STAGE_LABELS,
  ProtocolStage,
  ProtocolFlowEntry,
} from "@/hooks/useProtocolFlow";
import { Search, ArrowRight, Inbox, Send, Archive, Gavel, History } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STAGES: ProtocolStage[] = ["entrada", "tramitacao", "despacho", "arquivado"];

const STAGE_ICON: Record<ProtocolStage, any> = {
  entrada: Inbox,
  tramitacao: ArrowRight,
  despacho: Gavel,
  arquivado: Archive,
};

const stageBadge = (stage: ProtocolStage) => {
  const variant =
    stage === "entrada" ? "info" : stage === "tramitacao" ? "warning" : stage === "despacho" ? "primary-soft" : "secondary";
  return <Badge variant={variant as any}>{PROTOCOL_STAGE_LABELS[stage]}</Badge>;
};

function MovementsPanel({ entry }: { entry: ProtocolFlowEntry }) {
  const { data: movements, isLoading } = useProtocolEntryMovements(entry.document_id);

  if (!entry.document_id) {
    return <p className="text-sm text-muted-foreground">Este registo não tem documento associado.</p>;
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">A carregar histórico…</p>;
  if (!movements?.length) return <p className="text-sm text-muted-foreground">Sem movimentos registados.</p>;

  return (
    <ol className="relative border-l border-border pl-4 space-y-4">
      {movements.map((m) => (
        <li key={m.id} className="space-y-1">
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
          <div className="flex items-center gap-2">
            <Badge variant="outline">{m.action_type}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
            </span>
          </div>
          <p className="text-sm">
            {m.from_unit?.name ?? m.from_user?.full_name ?? "—"} → {m.to_unit?.name ?? m.to_user?.full_name ?? "—"}
          </p>
          {(m.notes || m.dispatch_text) && (
            <p className="text-sm text-muted-foreground">{m.dispatch_text || m.notes}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function ProtocolFlow() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProtocolFlowEntry | null>(null);
  const [notes, setNotes] = useState("");
  const { data: entries, isLoading } = useProtocolFlowEntries(search);
  const flowAction = useProtocolFlowAction();

  const grouped = useMemo(() => {
    const map: Record<ProtocolStage, ProtocolFlowEntry[]> = {
      entrada: [],
      tramitacao: [],
      despacho: [],
      arquivado: [],
    };
    (entries ?? []).forEach((e) => map[e.stage].push(e));
    return map;
  }, [entries]);

  const runAction = (action: "receive" | "forward" | "dispatch" | "archive") => {
    if (!selected) return;
    flowAction.mutate(
      { entry: selected, action, notes },
      {
        onSuccess: () => {
          setNotes("");
          setSelected(null);
        },
      }
    );
  };

  const renderTable = (rows: ProtocolFlowEntry[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocolo</TableHead>
          <TableHead>Assunto</TableHead>
          <TableHead>Remetente / Destinatário</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Fase</TableHead>
          <TableHead className="text-right">Histórico</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <div className="font-medium">{e.protocol_number}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(e.received_at || e.sent_at || e.created_at), "dd/MM/yyyy", { locale: pt })}
              </div>
            </TableCell>
            <TableCell className="max-w-xs">
              <div className="truncate">{e.subject}</div>
              {e.document && (
                <Link to={`/documents/${e.document.id}`} className="text-xs text-primary hover:underline">
                  {e.document.entry_number}
                </Link>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {e.direction === "entrada"
                ? e.sender_name || e.sender_institution || "—"
                : e.recipient_name || e.recipient_institution || "—"}
            </TableCell>
            <TableCell className="text-sm">{e.unit?.name ?? "—"}</TableCell>
            <TableCell>{stageBadge(e.stage)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>
                <History className="h-4 w-4 mr-1" /> Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout
      title="Fluxo do Protocolo"
      subtitle="Entrada, tramitação, despacho e arquivo — com histórico completo por registo"
    >
      <div className="space-y-6">
        <PageBreadcrumb items={[{ label: "Livro de Protocolo", href: "/protocol-book" }, { label: "Fluxo" }]} />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => {
            const Icon = STAGE_ICON[stage];
            return (
              <Card key={stage}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{PROTOCOL_STAGE_LABELS[stage]}</span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-semibold mt-2">{grouped[stage].length}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Registos de protocolo</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Nº, assunto ou interveniente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">A carregar…</p>
            ) : (
              <Tabs defaultValue="entrada">
                <TabsList>
                  {STAGES.map((stage) => (
                    <TabsTrigger key={stage} value={stage}>
                      {PROTOCOL_STAGE_LABELS[stage]} ({grouped[stage].length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                {STAGES.map((stage) => (
                  <TabsContent key={stage} value={stage} className="mt-4">
                    {grouped[stage].length === 0 ? (
                      <p className="text-muted-foreground py-8 text-center">Sem registos nesta fase.</p>
                    ) : (
                      renderTable(grouped[stage])
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.protocol_number}</SheetTitle>
                <SheetDescription>{selected.subject}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-6">
                <div className="flex items-center gap-2">
                  {stageBadge(selected.stage)}
                  <Badge variant="outline">
                    {selected.direction === "entrada" ? "Entrada" : "Saída"}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Registar movimento</h3>
                  <Textarea
                    placeholder="Notas / texto de despacho (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" disabled={flowAction.isPending} onClick={() => runAction("receive")}>
                      Receber
                    </Button>
                    <Button size="sm" variant="outline" disabled={flowAction.isPending} onClick={() => runAction("forward")}>
                      Encaminhar
                    </Button>
                    <Button size="sm" variant="outline" disabled={flowAction.isPending} onClick={() => runAction("dispatch")}>
                      Despachar
                    </Button>
                    <Button size="sm" variant="outline" disabled={flowAction.isPending} onClick={() => runAction("archive")}>
                      Arquivar
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Histórico</h3>
                  <MovementsPanel entry={selected} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
