import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  MoreVertical,
  FolderPlus,
  Edit,
  Trash2,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ClassificationNode,
  useClassificationTree,
  useDocumentCountByClassification,
  useDeleteClassification,
  useUpdateDocumentClassification,
} from "@/hooks/useRepository";
import { CreateClassificationModal } from "./CreateClassificationModal";
import { EditClassificationModal } from "./EditClassificationModal";

interface TreeItemProps {
  node: ClassificationNode;
  level: number;
  selectedId: string;
  expandedIds: Set<string>;
  documentCounts: Record<string, number>;
  isDragging: boolean;
  onSelect: (node: ClassificationNode) => void;
  onToggle: (id: string) => void;
  onAddChild: (parent: ClassificationNode) => void;
  onEdit: (node: ClassificationNode) => void;
  onDelete: (node: ClassificationNode) => void;
  onDrop: (node: ClassificationNode, documentIds: string[]) => void;
}

function TreeItem({
  node,
  level,
  selectedId,
  expandedIds,
  documentCounts,
  isDragging,
  onSelect,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onDrop,
}: TreeItemProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  // Calculate total count including children
  const getTotalCount = (n: ClassificationNode): number => {
    let total = documentCounts[n.id] || 0;
    n.children.forEach((child) => {
      total += getTotalCount(child);
    });
    return total;
  };

  const totalCount = getTotalCount(node);
  const hasDocuments = totalCount > 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) {
      e.dataTransfer.dropEffect = "move";
      setIsDropTarget(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
    
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const documentIds = JSON.parse(data) as string[];
        onDrop(node, documentIds);
      }
    } catch (error) {
      console.error("Error parsing drag data:", error);
    }
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center rounded-md transition-all",
          isSelected
            ? "bg-primary/10"
            : "hover:bg-muted",
          isDropTarget && isDragging && "ring-2 ring-primary ring-offset-1 bg-primary/5"
        )}
      >
        <button
          onClick={() => {
            onSelect(node);
            if (hasChildren) onToggle(node.id);
          }}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left",
            isSelected
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
          {hasChildren || node.level < 3 ? (
            isExpanded ? (
              <FolderOpen className={cn(
                "h-4 w-4 shrink-0",
                isDropTarget && isDragging ? "text-primary" : "text-warning"
              )} />
            ) : (
              <Folder className={cn(
                "h-4 w-4 shrink-0",
                isDropTarget && isDragging ? "text-primary" : "text-warning"
              )} />
            )
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate flex-1">
            {node.code} - {node.name}
          </span>
          {totalCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1.5 text-xs opacity-70 group-hover:opacity-100"
            >
              {totalCount}
            </Badge>
          )}
        </button>

        {/* Actions dropdown - visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onAddChild(node)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Sub-classificação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(node)}>
                <Info className="h-4 w-4 mr-2" />
                Detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(node)}
                disabled={hasDocuments || hasChildren}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {hasDocuments || hasChildren ? "Não pode eliminar" : "Desactivar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              documentCounts={documentCounts}
              isDragging={isDragging}
              onSelect={onSelect}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ClassificationTreeProps {
  selectedClassification: ClassificationNode | null;
  onSelect: (node: ClassificationNode) => void;
  isDragging?: boolean;
}

export function ClassificationTree({
  selectedClassification,
  onSelect,
  isDragging = false,
}: ClassificationTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [parentForCreate, setParentForCreate] = useState<ClassificationNode | null>(null);
  const [classificationToEdit, setClassificationToEdit] = useState<ClassificationNode | null>(null);
  const [classificationToDelete, setClassificationToDelete] = useState<ClassificationNode | null>(null);

  const { data: tree, isLoading } = useClassificationTree();
  const { data: documentCounts } = useDocumentCountByClassification();
  const deleteMutation = useDeleteClassification();
  const updateDocumentClassification = useUpdateDocumentClassification();

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!tree || !searchQuery.trim()) return tree;

    const searchLower = searchQuery.toLowerCase();

    const filterNode = (node: ClassificationNode): ClassificationNode | null => {
      const matches =
        node.code.toLowerCase().includes(searchLower) ||
        node.name.toLowerCase().includes(searchLower);

      const filteredChildren = node.children
        .map(filterNode)
        .filter(Boolean) as ClassificationNode[];

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return tree.map(filterNode).filter(Boolean) as ClassificationNode[];
  }, [tree, searchQuery]);

  // Auto-expand when searching
  useMemo(() => {
    if (searchQuery.trim() && filteredTree) {
      const getAllIds = (nodes: ClassificationNode[]): string[] => {
        return nodes.flatMap((n) => [n.id, ...getAllIds(n.children)]);
      };
      setExpandedIds(new Set(getAllIds(filteredTree)));
    }
  }, [searchQuery, filteredTree]);

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleAddChild = (parent: ClassificationNode) => {
    setParentForCreate(parent);
    setCreateModalOpen(true);
  };

  const handleAddRoot = () => {
    setParentForCreate(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (node: ClassificationNode) => {
    setClassificationToEdit(node);
    setEditModalOpen(true);
  };

  const handleDelete = (node: ClassificationNode) => {
    setClassificationToDelete(node);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!classificationToDelete) return;

    try {
      await deleteMutation.mutateAsync(classificationToDelete.id);
      toast.success("Classificação desactivada com sucesso");
      setDeleteDialogOpen(false);
      setClassificationToDelete(null);
    } catch (error) {
      toast.error("Erro ao desactivar classificação");
      console.error(error);
    }
  };

  const handleDrop = async (node: ClassificationNode, documentIds: string[]) => {
    try {
      await updateDocumentClassification.mutateAsync({
        documentIds,
        classificationId: node.id,
      });
      toast.success(
        documentIds.length > 1
          ? `${documentIds.length} documentos movidos para "${node.code} - ${node.name}"`
          : `Documento movido para "${node.code} - ${node.name}"`
      );
    } catch (error) {
      toast.error("Erro ao mover documento(s)");
      console.error(error);
    }
  };

  return (
    <>
      <Card className={cn(
        "w-80 shrink-0 flex flex-col h-full transition-all",
        isDragging && "ring-2 ring-primary/50 ring-offset-2"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">
              Classificação Documental
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleAddRoot}
                  className="h-7 w-7"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Nova classificação</TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar classificação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {isDragging && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <Folder className="h-3 w-3" />
              Arraste para uma classificação
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : filteredTree?.length === 0 ? (
            <div className="p-4 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">
                Nenhuma classificação encontrada
              </p>
              <Button variant="outline" size="sm" onClick={handleAddRoot}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira
              </Button>
            </div>
          ) : (
            filteredTree?.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                level={0}
                selectedId={selectedClassification?.id || ""}
                expandedIds={expandedIds}
                documentCounts={documentCounts || {}}
                isDragging={isDragging}
                onSelect={onSelect}
                onToggle={handleToggle}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </Card>

      <CreateClassificationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        parentClassification={parentForCreate}
      />

      <EditClassificationModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        classification={classificationToEdit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Classificação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja desactivar a classificação{" "}
              <strong>
                {classificationToDelete?.code} - {classificationToDelete?.name}
              </strong>
              ? Esta acção pode ser revertida pelo administrador do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
