import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  Plus,
  Stamp,
  Loader2,
  Search,
  CalendarIcon,
  Eye,
  Printer,
  Ban,
  FileCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import {
  cancelSeal,
  listSeals,
  type ListSealsFilters,
  type ProtocolFilter,
  type Seal,
} from "@/lib/api/seals";

const PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function typeBadge(type: string) {
  if (type === "ENT")
    return "bg-primary/10 text-primary border-primary/20";
  if (type === "SAI")
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
  return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
}

export default function PhysicalSealsList() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();

  const type = (params.get("type") as ProtocolFilter) || "ALL";
  const page = Math.max(1, Number(params.get("page") || "1"));
  const sortBy = (params.get("sortBy") as ListSealsFilters["sortBy"]) || "created_at";
  const sortDir = (params.get("sortDir") as "asc" | "desc") || "desc";
  const fromStr = params.get("from");
  const toStr = params.get("to");
  const searchInit = params.get("q") || "";

  const [searchInput, setSearchInput] = useState(searchInit);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.set("page", "1");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fromDate = fromStr ? new Date(fromStr) : undefined;
  const toDate = toStr ? new Date(toStr) : undefined;

  const queryKey = useMemo(
    () => ["seals", { type, page, sortBy, sortDir, from: fromStr, to: toStr, q: debouncedSearch }],
    [type, page, sortBy, sortDir, fromStr, toStr, debouncedSearch],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      listSeals({
        type,
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDir,
        from: fromStr || undefined,
        to: toStr ? new Date(new Date(toStr).setHours(23, 59, 59, 999)).toISOString() : undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.set("page", "1");
    setParams(next, { replace: true });
  };

  const toggleSort = (col: NonNullable<ListSealsFilters["sortBy"]>) => {
    if (sortBy === col) {
      setParam("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      setParam("sortBy", col);
      setParam("sortDir", "asc");
    }
  };

  const [cancelTarget, setCancelTarget] = useState<Seal | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSeal(id, reason),
    onSuccess: () => {
      toast.success("Selo cancelado.");
      qc.invalidateQueries({ queryKey: ["seals"] });
      setCancelTarget(null);
      setCancelReason("");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Não foi possível cancelar o selo.");
    },
  });

  const total = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardLayout
      title="Selos de Rastreabilidade"
      subtitle="Selos físicos emitidos pela organização"
    >
      <PageBreadcrumb
        items={[{ label: "Documentos", href: "/documents" }, { label: "Selos" }]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div />
        <Button asChild>
          <Link to="/seals/new">
            <Plus className="h-4 w-4 mr-2" /> Novo Selo
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={type} onValueChange={(v) => setParam("type", v === "ALL" ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              <SelectItem value="ENT">Entrada</SelectItem>
              <SelectItem value="SAI">Saída</SelectItem>
              <SelectItem value="INT">Interno</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start font-normal", !fromDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "dd/MM/yyyy", { locale: pt }) : "Data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => setParam("from", d ? d.toISOString() : null)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start font-normal", !toDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, "dd/MM/yyyy", { locale: pt }) : "Data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={(d) => setParam("to", d ? d.toISOString() : null)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pesquisar protocolo ou título..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Stamp className="h-10 w-10 opacity-50" />
              <p>Nenhum selo encontrado.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("protocol_number")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Protocolo <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Remetente / Destinatário</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("created_at")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Data <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">PDF</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Estado <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => {
                    const title = s.document_title.length > 50
                      ? s.document_title.slice(0, 50) + "…"
                      : s.document_title;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("font-mono", typeBadge(s.protocol_type))}>
                              {s.protocol_type}
                            </Badge>
                            <span className="font-mono text-xs">{s.protocol_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px]">{title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.sender_name || "—"} <span className="opacity-60">/</span> {s.recipient_name || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.pdf_hash ? (
                            <FileCheck className="h-4 w-4 text-emerald-600 inline" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.status === "active" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600">Activo</Badge>
                          ) : (
                            <Badge variant="destructive">Cancelado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button asChild variant="ghost" size="icon" title="Ver detalhe">
                              <Link to={`/seals/${s.id}`}><Eye className="h-4 w-4" /></Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="Imprimir etiqueta">
                              <Link to={`/seals/${s.id}?print=1`}><Printer className="h-4 w-4" /></Link>
                            </Button>
                            {s.status === "active" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Cancelar"
                                onClick={() => setCancelTarget(s)}
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-3 border-t">
                <div className="text-xs text-muted-foreground">
                  {total} {total === 1 ? "selo" : "selos"} · página {page} de {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setParam("page", String(page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setParam("page", String(page + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar selo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta operação é irreversível. Indique a razão do cancelamento do selo{" "}
              <span className="font-mono">{cancelTarget?.protocol_number}</span>.
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
              onClick={() =>
                cancelTarget &&
                cancelMutation.mutate({ id: cancelTarget.id, reason: cancelReason.trim() })
              }
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
