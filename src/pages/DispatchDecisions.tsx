import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import {
  useDispatchDecisions,
  DISPATCH_STATUS_LABELS,
  DecisionRow,
} from "@/hooks/useDispatchDecisions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AlertTriangle, Clock, CheckCircle2, Gavel, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type FilterKey = "todos" | "em_tramite" | "atrasado" | "urgente" | "aprovacao" | "concluido";

const deadlineBadge = (row: DecisionRow) => {
  switch (row.deadlineState) {
    case "atrasado":
      return <Badge variant="destructive">Atrasado {Math.abs(row.daysLeft ?? 0)}d</Badge>;
    case "urgente":
      return <Badge variant="warning">Faltam {row.daysLeft}d</Badge>;
    case "no_prazo":
      return <Badge variant="secondary">Faltam {row.daysLeft}d</Badge>;
    case "concluido":
      return <Badge variant="outline">Encerrado</Badge>;
    default:
      return <span className="text-muted-foreground text-sm">Sem prazo</span>;
  }
};

export default function DispatchDecisions() {
  const { data, isLoading } = useDispatchDecisions();
  const [filter, setFilter] = useState<FilterKey>("em_tramite");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    const byFilter = all.filter((r) => {
      switch (filter) {
        case "em_tramite":
          return r.status === "emitido" || r.status === "em_tramite";
        case "atrasado":
          return r.deadlineState === "atrasado";
        case "urgente":
          return r.deadlineState === "urgente";
        case "aprovacao":
          return r.workflow_status === "em_aprovacao";
        case "concluido":
          return r.status === "concluido";
        default:
          return true;
      }
    });
    const s = search.trim().toLowerCase();
    if (!s) return byFilter;
    return byFilter.filter(
      (r) =>
        r.subject.toLowerCase().includes(s) ||
        r.dispatch_number.toLowerCase().includes(s) ||
        r.protocols.some((p) => p.protocol_number.toLowerCase().includes(s))
    );
  }, [data, filter, search]);

  const cards: { key: FilterKey; label: string; value: number; icon: any; tone: string }[] = [
    { key: "em_tramite", label: "Em trâmite", value: data?.emTramite ?? 0, icon: Gavel, tone: "text-primary" },
    { key: "atrasado", label: "Fora do prazo", value: data?.atrasados ?? 0, icon: AlertTriangle, tone: "text-destructive" },
    { key: "urgente", label: "Prazo a expirar (≤3d)", value: data?.urgentes ?? 0, icon: Clock, tone: "text-warning" },
    { key: "aprovacao", label: "Aguardam aprovação", value: data?.aguardaAprovacao ?? 0, icon: FileText, tone: "text-muted-foreground" },
    { key: "concluido", label: "Concluídos", value: data?.concluidos ?? 0, icon: CheckCircle2, tone: "text-success" },
  ];

  return (
    <DashboardLayout title="Painel de Decisões Internas" subtitle="Despachos em trâmite, prazos e ligação ao protocolo">
      <div className="space-y-6">
        <PageBreadcrumb items={[{ label: "Expedições", href: "/dispatches" }, { label: "Decisões internas" }]} />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {cards.map((c) => (
            <button key={c.key} type="button" onClick={() => setFilter(c.key)} className="text-left">
              <Card className={filter === c.key ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{c.label}</span>
                    <c.icon className={`h-4 w-4 ${c.tone}`} />
                  </div>
                  <p className="text-2xl font-semibold mt-2">{c.value}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despachos por estado</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.byStatus ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos associados por fase do protocolo</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.byProtocolStage ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">
              {rows.length} despacho(s) — {filter === "todos" ? "todos" : cards.find((c) => c.key === filter)?.label}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-56"
                  placeholder="Nº, assunto ou protocolo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setFilter("todos")}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">A carregar…</p>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">Sem despachos nesta vista.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Despacho</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Protocolo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link className="font-medium hover:underline" to={`/dispatches/${r.id}`}>
                          {r.dispatch_number}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "dd/MM/yyyy", { locale: pt })}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{r.subject}</TableCell>
                      <TableCell>{r.origin_unit?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{DISPATCH_STATUS_LABELS[r.status] || r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {deadlineBadge(r)}
                          {r.deadline && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(r.deadline), "dd/MM/yyyy", { locale: pt })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.protocols.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {r.protocols.map((p) => (
                              <Link key={p.id} to="/protocol-flow" className="text-sm hover:underline">
                                {p.protocol_number}
                              </Link>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
