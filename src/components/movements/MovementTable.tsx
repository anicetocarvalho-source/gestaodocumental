import { useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Building2,
  User,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MovementWithDetails, actionTypeLabels } from "@/hooks/useMovements";

interface MovementTableProps {
  movements: MovementWithDetails[];
  isLoading?: boolean;
}

type SortKey = "created_at" | "action_type" | "document" | "from_unit" | "to_unit";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 15;

const actionTypeColors: Record<string, string> = {
  despacho: "bg-primary/10 text-primary border-primary/20",
  encaminhamento: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  recebimento: "bg-success/10 text-success border-success/20",
  devolucao: "bg-warning/10 text-warning border-warning/20",
  arquivamento: "bg-muted text-muted-foreground border-border",
  reativacao: "bg-success/10 text-success border-success/20",
  informacao: "bg-info/10 text-info border-info/20",
  parecer: "bg-primary/10 text-primary border-primary/20",
};

const priorityVariants: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-secondary/10 text-secondary-foreground border-secondary/30",
};

export function MovementTable({ movements, isLoading }: MovementTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(0);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const sortedMovements = [...(movements || [])].sort((a, b) => {
    const modifier = sortOrder === "asc" ? 1 : -1;
    switch (sortKey) {
      case "created_at":
        return modifier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "action_type":
        return modifier * a.action_type.localeCompare(b.action_type);
      case "document":
        return modifier * (a.document?.entry_number || "").localeCompare(b.document?.entry_number || "");
      case "from_unit":
        return modifier * (a.from_unit?.code || "").localeCompare(b.from_unit?.code || "");
      case "to_unit":
        return modifier * (a.to_unit?.code || "").localeCompare(b.to_unit?.code || "");
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedMovements.length / PAGE_SIZE);
  const paginatedMovements = sortedMovements.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("created_at")}
                >
                  Data/Hora
                  <SortIcon column="created_at" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("action_type")}
                >
                  Tipo
                  <SortIcon column="action_type" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("document")}
                >
                  Documento
                  <SortIcon column="document" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("from_unit")}
                >
                  Origem
                  <SortIcon column="from_unit" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8"
                  onClick={() => handleSort("to_unit")}
                >
                  Destino
                  <SortIcon column="to_unit" />
                </Button>
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Despacho/Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhuma movimentação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(parseISO(movement.created_at), "dd/MM/yy HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={actionTypeColors[movement.action_type] || ""}
                    >
                      {actionTypeLabels[movement.action_type] || movement.action_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {movement.document ? (
                      <Link 
                        to={`/documents/${movement.document.id}`}
                        className="flex items-center gap-2 hover:text-primary group"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <div>
                          <div className="font-medium text-sm">{movement.document.entry_number}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {movement.document.title}
                          </div>
                        </div>
                        {movement.document.priority !== 'normal' && (
                          <Badge 
                            variant="outline" 
                            className={`ml-1 text-xs ${priorityVariants[movement.document.priority]}`}
                          >
                            {movement.document.priority === 'urgent' ? 'Urg' : 
                             movement.document.priority === 'high' ? 'Alt' : 'Bx'}
                          </Badge>
                        )}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {movement.from_unit ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{movement.from_unit.code}</span>
                      </div>
                    ) : movement.from_user ? (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[100px]">{movement.from_user.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {movement.to_unit && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{movement.to_unit.code}</span>
                        </div>
                      )}
                      {movement.to_user && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[100px]">{movement.to_user.full_name}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {movement.is_read ? (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Lido</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {movement.dispatch_text || movement.notes ? (
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={movement.dispatch_text || movement.notes || ''}>
                        {movement.dispatch_text || movement.notes}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1} a {Math.min((page + 1) * PAGE_SIZE, sortedMovements.length)} de {sortedMovements.length} movimentações
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
