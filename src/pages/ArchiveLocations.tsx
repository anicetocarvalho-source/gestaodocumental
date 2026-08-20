import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import {
  Plus,
  Warehouse,
  DoorOpen,
  Rows3,
  Layers,
  Box,
  ChevronRight,
  ChevronDown,
  Printer,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  buildLocationTree,
  locationTypeLabels,
  locationTypeOrder,
  useCreateStorageLocation,
  useDeleteStorageLocation,
  useLocationOccupancy,
  useStorageLocations,
  useUpdateStorageLocation,
  type LocationType,
  type StorageLocation,
  type StorageLocationNode,
} from "@/hooks/usePhysicalArchive";
import { generateLocationLabelPdf } from "@/lib/locationLabelPdf";
import { usePermissions } from "@/hooks/usePermissions";

const typeIcons: Record<LocationType, React.ComponentType<{ className?: string }>> = {
  deposito: Warehouse,
  sala: DoorOpen,
  estante: Rows3,
  prateleira: Layers,
  caixa: Box,
};

const ArchiveLocations = () => {
  const { data: locations = [], isLoading } = useStorageLocations({ activeOnly: false });
  const { data: occupancy = {} } = useLocationOccupancy();
  const createLocation = useCreateStorageLocation();
  const updateLocation = useUpdateStorageLocation();
  const deleteLocation = useDeleteStorageLocation();
  const { canEdit, isManagerOrAbove } = usePermissions();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [parentFor, setParentFor] = useState<StorageLocation | null>(null);
  const [editing, setEditing] = useState<StorageLocation | null>(null);
  const [toDelete, setToDelete] = useState<StorageLocation | null>(null);
  const [printing, setPrinting] = useState<StorageLocation | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    location_type: "deposito" as LocationType,
    capacity: "",
    notes: "",
  });

  const tree = useMemo(() => buildLocationTree(locations), [locations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const s = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.code.toLowerCase().includes(s) ||
        l.name.toLowerCase().includes(s) ||
        (l.path ?? "").toLowerCase().includes(s),
    );
  }, [locations, search]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    locations.forEach((l) => {
      byType[l.location_type] = (byType[l.location_type] || 0) + 1;
    });
    const totalDocs = Object.values(occupancy).reduce((a, b) => a + b, 0);
    return { byType, totalDocs, total: locations.length };
  }, [locations, occupancy]);

  const openCreate = (parent: StorageLocation | null) => {
    setParentFor(parent);
    const nextType = parent
      ? locationTypeOrder[Math.min(locationTypeOrder.indexOf(parent.location_type) + 1, 4)]
      : "deposito";
    setForm({ name: "", location_type: nextType, capacity: "", notes: "" });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Indique a designação da localização");
      return;
    }
    try {
      await createLocation.mutateAsync({
        name: form.name.trim(),
        location_type: form.location_type,
        parent_id: parentFor?.id ?? null,
        capacity: form.capacity ? Number(form.capacity) : null,
        notes: form.notes.trim() || null,
      });
      toast.success("Localização criada");
      setCreateOpen(false);
      if (parentFor) setExpanded((e) => ({ ...e, [parentFor.id]: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a localização");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateLocation.mutateAsync({
        id: editing.id,
        name: form.name.trim(),
        capacity: form.capacity ? Number(form.capacity) : null,
        notes: form.notes.trim() || null,
      });
      toast.success("Localização actualizada");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível actualizar");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteLocation.mutateAsync(toDelete.id);
      toast.success("Localização removida");
    } catch {
      toast.error("Não é possível remover: existem sub-localizações ou documentos associados");
    } finally {
      setToDelete(null);
    }
  };

  const handlePrint = (loc: StorageLocation) => {
    setPrinting(loc);
    setTimeout(() => {
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) {
        toast.error("Não foi possível gerar o QR");
        return;
      }
      generateLocationLabelPdf(loc, canvas as HTMLCanvasElement);
      toast.success("Etiqueta gerada");
    }, 150);
  };

  const renderNode = (node: StorageLocationNode, depth = 0) => {
    const Icon = typeIcons[node.location_type];
    const isOpen = expanded[node.id];
    const docCount = occupancy[node.id] ?? 0;
    const pct = node.capacity ? Math.min(100, Math.round((docCount / node.capacity) * 100)) : null;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors",
            !node.is_active && "opacity-50",
          )}
          style={{ paddingLeft: depth * 20 + 8 }}
        >
          <button
            type="button"
            onClick={() => setExpanded((e) => ({ ...e, [node.id]: !isOpen }))}
            className="h-5 w-5 flex items-center justify-center text-muted-foreground shrink-0"
            aria-label={isOpen ? "Recolher" : "Expandir"}
          >
            {node.children.length > 0 ? (
              isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : null}
          </button>

          <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">{node.code}</span>
              <span className="font-medium truncate">{node.name}</span>
              <Badge variant="outline" className="text-xs">
                {locationTypeLabels[node.location_type]}
              </Badge>
              {docCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {docCount} doc{docCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            {pct !== null && (
              <div className="flex items-center gap-2 mt-1 max-w-xs">
                <Progress value={pct} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Imprimir etiqueta"
              onClick={() => handlePrint(node)}
            >
              <Printer className="h-4 w-4" />
            </Button>
            {canEdit && node.location_type !== "caixa" && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Adicionar sub-localização"
                onClick={() => openCreate(node)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Editar"
                onClick={() => {
                  setEditing(node);
                  setForm({
                    name: node.name,
                    location_type: node.location_type,
                    capacity: node.capacity?.toString() ?? "",
                    notes: node.notes ?? "",
                  });
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {isManagerOrAbove && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remover"
                onClick={() => setToDelete(node)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {isOpen && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Localizações de Arquivo"
      subtitle="Depósitos, salas, estantes, prateleiras e caixas com etiqueta QR"
    >
      <PageBreadcrumb items={[{ label: "Arquivo", href: "/archive" }, { label: "Localizações" }]} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de localizações</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Depósitos</p>
            <p className="text-2xl font-semibold">{stats.byType.deposito ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Caixas/Pastas</p>
            <p className="text-2xl font-semibold">{stats.byType.caixa ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Documentos localizados</p>
            <p className="text-2xl font-semibold">{stats.totalDocs}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Estrutura do arquivo</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar código ou designação"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            {canEdit && (
              <Button onClick={() => openCreate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo depósito
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Ainda não existem localizações</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece por criar um depósito e depois as respectivas salas, estantes e caixas.
              </p>
              {canEdit && (
                <Button onClick={() => openCreate(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro depósito
                </Button>
              )}
            </div>
          ) : filtered ? (
            <div className="space-y-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhuma localização encontrada.
                </p>
              )}
              {filtered.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{l.code}</span>
                      <span className="font-medium truncate">{l.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{l.path}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePrint(l)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Etiqueta
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">{tree.map((n) => renderNode(n))}</div>
          )}
        </CardContent>
      </Card>

      {/* QR oculto para geração da etiqueta */}
      <div ref={qrRef} className="hidden">
        {printing && <QRCodeCanvas value={printing.code} size={512} level="M" includeMargin />}
      </div>

      {/* Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova localização</DialogTitle>
            <DialogDescription>
              {parentFor ? `Dentro de ${parentFor.path ?? parentFor.name}` : "Localização de topo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.location_type}
                onValueChange={(v) => setForm((f) => ({ ...f, location_type: v as LocationType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationTypeOrder.map((t) => (
                    <SelectItem key={t} value={t}>
                      {locationTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Designação</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Depósito Central"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade (opcional)</Label>
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                placeholder="Nº máximo de documentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createLocation.isPending}>
              {createLocation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar localização</DialogTitle>
            <DialogDescription>{editing?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Designação</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateLocation.isPending}>
              {updateLocation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover localização?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.code} — {toDelete?.name}. Esta acção não pode ser anulada e só é possível se
              não existirem sub-localizações ou documentos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ArchiveLocations;
