import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, differenceInCalendarDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  ArrowRightLeft,
  AlertTriangle,
  Download,
  PackageOpen,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDocumentLoans,
  useReturnLoan,
  useStorageLocations,
  type DocumentLoan,
} from "@/hooks/usePhysicalArchive";

const DocumentLoans = () => {
  const [tab, setTab] = useState<"activo" | "devolvido">("activo");
  const [search, setSearch] = useState("");
  const [returning, setReturning] = useState<DocumentLoan | null>(null);
  const [returnLocation, setReturnLocation] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  const { data: loans = [], isLoading } = useDocumentLoans({ status: tab });
  const { data: locations = [] } = useStorageLocations();
  const returnLoan = useReturnLoan();

  const today = new Date();

  const filtered = useMemo(() => {
    if (!search.trim()) return loans;
    const s = search.toLowerCase();
    return loans.filter(
      (l) =>
        l.document?.entry_number?.toLowerCase().includes(s) ||
        l.document?.title?.toLowerCase().includes(s) ||
        (l.borrower_name ?? "").toLowerCase().includes(s),
    );
  }, [loans, search]);

  const overdue = useMemo(
    () =>
      loans.filter(
        (l) => l.status === "activo" && differenceInCalendarDays(new Date(l.due_date), today) < 0,
      ),
    [loans, today],
  );

  const handleReturn = async () => {
    if (!returning) return;
    try {
      await returnLoan.mutateAsync({
        loan_id: returning.id,
        document_id: returning.document_id,
        returned_location_id: returnLocation || returning.origin_location_id,
        return_notes: returnNotes.trim() || null,
      });
      toast.success("Devolução registada");
      setReturning(null);
      setReturnNotes("");
      setReturnLocation("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registar a devolução");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Documento", "Título", "Requisitante", "Saída", "Prazo", "Estado", "Devolvido em"],
      ...filtered.map((l) => [
        l.document?.entry_number ?? "",
        l.document?.title ?? "",
        l.borrower_name ?? "",
        format(new Date(l.loaned_at), "dd/MM/yyyy"),
        format(new Date(l.due_date), "dd/MM/yyyy"),
        l.status,
        l.returned_at ? format(new Date(l.returned_at), "dd/MM/yyyy") : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `emprestimos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Empréstimos de Documentos"
      subtitle="Saídas, prazos de devolução e documentos em atraso"
    >
      <PageBreadcrumb items={[{ label: "Arquivo", href: "/archive" }, { label: "Empréstimos" }]} />

      {overdue.length > 0 && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">
                {overdue.length} documento{overdue.length === 1 ? "" : "s"} em atraso
              </p>
              <p className="text-sm text-muted-foreground">
                Prazo de devolução ultrapassado — contacte os requisitantes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Registos</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar documento ou requisitante"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "activo" | "devolvido")}>
            <TabsList className="mb-4">
              <TabsTrigger value="activo">Activos</TabsTrigger>
              <TabsTrigger value="devolvido">Devolvidos</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Sem registos</p>
                  <p className="text-sm text-muted-foreground">
                    As saídas de documentos são registadas na leitura de QR.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Requisitante</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((loan) => {
                      const days = differenceInCalendarDays(new Date(loan.due_date), today);
                      const isOverdue = loan.status === "activo" && days < 0;
                      return (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <Link
                              to={`/documents/${loan.document_id}`}
                              className="font-medium hover:underline"
                            >
                              {loan.document?.entry_number}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                              {loan.document?.title}
                            </p>
                          </TableCell>
                          <TableCell>{loan.borrower_name ?? "—"}</TableCell>
                          <TableCell>
                            {format(new Date(loan.loaned_at), "dd/MM/yyyy", { locale: pt })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(loan.due_date), "dd/MM/yyyy", { locale: pt })}
                            {loan.status === "activo" && (
                              <p
                                className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                {isOverdue ? `${Math.abs(days)} dia(s) em atraso` : `faltam ${days} dia(s)`}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {loan.status === "devolvido" ? (
                              <Badge variant="secondary">Devolvido</Badge>
                            ) : isOverdue ? (
                              <Badge variant="destructive">Em atraso</Badge>
                            ) : (
                              <Badge>Activo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {loan.status === "activo" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReturning(loan);
                                  setReturnLocation(loan.origin_location_id ?? "");
                                }}
                              >
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Devolver
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar devolução</DialogTitle>
            <DialogDescription>
              {returning?.document?.entry_number} — {returning?.document?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Localização de reposição</Label>
              <Select value={returnLocation} onValueChange={setReturnLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione a localização" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} — {l.path ?? l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {returning?.origin_location && (
                <p className="text-xs text-muted-foreground">
                  Origem: {returning.origin_location.code} — {returning.origin_location.path}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReturn} disabled={returnLoan.isPending}>
              {returnLoan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DocumentLoans;
