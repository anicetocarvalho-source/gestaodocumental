import { Link } from "react-router-dom";
import { FileText, MoreVertical, Download, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRecentDocuments } from "@/hooks/useDashboardStats";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const statusVariants: Record<string, "approved" | "pending" | "in-progress" | "draft" | "rejected" | "default"> = {
  completed: "approved",
  archived: "approved",
  pending_signature: "pending",
  validating: "pending",
  received: "draft",
  in_progress: "in-progress",
  rejected: "rejected",
  cancelled: "rejected",
};

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  archived: "Arquivado",
  pending_signature: "Pend. Assinatura",
  validating: "Em Validação",
  received: "Recebido",
  in_progress: "Em Curso",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

export function RecentDocuments() {
  const { data: documents, isLoading } = useRecentDocuments(5);

  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Documentos Recentes</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/documents">Ver Todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !documents?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header border-b border-border">
                  <th className="px-6 py-3 text-left">Documento</th>
                  <th className="px-6 py-3 text-left">Tipo</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Responsável</th>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/documents/${doc.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-[200px]">
                            {doc.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{doc.entry_number}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="table-cell">
                      <span className="text-muted-foreground">
                        {doc.document_type?.name || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Badge variant={statusVariants[doc.status] || "default"}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <span className="text-muted-foreground">
                        {doc.responsible_user?.full_name || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-muted-foreground">
                        {format(new Date(doc.entry_date), "d MMM, yyyy", { locale: pt })}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-popover">
                          <DropdownMenuItem asChild>
                            <Link to={`/documents/${doc.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/documents/${doc.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Descarregar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-error focus:text-error">
                            <Trash2 className="mr-2 h-4 w-4" />
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
        )}
      </CardContent>
    </Card>
  );
}
