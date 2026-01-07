import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Link2, Loader2, Check } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useLinkDocumentToProcess } from "@/hooks/useProcesses";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface LinkDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  linkedDocumentIds: string[];
}

export function LinkDocumentModal({
  open,
  onOpenChange,
  processId,
  linkedDocumentIds,
}: LinkDocumentModalProps) {
  const [search, setSearch] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const { data: documentsData, isLoading } = useDocuments(
    { search: search || undefined, is_archived: false },
    { page: 1, pageSize: 50 }
  );

  const linkMutation = useLinkDocumentToProcess();

  const documents = documentsData?.data || [];

  const handleLink = () => {
    if (!selectedDocumentId) return;

    linkMutation.mutate(
      {
        process_id: processId,
        document_id: selectedDocumentId,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedDocumentId(null);
          setDescription("");
          setSearch("");
          onOpenChange(false);
        },
      }
    );
  };

  const statusLabels: Record<string, string> = {
    received: "Recebido",
    validating: "Validando",
    in_progress: "Em Análise",
    pending_signature: "Aguarda Assinatura",
    signed: "Assinado",
    dispatched: "Despachado",
    archived: "Arquivado",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Documento Existente</DialogTitle>
          <DialogDescription>
            Pesquise e selecione um documento do sistema para vincular ao processo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Document List */}
          <ScrollArea className="h-[280px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhum documento encontrado</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {documents.map((doc) => {
                  const isLinked = linkedDocumentIds.includes(doc.id);
                  const isSelected = selectedDocumentId === doc.id;

                  return (
                    <button
                      key={doc.id}
                      type="button"
                      disabled={isLinked}
                      onClick={() => setSelectedDocumentId(isSelected ? null : doc.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isLinked
                          ? "bg-muted/50 border-border opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {isSelected ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{doc.title}</p>
                            {isLinked && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Vinculado
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{doc.entry_number}</span>
                            {" • "}
                            {statusLabels[doc.status] || doc.status}
                            {" • "}
                            {format(new Date(doc.entry_date), "dd MMM yyyy", { locale: pt })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Description */}
          {selectedDocumentId && (
            <div className="space-y-2">
              <Label htmlFor="link-description">Descrição do vínculo (opcional)</Label>
              <Textarea
                id="link-description"
                placeholder="Descreva a relação deste documento com o processo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={linkMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedDocumentId || linkMutation.isPending}
          >
            {linkMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A vincular...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Vincular
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
