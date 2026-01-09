import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  Move,
  Eye,
  Tags,
  Edit,
  ArrowUpDown,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RepositoryDocument } from "@/hooks/useRepository";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  in_progress: "Em Tratamento",
  completed: "Concluído",
  archived: "Arquivado",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/10 text-warning border-warning/30",
  in_progress: "bg-info/10 text-info border-info/30",
  completed: "bg-success/10 text-success border-success/30",
  archived: "bg-secondary/10 text-secondary-foreground border-secondary/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

interface RepositoryTableProps {
  documents: RepositoryDocument[];
  isLoading: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDragStart?: (documentIds: string[]) => void;
  onDragEnd?: () => void;
}

type SortKey = "title" | "entry_number" | "created_at" | "status";
type SortDir = "asc" | "desc";

export function RepositoryTable({
  documents,
  isLoading,
  selectedItems,
  onToggleSelect,
  onToggleSelectAll,
  onDragStart,
  onDragEnd,
}: RepositoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "entry_number":
        comparison = a.entry_number.localeCompare(b.entry_number);
        break;
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortDir === "asc" ? comparison : -comparison;
  });

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    setDraggingId(docId);
    
    // If the dragged item is selected, drag all selected items
    // Otherwise, just drag the single item
    const idsToMove = selectedItems.has(docId) 
      ? Array.from(selectedItems) 
      : [docId];
    
    e.dataTransfer.setData("application/json", JSON.stringify(idsToMove));
    e.dataTransfer.effectAllowed = "move";
    
    // Create a custom drag image
    const dragImage = document.createElement("div");
    dragImage.className = "bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg text-sm font-medium";
    dragImage.textContent = idsToMove.length > 1 
      ? `${idsToMove.length} documentos` 
      : "1 documento";
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    onDragStart?.(idsToMove);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    onDragEnd?.();
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Nenhum documento encontrado</h3>
          <p className="text-muted-foreground text-sm">
            Seleccione uma classificação ou ajuste os filtros.
          </p>
        </div>
      </Card>
    );
  }

  const SortableHeader = ({
    children,
    sortKeyName,
  }: {
    children: React.ReactNode;
    sortKeyName: SortKey;
  }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 px-2 py-3"></th>
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={
                    selectedItems.size === documents.length && documents.length > 0
                  }
                  onCheckedChange={onToggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SortableHeader sortKeyName="entry_number">Nº Entrada</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SortableHeader sortKeyName="title">Título</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Classificação
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SortableHeader sortKeyName="status">Estado</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SortableHeader sortKeyName="created_at">Data</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Criado por
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.map((doc) => (
              <tr
                key={doc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, doc.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "border-b border-border hover:bg-muted/30 transition-colors cursor-grab active:cursor-grabbing",
                  selectedItems.has(doc.id) && "bg-primary/5",
                  draggingId === doc.id && "opacity-50"
                )}
              >
                <td className="px-2 py-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                </td>
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedItems.has(doc.id)}
                    onCheckedChange={() => onToggleSelect(doc.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {doc.entry_number}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-info shrink-0" />
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {doc.title}
                      </Link>
                      {doc.document_type && (
                        <span className="text-xs text-muted-foreground">
                          {doc.document_type.name}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {doc.classification_code ? (
                    <span className="text-sm text-muted-foreground">
                      {doc.classification_code.code}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Não classificado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={statusVariants[doc.status] || ""}
                  >
                    {statusLabels[doc.status] || doc.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {format(parseISO(doc.created_at), "dd/MM/yyyy", { locale: pt })}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {doc.created_by_profile?.full_name || "-"}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/documents/${doc.id}/view`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Visualizar Ficheiro
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Transferir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Tags className="h-4 w-4 mr-2" />
                        Classificar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Move className="h-4 w-4 mr-2" />
                        Mover
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
