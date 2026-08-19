import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ClassificationNode,
  useClassificationTree,
  useUpdateDocumentClassification,
} from "@/hooks/useRepository";

interface BulkClassifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentIds: string[];
  mode?: "classify" | "move";
  onDone?: () => void;
}

function flatten(nodes: ClassificationNode[], depth = 0): { node: ClassificationNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.children || [], depth + 1)]);
}

export function BulkClassifyDialog({
  open,
  onOpenChange,
  documentIds,
  mode = "classify",
  onDone,
}: BulkClassifyDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: tree, isLoading } = useClassificationTree();
  const updateClassification = useUpdateDocumentClassification();

  const items = useMemo(() => {
    const all = flatten(tree || []);
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      ({ node }) =>
        node.code.toLowerCase().includes(term) || node.name.toLowerCase().includes(term)
    );
  }, [tree, search]);

  const handleConfirm = async () => {
    if (!selectedId) {
      toast.error("Seleccione uma classificação");
      return;
    }
    try {
      await updateClassification.mutateAsync({ documentIds, classificationId: selectedId });
      toast.success(
        `${documentIds.length} documento(s) ${mode === "move" ? "movido(s)" : "classificado(s)"} com sucesso`
      );
      onOpenChange(false);
      setSelectedId(null);
      setSearch("");
      onDone?.();
    } catch {
      toast.error("Erro ao actualizar classificação");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "move" ? "Mover documentos" : "Classificar documentos"}
          </DialogTitle>
          <DialogDescription>
            Seleccione a classificação de destino para {documentIds.length} documento(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-classify-search">Pesquisar classificação</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="bulk-classify-search"
                className="pl-9"
                placeholder="Código ou designação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-72 rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center h-72">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma classificação encontrada.</p>
            ) : (
              <div className="p-1">
                {items.map(({ node, depth }) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors",
                      selectedId === node.id && "bg-primary/10 text-primary font-medium"
                    )}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                  >
                    <span className="font-mono text-xs mr-2">{node.code}</span>
                    {node.name}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId || updateClassification.isPending}>
            {updateClassification.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
