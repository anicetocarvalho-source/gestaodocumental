import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, ArrowDownToLine, ArrowUpFromLine, FileText, ExternalLink, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizationalUnits } from "@/hooks/useReferenceData";
import { useProtocolFlowEntries, PROTOCOL_STAGE_LABELS, ProtocolStage } from "@/hooks/useProtocolFlow";

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  received: "Recebido",
  pending: "Pendente",
  in_progress: "Em Tramitação",
  validated: "Validado",
  dispatched: "Despachado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

const STAGE_VARIANTS: Record<ProtocolStage, "default" | "secondary" | "outline" | "destructive"> = {
  entrada: "secondary",
  tramitacao: "default",
  despacho: "outline",
  arquivado: "secondary",
};

export default function UnitProtocols() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: units } = useOrganizationalUnits({ activeOnly: true });

  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("mine");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");

  const { data: entries, isLoading } = useProtocolFlowEntries(search);

  const myUnitId = profile?.unit_id ?? null;
  const myUnit = useMemo(
    () => units?.find((u) => u.id === myUnitId) ?? null,
    [units, myUnitId]
  );

  // Técnico: fica sempre limitado à sua unidade; Gestor/Admin podem alternar
  const canViewAllUnits = profile?.role === "gestor" || profile?.role === "admin";

  useEffect(() => {
    if (!canViewAllUnits && myUnitId) setUnitFilter("mine");
  }, [canViewAllUnits, myUnitId]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      const effectiveUnit = !canViewAllUnits ? myUnitId : unitFilter === "mine" ? myUnitId : unitFilter;
      if (effectiveUnit && effectiveUnit !== "all" && e.unit_id !== effectiveUnit) return false;
      if (!canViewAllUnits && !myUnitId) return false;
      if (stageFilter !== "all" && e.stage !== stageFilter) return false;
      if (statusFilter !== "all" && (e.document?.status ?? "sem_documento") !== statusFilter) return false;
      if (directionFilter !== "all" && e.direction !== directionFilter) return false;
      return true;
    });
  }, [entries, unitFilter, stageFilter, statusFilter, directionFilter, myUnitId, canViewAllUnits]);

  const stats = useMemo(() => {
    const base = { total: filtered.length, entrada: 0, tramitacao: 0, despacho: 0, arquivado: 0 };
    for (const e of filtered) base[e.stage] += 1;
    return base;
  }, [filtered]);

  const resetFilters = () => {
    setSearch("");
    setUnitFilter("mine");
    setStageFilter("all");
    setStatusFilter("all");
    setDirectionFilter("all");
  };

  const unitLabel = !canViewAllUnits
    ? myUnit?.name ?? "Sem unidade atribuída"
    : unitFilter === "mine"
      ? `A minha unidade (${myUnit?.name ?? "—"})`
      : unitFilter === "all"
        ? "Todas as unidades"
        : units?.find((u) => u.id === unitFilter)?.name ?? "";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protocolos por Unidade</h1>
          <p className="text-muted-foreground">
            Correspondência e documentos que competem a cada unidade orgânica.
          </p>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total</CardDescription></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
          </Card>
          {(["entrada", "tramitacao", "despacho", "arquivado"] as ProtocolStage[]).map((s) => (
            <Card key={s} className="cursor-pointer hover:border-primary/50" onClick={() => setStageFilter(stageFilter === s ? "all" : s)}>
              <CardHeader className="pb-2"><CardDescription>{PROTOCOL_STAGE_LABELS[s]}</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{stats[s]}</p></CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 pt-6">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nº protocolo, assunto, remetente…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="w-[220px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Unidade</label>
              {canViewAllUnits ? (
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">A minha unidade</SelectItem>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {units?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{unitLabel}</span>
                </div>
              )}
            </div>

            <div className="w-[170px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fase</label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fases</SelectItem>
                  {Object.entries(PROTOCOL_STAGE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado do documento</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                  <SelectItem value="sem_documento">Sem documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Direção</label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-1 h-4 w-4" /> Limpar
            </Button>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> {unitLabel}
            </CardTitle>
            <CardDescription>{filtered.length} protocolo(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum protocolo corresponde aos filtros selecionados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Estado do Documento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.protocol_number}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={e.subject}>{e.subject}</TableCell>
                      <TableCell>
                        {e.direction === "entrada" ? (
                          <span className="inline-flex items-center gap-1 text-sm"><ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" /> Entrada</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm"><ArrowUpFromLine className="h-3.5 w-3.5 text-blue-600" /> Saída</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{e.unit?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant={STAGE_VARIANTS[e.stage]}>{PROTOCOL_STAGE_LABELS[e.stage]}</Badge></TableCell>
                      <TableCell>
                        {e.document ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            {DOCUMENT_STATUS_LABELS[e.document.status] ?? e.document.status}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem documento</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(e.received_at ?? e.sent_at ?? e.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell>
                        {e.document_id && (
                          <Button variant="ghost" size="icon" title="Abrir documento" onClick={() => navigate(`/documents/${e.document_id}`)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
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
    </MainLayout>
  );
}
