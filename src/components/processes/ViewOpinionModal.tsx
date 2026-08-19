import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface OpinionLike {
  id: string;
  opinion_number: string;
  opinion_type: string;
  summary: string | null;
  content?: string | null;
  decision?: string | null;
  created_at: string;
  author?: { full_name?: string | null } | null;
  unit?: { name?: string | null } | null;
}

interface ViewOpinionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opinion: OpinionLike | null;
}

const typeLabels: Record<string, string> = {
  parecer_tecnico: "Parecer Técnico",
  parecer_juridico: "Parecer Jurídico",
  despacho: "Despacho",
};

export function ViewOpinionModal({ open, onOpenChange, opinion }: ViewOpinionModalProps) {
  if (!opinion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm">{opinion.opinion_number}</span>
            <Badge variant={opinion.opinion_type === "despacho" ? "info" : "secondary"}>
              {typeLabels[opinion.opinion_type] || opinion.opinion_type}
            </Badge>
            {opinion.decision && (
              <Badge
                variant={
                  opinion.decision === "favoravel"
                    ? "success"
                    : opinion.decision === "desfavoravel"
                    ? "error"
                    : "info"
                }
                className="capitalize"
              >
                {opinion.decision}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {opinion.author?.full_name || "-"} • {opinion.unit?.name || "-"} •{" "}
            {format(new Date(opinion.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Resumo</p>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{opinion.summary || "-"}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Conteúdo integral</p>
            <ScrollArea className="max-h-[45vh] rounded-lg border border-border">
              <p className="text-sm whitespace-pre-wrap p-3">
                {opinion.content || "Sem conteúdo integral registado."}
              </p>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
