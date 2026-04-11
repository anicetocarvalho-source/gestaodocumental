import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useProtocolEntries, useCreateProtocolEntry, useProtocolStats, ProtocolFilters } from "@/hooks/useProtocol";
import { useReportReferenceData } from "@/hooks/useReportsData";
import { Plus, Search, BookOpen, ArrowDownLeft, ArrowUpRight, BarChart3, FileDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";

const deliveryMethods = [
  { value: "correio", label: "Correio" },
  { value: "email", label: "Email" },
  { value: "presencial", label: "Presencial" },
  { value: "fax", label: "Fax" },
  { value: "plataforma", label: "Plataforma Digital" },
  { value: "outro", label: "Outro" },
];

export default function ProtocolBook() {
  const [filters, setFilters] = useState<ProtocolFilters>({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDirection, setNewDirection] = useState<"entrada" | "saida">("entrada");

  const appliedFilters = { ...filters, search: searchTerm || undefined };
  const { data: entries = [], isLoading } = useProtocolEntries(appliedFilters);
  const { data: stats } = useProtocolStats(filters);
  const { units } = useReportReferenceData();
  const createEntry = useCreateProtocolEntry();

  const [form, setForm] = useState({
    subject: "",
    sender_name: "",
    sender_institution: "",
    recipient_name: "",
    recipient_institution: "",
    document_date: "",
    delivery_method: "correio",
    observations: "",
    unit_id: "",
  });

  const handleSubmit = () => {
    if (!form.subject.trim()) {
      toast.error("O assunto é obrigatório");
      return;
    }
    createEntry.mutate(
      {
        direction: newDirection,
        subject: form.subject,
        sender_name: form.sender_name || null,
        sender_institution: form.sender_institution || null,
        recipient_name: form.recipient_name || null,
        recipient_institution: form.recipient_institution || null,
        document_date: form.document_date || null,
        received_at: newDirection === "entrada" ? new Date().toISOString() : null,
        sent_at: newDirection === "saida" ? new Date().toISOString() : null,
        delivery_method: form.delivery_method,
        observations: form.observations || null,
        document_id: null,
        unit_id: form.unit_id || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ subject: "", sender_name: "", sender_institution: "", recipient_name: "", recipient_institution: "", document_date: "", delivery_method: "correio", observations: "", unit_id: "" });
        },
      }
    );
  };

  const handleExportCSV = () => {
    if (entries.length === 0) { toast.info("Sem dados para exportar"); return; }
    const header = "Nº Protocolo;Direcção;Assunto;Remetente;Destinatário;Data Doc.;Meio;Obs.;Data Registo\n";
    const rows = entries.map(e =>
      [e.protocol_number, e.direction === "entrada" ? "Entrada" : "Saída", e.subject, e.sender_name || "", e.recipient_name || "", e.document_date || "", e.delivery_method || "", e.observations || "", format(new Date(e.created_at), "dd/MM/yyyy HH:mm")].join(";")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `protocolo_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  };

  const setQuickPeriod = (period: "month" | "year") => {
    const now = new Date();
    setFilters(f => ({
      ...f,
      dateFrom: period === "month" ? startOfMonth(now) : startOfYear(now),
      dateTo: period === "month" ? endOfMonth(now) : endOfYear(now),
    }));
  };

  return (
    <DashboardLayout title="Livro de Protocolo">
      <div className="space-y-6">
        <PageBreadcrumb items={[{ label: "Livro de Protocolo" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Livro de Protocolo
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Registo de correspondência recebida e expedida</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-1" /> Exportar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Registo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Novo Registo de Protocolo</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Direcção</Label>
                    <Select value={newDirection} onValueChange={(v: "entrada" | "saida") => setNewDirection(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assunto *</Label>
                    <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Assunto da correspondência" />
                  </div>
                  {newDirection === "entrada" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Remetente</Label><Input value={form.sender_name} onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))} /></div>
                      <div><Label>Instituição</Label><Input value={form.sender_institution} onChange={e => setForm(f => ({ ...f, sender_institution: e.target.value }))} /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Destinatário</Label><Input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} /></div>
                      <div><Label>Instituição</Label><Input value={form.recipient_institution} onChange={e => setForm(f => ({ ...f, recipient_institution: e.target.value }))} /></div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data do Documento</Label><Input type="date" value={form.document_date} onChange={e => setForm(f => ({ ...f, document_date: e.target.value }))} /></div>
                    <div>
                      <Label>Meio de Entrega</Label>
                      <Select value={form.delivery_method} onValueChange={v => setForm(f => ({ ...f, delivery_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{deliveryMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar unidade" /></SelectTrigger>
                      <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Observações</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} /></div>
                  <Button onClick={handleSubmit} disabled={createEntry.isPending} className="w-full">
                    {createEntry.isPending ? "A registar..." : "Registar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats?.total ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><ArrowDownLeft className="h-5 w-5 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Entradas</p><p className="text-2xl font-bold">{stats?.totalEntrada ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10"><ArrowUpRight className="h-5 w-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Saídas</p><p className="text-2xl font-bold">{stats?.totalSaida ?? 0}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Nº, assunto, remetente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Direcção</Label>
                <Select value={filters.direction || "all"} onValueChange={v => setFilters(f => ({ ...f, direction: v === "all" ? undefined : v as any }))}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" className="w-[150px]" value={filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : ""} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value ? new Date(e.target.value) : undefined }))} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" className="w-[150px]" value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value ? new Date(e.target.value) : undefined }))} />
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setQuickPeriod("month")}>Mês</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickPeriod("year")}>Ano</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Registos de Protocolo</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">A carregar...</p>
            ) : entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem registos no período seleccionado</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Protocolo</TableHead>
                      <TableHead>Dir.</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Remetente / Destinatário</TableHead>
                      <TableHead>Data Doc.</TableHead>
                      <TableHead>Meio</TableHead>
                      <TableHead>Data Registo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{entry.protocol_number}</TableCell>
                        <TableCell>
                          <Badge variant={entry.direction === "entrada" ? "default" : "secondary"} className="text-xs">
                            {entry.direction === "entrada" ? (
                              <><ArrowDownLeft className="h-3 w-3 mr-1" />Ent</>
                            ) : (
                              <><ArrowUpRight className="h-3 w-3 mr-1" />Saí</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">{entry.subject}</TableCell>
                        <TableCell className="text-sm">
                          {entry.direction === "entrada"
                            ? [entry.sender_name, entry.sender_institution].filter(Boolean).join(" — ") || "—"
                            : [entry.recipient_name, entry.recipient_institution].filter(Boolean).join(" — ") || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{entry.document_date ? format(new Date(entry.document_date), "dd/MM/yyyy") : "—"}</TableCell>
                        <TableCell className="text-sm capitalize">{entry.delivery_method || "—"}</TableCell>
                        <TableCell className="text-sm">{format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
