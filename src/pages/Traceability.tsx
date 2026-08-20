import React, { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeftRight,
  Download,
  FileClock,
  Loader2,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useTraceability,
  type TraceCategory,
  type TraceEvent,
} from "@/hooks/useTraceability";

const CATEGORIES: {
  value: TraceCategory;
  label: string;
  icon: typeof Shuffle;
  className: string;
}[] = [
  { value: "movimentacao", label: "Movimentações", icon: Shuffle, className: "text-primary" },
  { value: "entrada_saida", label: "Entradas / Saídas", icon: ArrowLeftRight, className: "text-success" },
  { value: "devolucao", label: "Devoluções", icon: RotateCcw, className: "text-warning" },
  { value: "metadados", label: "Alterações de Metadados", icon: FileClock, className: "text-muted-foreground" },
];

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const EventRow = ({ event }: { event: TraceEvent }) => {
  const [open, setOpen] = useState(false);
  const meta = CATEGORIES.find((c) => c.value === event.category)!;
  const Icon = meta.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-md bg-muted p-2", meta.className)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{event.title}</span>
            <Badge variant="outline">{meta.label}</Badge>
            {event.reference && <Badge variant="secondary">{event.reference}</Badge>}
            {event.scannedQr && (
              <Badge variant="outline" className="gap-1">
                <QrCode className="h-3 w-3" aria-hidden="true" /> QR
              </Badge>
            )}
          </div>
          <p className="mt-1 break-words text-sm text-muted-foreground">{event.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{event.actorName}</span>
            <span>
              {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
            </span>
            {event.changes && event.changes.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-primary hover:underline"
              >
                {open ? "Ocultar alterações" : `Ver ${event.changes.length} alteração(ões)`}
              </button>
            )}
          </div>

          {open && event.changes && (
            <div className="mt-3 space-y-1 rounded-md border border-border bg-muted/40 p-3 text-xs">
              {event.changes.map((c) => (
                <div key={c.field} className="grid grid-cols-1 gap-1 sm:grid-cols-[160px_1fr]">
                  <span className="font-medium text-foreground">{c.field}</span>
                  <span className="break-words text-muted-foreground">
                    <span className="text-destructive line-through">{formatValue(c.from)}</span>
                    {" → "}
                    <span className="text-success">{formatValue(c.to)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Traceability = () => {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<TraceCategory[]>([]);

  const { data, isLoading, isFetching, refetch } = useTraceability({
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    categories: selected.length ? selected : undefined,
  });

  const events = data || [];

  const counts = useMemo(() => {
    const base: Record<TraceCategory, number> = {
      movimentacao: 0,
      entrada_saida: 0,
      devolucao: 0,
      metadados: 0,
    };
    events.forEach((e) => (base[e.category] += 1));
    return base;
  }, [events]);

  const toggleCategory = (value: TraceCategory) =>
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSelected([]);
  };

  const exportCsv = () => {
    const rows = [
      ["Data", "Categoria", "Acção", "Título", "Descrição", "Referência", "Utilizador"],
      ...events.map((e) => [
        format(new Date(e.createdAt), "yyyy-MM-dd HH:mm"),
        e.category,
        e.action,
        e.title,
        e.description,
        e.reference || "",
        e.actorName || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rastreabilidade-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = [search, dateFrom, dateTo].filter(Boolean).length + selected.length;

  return (
    <DashboardLayout
      title="Auditoria e Rastreabilidade"
      subtitle="Histórico unificado de movimentações, entradas/saídas, devoluções e alterações de metadados"
    >
      <PageBreadcrumb
        items={[{ label: "Registos de Actividade", href: "/audit-logs" }, { label: "Rastreabilidade" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = selected.includes(c.value);
          return (
            <button key={c.value} type="button" onClick={() => toggleCategory(c.value)} className="text-left">
              <Card className={cn("transition-colors", active && "border-primary ring-1 ring-primary")}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-semibold text-foreground">{counts[c.value]}</p>
                  </div>
                  <Icon className={cn("h-6 w-6", c.className)} aria-hidden="true" />
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Filtros</CardTitle>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" aria-hidden="true" /> Limpar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} aria-hidden="true" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!events.length} className="gap-1">
              <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="trace-search">Pesquisa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="trace-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Documento, utilizador, acção..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trace-from">Data inicial</Label>
            <Input id="trace-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trace-to">Data final</Label>
            <Input id="trace-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Cronologia
            {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <Badge variant="secondary">{events.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileClock className="mx-auto mb-3 h-10 w-10 opacity-50" aria-hidden="true" />
              <p>Sem eventos para os filtros seleccionados.</p>
            </div>
          ) : (
            <ScrollArea className="h-[640px] pr-3">
              <div className="space-y-3">
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Traceability;
