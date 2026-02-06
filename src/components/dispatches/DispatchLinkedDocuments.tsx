import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronRight, Paperclip } from "lucide-react";
import { useDispatchLinkedDocuments } from "@/hooks/useCrossModuleData";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const documentStatusLabels: Record<string, string> = {
  received: "Recebido",
  validating: "Validando",
  in_progress: "Em Análise",
  pending_signature: "Aguarda Assinatura",
  signed: "Assinado",
  dispatched: "Despachado",
  archived: "Arquivado",
};

interface DispatchLinkedDocumentsProps {
  dispatchId: string;
}

export function DispatchLinkedDocuments({ dispatchId }: DispatchLinkedDocumentsProps) {
  const { data: linkedDocs, isLoading } = useDispatchLinkedDocuments(dispatchId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!linkedDocs || linkedDocs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum documento vinculado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Documentos
          <Badge variant="secondary" className="ml-1">{linkedDocs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {linkedDocs.map((doc) => {
          if (doc.document) {
            return (
              <Link
                key={doc.linkId}
                to={`/documents/${doc.document.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
              >
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.document.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{doc.document.entry_number}</span>
                    {" • "}
                    {documentStatusLabels[doc.document.status] || doc.document.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </Link>
            );
          }

          // Ficheiro directo (sem documento vinculado)
          return (
            <div
              key={doc.linkId}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border"
            >
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.fileName || "Ficheiro"}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.mimeType?.split('/')[1]?.toUpperCase() || "FILE"}
                  {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(0)} KB`}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
