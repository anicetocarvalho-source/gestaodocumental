import { useMemo } from "react";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Warehouse, PackageOpen, AlertTriangle, ScanLine, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  locationTypeLabels,
  movementTypeLabels,
  useDocumentLoans,
  useLocationOccupancy,
  usePhysicalMovements,
  useStorageLocations,
} from "@/hooks/usePhysicalArchive";

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#6366f1", "#ef4444"];

const PhysicalArchiveReports = () => {
  const { data: locations = [], isLoading: loadingLocations } = useStorageLocations();
  const { data: occupancy = {} } = useLocationOccupancy();
  const { data: activeLoans = [] } = useDocumentLoans({ status: "activo" });
  const { data: movements = [] } = usePhysicalMovements({
    dateFrom: subDays(new Date(), 30).toISOString(),
  });

  const today = new Date();

  const overdue = useMemo(
    () => activeLoans.filter((l) => differenceInCalendarDays(new Date(l.due_date), today) < 0),
    [activeLoans, today],
  );

  const totalDocs = useMemo(
    () => Object.values(occupancy).reduce((a, b) => a + b, 0),
    [occupancy],
  );

  const scannedRate = useMemo(() => {
    if (movements.length === 0) return 0;
    return Math.round((movements.filter((m) => m.scanned_qr).length / movements.length) * 100);
  }, [movements]);

  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    movements.forEach((m) => {
      const label = movementTypeLabels[m.movement_type] ?? m.movement_type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [movements]);

  const byDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      counts[format(subDays(today, i), "dd/MM")] = 0;
    }
    movements.forEach((m) => {
      const key = format(new Date(m.created_at), "dd/MM");
      if (key in counts) counts[key] += 1;
    });
    return Object.entries(counts).map(([name, total]) => ({ name, total }));
  }, [movements, today]);

  const containers = useMemo(
    () =>
      locations
        .map((l) => ({
          ...l,
          docs: occupancy[l.id] ?? 0,
          pct: l.capacity ? Math.min(100, Math.round(((occupancy[l.id] ?? 0) / l.capacity) * 100)) : null,
        }))
        .filter((l) => l.docs > 0 || l.capacity)
        .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
        .slice(0, 12),
    [locations, occupancy],
  );

  const exportCsv = () => {
    const rows = [
      ["Código", "Designação", "Tipo", "Caminho", "Documentos", "Capacidade", "Ocupação %"],
      ...locations.map((l) => [
        l.code,
        l.name,
        locationTypeLabels[l.location_type],
        l.path ?? "",
        String(occupancy[l.id] ?? 0),
        l.capacity ? String(l.capacity) : "",
        l.capacity ? String(Math.round(((occupancy[l.id] ?? 0) / l.capacity) * 100)) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocupacao-arquivo-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Relatórios do Arquivo Físico"
      subtitle="Ocupação, movimentações e empréstimos dos últimos 30 dias"
    >
      <PageBreadcrumb
        items={[{ label: "Arquivo", href: "/archive" }, { label: "Relatórios do Arquivo Físico" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Documentos localizados</p>
              <p className="text-2xl font-semibold">{totalDocs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PackageOpen className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Empréstimos activos</p>
              <p className="text-2xl font-semibold">{activeLoans.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Em atraso</p>
              <p className="text-2xl font-semibold">{overdue.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ScanLine className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Movimentos por QR</p>
              <p className="text-2xl font-semibold">{scannedRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimentos por dia (14 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por tipo de movimento</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-20">
                Sem movimentos no período.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Ocupação por localização</CardTitle>
          <Button variant="outline" onClick={exportCsv} disabled={locations.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {loadingLocations ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : containers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Ainda não existem documentos associados a localizações.
            </p>
          ) : (
            <div className="space-y-4">
              {containers.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{c.code}</span>
                      {c.name}
                    </span>
                    <span className="text-muted-foreground shrink-0 ml-3">
                      {c.docs}
                      {c.capacity ? ` / ${c.capacity}` : ""} docs
                    </span>
                  </div>
                  <Progress value={c.pct ?? Math.min(100, c.docs)} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PhysicalArchiveReports;
