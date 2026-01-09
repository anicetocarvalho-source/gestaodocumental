import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClassificationNode, useClassificationTree, useDocumentCountByClassification } from "@/hooks/useRepository";

interface TreeItemProps {
  node: ClassificationNode;
  level: number;
  selectedId: string;
  expandedIds: Set<string>;
  documentCounts: Record<string, number>;
  onSelect: (node: ClassificationNode) => void;
  onToggle: (id: string) => void;
}

function TreeItem({
  node,
  level,
  selectedId,
  expandedIds,
  documentCounts,
  onSelect,
  onToggle,
}: TreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const docCount = documentCounts[node.id] || 0;

  // Calculate total count including children
  const getTotalCount = (n: ClassificationNode): number => {
    let total = documentCounts[n.id] || 0;
    n.children.forEach((child) => {
      total += getTotalCount(child);
    });
    return total;
  };

  const totalCount = getTotalCount(node);

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node);
          if (hasChildren) onToggle(node.id);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left group",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-warning" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-warning" />
          )
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate flex-1">{node.code} - {node.name}</span>
        {totalCount > 0 && (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 px-1.5 text-xs opacity-70 group-hover:opacity-100"
          >
            {totalCount}
          </Badge>
        )}
      </button>
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
              onSelect={onSelect}
              onToggle={onToggle}
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
}

export function ClassificationTree({
  selectedClassification,
  onSelect,
}: ClassificationTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: tree, isLoading } = useClassificationTree();
  const { data: documentCounts } = useDocumentCountByClassification();

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

  return (
    <Card className="w-80 shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground mb-3">
          Classificação Documental
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar classificação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : filteredTree?.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhuma classificação encontrada
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
              onSelect={onSelect}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </Card>
  );
}
