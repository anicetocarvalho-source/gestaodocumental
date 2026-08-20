import React, { useMemo, useState } from "react";
import { format, differenceInCalendarDays, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  BarChart3,
  Download,
  FileText,
  Loader2,
  MapPin,
  PackageOpen,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  locationTypeLabels,
  movementTypeLabels,
  physicalStatusLabels,
  useDocumentLoans,
  useDocumentLocations,
  useLocationOccupancy,
  usePhysicalMovements,
  useStorageLocations,
} from "@/hooks/usePhysicalArchive";
import { exportReportCsv, exportReportPdf, type ReportExportOptions } from "@/lib/reportExport";
import { SavedFiltersBar } from "@/components/reports/SavedFiltersBar";

const ALL = "__all__";

const ExportButtons = ({
  build,
  disabled,
}: {
  build: () => ReportExportOptions;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" disabled={disabled} onClick={() => exportReportCsv(build())} className="gap-1">
      <Download className="h-4 w-4" aria-hidden="true" /> CSV
    </Button>
    <Button size="sm" disabled={disabled} onClick={() => exportReportPdf(build())} className="gap-1">
      <FileText className="h-4 w-4" aria-hidden="true" /> PDF
    </Button>
  </div>
);

/* ------------------------------ Localização ------------------------------ */

const LocationReport = () => {
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const { data: locations = [] } = useStorageLocations();
  const { data: occupancy = {} } = useLocationOccupancy();
  const { data: rows = [], isLoading, isFetching, refetch } = useDocumentLocations({
    locationId: locationId === ALL ? undefined : locationId,
    search: search || undefined,
  });

  const filtered = useMemo(
    () => rows.filter((r) => status === ALL || r.physical_status === status),
    [rows, status]
  );

  const filterLabels = [
    search && `Pesquisa: ${search}`,
    locationId !== ALL && `Localização: ${locations.find((l) => l.id === locationId)?.code ?? locationId}`,
    status !== ALL && `Estado: ${physicalStatusLabels[status as keyof typeof physicalStatusLabels] ?? status}`,
  ].filter(Boolean) as string[];

  const build = (): ReportExportOptions => ({
    title: "Relatório de Localização Física",
    subtitle: "Documentos e respectiva posição no arquivo",
    filters: filterLabels,
    columns: ["Documento", "Título", "Localização", "Caminho", "Tipo", "Estado", "Colocado em"],
    rows: filtered.map((r) => [
      r.document?.entry_number ?? "—",
      r.document?.title ?? "—",
      r.location?.code ?? "—",
      r.location?.path ?? "—",
      r.location ? locationTypeLabels[r.location.location_type] : "—",
      physicalStatusLabels[r.physical_status] ?? r.physical_status,
      format(new Date(r.placed_at), "dd/MM/yyyy HH:mm"),
    ]),
    fileName: "relatorio-localizacao",
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Filtros de localização</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setLocationId(ALL); setStatus(ALL); }} className="gap-1">
              <X className="h-4 w-4" aria-hidden="true" /> Limpar
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" /> Actualizar
            </Button>
            <ExportButtons build={build} disabled={!filtered.length} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SavedFiltersBar
            reportKey="localizacao"
            current={{ search, locationId, status }}
            onApply={(v) => {
              setSearch(String(v.search ?? ""));
              setLocationId(String(v.locationId ?? ALL));
              setStatus(String(v.status ?? ALL));
            }}
          />
          <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="loc-search">Pesquisa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="loc-search" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nº de entrada, título ou código" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Localização</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={ALL}>Todas as localizações</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.code} · {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado físico</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os estados</SelectItem>
                {Object.entries(physicalStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Documentos localizados <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Sem resultados para os filtros aplicados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Caminho</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Colocado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-medium">{r.document?.entry_number ?? "—"}</span>
                      <p className="max-w-[280px] truncate text-xs text-muted-foreground">{r.document?.title}</p>
                    </TableCell>
                    <TableCell>{r.location?.code ?? "—"}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-muted-foreground">{r.location?.path ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{physicalStatusLabels[r.physical_status] ?? r.physical_status}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(r.placed_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ocupação por contentor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {locations
            .filter((l) => (occupancy[l.id] ?? 0) > 0)
            .slice(0, 12)
            .map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span className="truncate">{l.code} · {l.name}</span>
                <Badge variant="secondary">{occupancy[l.id] ?? 0}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

/* --------------------------- Empréstimos abertos -------------------------- */

const LoansReport = () => {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"todos" | "vencidos" | "a_vencer">("todos");
  const { data: loans = [], isLoading, isFetching, refetch } = useDocumentLoans({ status: "activo" });

  const today = new Date();
  const withDays = useMemo(
    () =>
      loans.map((l) => ({
        ...l,
        days: differenceInCalendarDays(new Date(l.due_date), today),
      })),
    [loans, today]
  );

  const filtered = useMemo(
    () =>
      withDays.filter((l) => {
        if (scope === "vencidos" && l.days >= 0) return false;
        if (scope === "a_vencer" && l.days < 0) return false;
        if (search) {
          const q = search.toLowerCase();
          return [l.document?.entry_number, l.document?.title, l.borrower_name, l.reason]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q));
        }
        return true;
      }),
    [withDays, scope, search]
  );

  const overdue = filtered.filter((l) => l.days < 0).length;

  const build = (): ReportExportOptions => ({
    title: "Relatório de Empréstimos em Aberto",
    subtitle: "Documentos requisitados e ainda não devolvidos",
    filters: [
      search && `Pesquisa: ${search}`,
      scope !== "todos" && `Âmbito: ${scope === "vencidos" ? "Em atraso" : "Dentro do prazo"}`,
    ].filter(Boolean) as string[],
    columns: ["Documento", "Título", "Requisitante", "Motivo", "Localização de origem", "Emprestado em", "Prazo", "Situação"],
    rows: filtered.map((l) => [
      l.document?.entry_number ?? "—",
      l.document?.title ?? "—",
      l.borrower_name ?? "—",
      l.reason ?? "—",
      l.origin_location?.code ?? "—",
      format(new Date(l.loaned_at), "dd/MM/yyyy"),
      format(new Date(l.due_date), "dd/MM/yyyy"),
      l.days < 0 ? `Em atraso (${Math.abs(l.days)} dias)` : `Faltam ${l.days} dias`,
    ]),
    fileName: "relatorio-emprestimos-abertos",
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            Filtros de empréstimos
            {overdue > 0 && <Badge variant="destructive" className="ml-2">{overdue} em atraso</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" /> Actualizar
            </Button>
            <ExportButtons build={build} disabled={!filtered.length} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SavedFiltersBar
            reportKey="emprestimos"
            current={{ search, scope }}
            onApply={(v) => {
              setSearch(String(v.search ?? ""));
              setScope((v.scope as typeof scope) ?? "todos");
            }}
          />
          <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="loan-search">Pesquisa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="loan-search" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Documento, requisitante ou motivo" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Situação do prazo</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os empréstimos activos</SelectItem>
                <SelectItem value="vencidos">Apenas em atraso</SelectItem>
                <SelectItem value="a_vencer">Apenas dentro do prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Empréstimos em aberto <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Não existem empréstimos em aberto para estes filtros.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Requisitante</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Emprestado</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <span className="font-medium">{l.document?.entry_number ?? "—"}</span>
                      <p className="max-w-[260px] truncate text-xs text-muted-foreground">{l.document?.title}</p>
                    </TableCell>
                    <TableCell>{l.borrower_name ?? "—"}</TableCell>
                    <TableCell>{l.origin_location?.code ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(l.loaned_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(l.due_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={l.days < 0 ? "destructive" : "outline"}>
                        {l.days < 0 ? `${Math.abs(l.days)} dias de atraso` : `Faltam ${l.days} dias`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* --------------------------- Histórico por período ------------------------ */

const HistoryReport = () => {
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [movementType, setMovementType] = useState(ALL);
  const [locationId, setLocationId] = useState(ALL);
  const [scannedOnly, setScannedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const { data: locations = [] } = useStorageLocations();
  const { data: movements = [], isLoading, isFetching, refetch } = usePhysicalMovements({
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo || undefined,
    movementType: movementType === ALL ? undefined : movementType,
    locationId: locationId === ALL ? undefined : locationId,
    scannedOnly: scannedOnly || undefined,
  });

  const filtered = useMemo(() => {
    if (!search) return movements;
    const q = search.toLowerCase();
    return movements.filter((m) =>
      [m.document?.entry_number, m.document?.title, m.reason, m.notes]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [movements, search]);

  const build = (): ReportExportOptions => ({
    title: "Histórico de Movimentações por Período",
    subtitle: `Período de ${format(new Date(dateFrom), "dd/MM/yyyy")} a ${format(new Date(dateTo), "dd/MM/yyyy")}`,
    filters: [
      movementType !== ALL && `Tipo: ${movementTypeLabels[movementType as keyof typeof movementTypeLabels] ?? movementType}`,
      locationId !== ALL && `Localização: ${locations.find((l) => l.id === locationId)?.code ?? locationId}`,
      scannedOnly && "Apenas movimentos com QR lido",
      search && `Pesquisa: ${search}`,
    ].filter(Boolean) as string[],
    columns: ["Data", "Documento", "Tipo", "Origem", "Destino", "QR", "Motivo/Notas"],
    rows: filtered.map((m) => [
      format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
      m.document?.entry_number ?? "—",
      movementTypeLabels[m.movement_type] ?? m.movement_type,
      m.from_location?.code ?? "—",
      m.to_location?.code ?? "—",
      m.scanned_qr ? "Sim" : "Não",
      m.reason || m.notes || "—",
    ]),
    fileName: "relatorio-historico-movimentacoes",
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Filtros do período</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" /> Actualizar
            </Button>
            <ExportButtons build={build} disabled={!filtered.length} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SavedFiltersBar
            reportKey="historico"
            current={{ dateFrom, dateTo, movementType, locationId, scannedOnly, search }}
            onApply={(v) => {
              if (v.dateFrom) setDateFrom(String(v.dateFrom));
              if (v.dateTo) setDateTo(String(v.dateTo));
              setMovementType(String(v.movementType ?? ALL));
              setLocationId(String(v.locationId ?? ALL));
              setScannedOnly(Boolean(v.scannedOnly));
              setSearch(String(v.search ?? ""));
            }}
          />
          <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="hist-from">Data inicial</Label>
            <Input id="hist-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hist-to">Data final</Label>
            <Input id="hist-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de movimento</Label>
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os tipos</SelectItem>
                {Object.entries(movementTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Localização envolvida</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={ALL}>Todas as localizações</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.code} · {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hist-search">Pesquisa</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="hist-search" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Documento, motivo ou notas" />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant={scannedOnly ? "default" : "outline"}
              onClick={() => setScannedOnly((v) => !v)}
              className="w-full"
            >
              {scannedOnly ? "A mostrar apenas QR lido" : "Apenas movimentos com QR"}
            </Button>
          </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Movimentações no período <Badge variant="secondary">{filtered.length}</Badge>
            {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Sem movimentações no período seleccionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem → Destino</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <span className="font-medium">{m.document?.entry_number ?? "—"}</span>
                      <p className="max-w-[240px] truncate text-xs text-muted-foreground">{m.document?.title}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{movementTypeLabels[m.movement_type] ?? m.movement_type}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {(m.from_location?.code ?? "—") + " → " + (m.to_location?.code ?? "—")}
                    </TableCell>
                    <TableCell>{m.scanned_qr ? "Sim" : "Não"}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-muted-foreground">{m.reason || m.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AdvancedReports = () => (
  <DashboardLayout
    title="Relatórios Avançados"
    subtitle="Localização, empréstimos em aberto e histórico por período com exportação em PDF e CSV"
  >
    <PageBreadcrumb items={[{ label: "Arquivo", href: "/archive" }, { label: "Relatórios Avançados" }]} />

    <Tabs defaultValue="localizacao" className="mt-2">
      <TabsList>
        <TabsTrigger value="localizacao" className="gap-2">
          <MapPin className="h-4 w-4" aria-hidden="true" /> Localização
        </TabsTrigger>
        <TabsTrigger value="emprestimos" className="gap-2">
          <PackageOpen className="h-4 w-4" aria-hidden="true" /> Empréstimos em aberto
        </TabsTrigger>
        <TabsTrigger value="historico" className="gap-2">
          <BarChart3 className="h-4 w-4" aria-hidden="true" /> Histórico por período
        </TabsTrigger>
      </TabsList>

      <TabsContent value="localizacao" className="mt-4"><LocationReport /></TabsContent>
      <TabsContent value="emprestimos" className="mt-4"><LoansReport /></TabsContent>
      <TabsContent value="historico" className="mt-4"><HistoryReport /></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default AdvancedReports;
