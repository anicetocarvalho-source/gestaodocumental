import { Link } from "react-router-dom";
import { FileText, MoreVertical, Download, Eye, Pencil, Trash2 } from "lucide-react";
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

const documents = [
  {
    id: 1,
    name: "Relatório Orçamental Anual 2024",
    type: "PDF",
    status: "approved",
    date: "1 Dez, 2024",
    author: "Sara Ferreira",
  },
  {
    id: 2,
    name: "Plano de Desenvolvimento de Infra-estruturas",
    type: "DOCX",
    status: "pending",
    date: "28 Nov, 2024",
    author: "Miguel Costa",
  },
  {
    id: 3,
    name: "Avaliação de Impacto Ambiental",
    type: "PDF",
    status: "in-progress",
    date: "25 Nov, 2024",
    author: "Ana Rodrigues",
  },
  {
    id: 4,
    name: "Proposta de Iniciativa de Saúde Pública",
    type: "DOCX",
    status: "draft",
    date: "22 Nov, 2024",
    author: "David Mendes",
  },
  {
    id: 5,
    name: "Alteração à Política de Transportes",
    type: "PDF",
    status: "rejected",
    date: "20 Nov, 2024",
    author: "Lígia Santos",
  },
];

const statusMap: Record<string, "approved" | "pending" | "in-progress" | "draft" | "rejected"> = {
  approved: "approved",
  pending: "pending",
  "in-progress": "in-progress",
  draft: "draft",
  rejected: "rejected",
};

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  "in-progress": "Em Curso",
  draft: "Rascunho",
  rejected: "Rejeitado",
};

export function RecentDocuments() {
  return (
    <Card variant="default" className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Documentos Recentes</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/documents">Ver Todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header border-b border-border">
                <th className="px-6 py-3 text-left">Documento</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Autor</th>
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
                      <span className="font-medium text-foreground hover:text-primary transition-colors">{doc.name}</span>
                    </Link>
                  </td>
                  <td className="table-cell">
                    <span className="text-muted-foreground">{doc.type}</span>
                  </td>
                  <td className="table-cell">
                    <Badge variant={statusMap[doc.status]}>
                      {statusLabels[doc.status]}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <span className="text-muted-foreground">{doc.author}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-muted-foreground">{doc.date}</span>
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
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
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
      </CardContent>
    </Card>
  );
}
