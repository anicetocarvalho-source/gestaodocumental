import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2, Search, Download, History, QrCode } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  movementTypeLabels,
  usePhysicalMovements,
  useStorageLocations,
} from "@/hooks/usePhysicalArchive";

const ALL = "__all__";

const PhysicalArchiveHistory = () => {
  const [movementType, setMovementType] = useState(ALL);
  const [locationId, setLocationId] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scannedOnly, setScannedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const { data: locations = [] } = useStorageLocations();
  const { data: movements = [], isLoading } = usePhysicalMovements({
    movementType: movementType === ALL ? undefined : movementType,
    locationId: locationId === ALL ? undefined : locationId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    scannedOnly,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return movements;
    const s = search.toLowerCase();
    return movements.filter(
      (m) =>
        m.document?.entry_number?.toLowerCase().includes(s) ||
        m.document?.title?.toLowerCase().includes(s) ||
        m.from_location?.code?.toLowerCase().includes(s) ||
        m.to_location?.code?.toLowerCase().includes(s),
    );
  }, [movements, search]);

  const exportCsv = () => {
    const rows = [
      ["Data", "Documento", "Título", "Tipo", "Origem", "Destino", "QR", "Notas"],
      ...filtered.map((m) => [
        format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
        m.document?.entry_number ?? "",
        m.document?.title ?? "",
        movementTypeLabels[m.movement_type] ?? m.movement_type,
        m.from_location?.code ?? "",
        m.to_location?.code ?? "",
        m.scanned_qr ? "Sim" : "Não",
        m.notes ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimentos-fisicos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Histórico de Movimentações Físicas"
      subtitle="Entradas, saídas, devoluções e transferências de documentos físicos"
    >
      <PageBreadcrumb
        items={[{ label: "Arquivo", href: "/archive" }, { label: "Movimentações Físicas" }]}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {Object.entries(movementTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Localização</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>De</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Até</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pesquisa</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Documento ou código"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 md:col-span-3">
            <Checkbox
              id="scanned-only"
              checked={scannedOnly}
              onCheckedChange={(v) => setScannedOnly(!!v)}
            />
            <Label htmlFor="scanned-only" className="font-normal text-sm">
              Apenas movimentos registados por leitura de QR
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">
            {filtered.length} movimento{filtered.length === 1 ? "" : "s"}
          </CardTitle>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Sem movimentos</p>
              <p className="text-sm text-muted-foreground">
                Os movimentos aparecem aqui assim que forem registados na leitura de QR.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>QR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </TableCell>
                    <TableCell>
                      {m.document ? (
                        <Link
                          to={`/documents/${m.document.id}`}
                          className="font-medium hover:underline"
                        >
                          {m.document.entry_number}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {m.document?.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {movementTypeLabels[m.movement_type] ?? m.movement_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.from_location?.code ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.to_location?.code ?? "—"}</TableCell>
                    <TableCell>
                      {m.scanned_qr ? (
                        <QrCode className="h-4 w-4 text-primary" aria-label="Lido por QR" />
                      ) : (
                        <span className="text-muted-foreground text-xs">manual</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PhysicalArchiveHistory;
