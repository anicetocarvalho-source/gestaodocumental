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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileOutput } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAddProcessOpinion } from "@/hooks/useProcesses";

interface AddOpinionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
}

const opinionTypes = [
  { value: "parecer_tecnico", label: "Parecer Técnico" },
  { value: "parecer_juridico", label: "Parecer Jurídico" },
  { value: "despacho", label: "Despacho" },
];

const decisions = [
  { value: "favoravel", label: "Favorável" },
  { value: "desfavoravel", label: "Desfavorável" },
  { value: "informativo", label: "Informativo" },
];

const SUMMARY_MAX = 500;
const CONTENT_MAX = 5000;

export function AddOpinionModal({ open, onOpenChange, processId }: AddOpinionModalProps) {
  const [opinionType, setOpinionType] = useState<string>("parecer_tecnico");
  const [decision, setDecision] = useState<string>("informativo");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addOpinion = useAddProcessOpinion();

  const reset = () => {
    setOpinionType("parecer_tecnico");
    setDecision("informativo");
    setSummary("");
    setContent("");
    setErrors({});
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!summary.trim()) {
      next.summary = "Indique um resumo do parecer.";
    } else if (summary.trim().length < 10) {
      next.summary = "O resumo deve ter pelo menos 10 caracteres.";
    } else if (summary.length > SUMMARY_MAX) {
      next.summary = `Máximo de ${SUMMARY_MAX} caracteres.`;
    }
    if (content.length > CONTENT_MAX) {
      next.content = `Máximo de ${CONTENT_MAX} caracteres.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    addOpinion.mutate(
      {
        process_id: processId,
        opinion_type: opinionType,
        summary: summary.trim(),
        content: content.trim() || undefined,
        decision,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="h-4 w-4" />
            Emitir Parecer
          </DialogTitle>
          <DialogDescription>
            O número do parecer é atribuído automaticamente pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opinion-type">Tipo</Label>
              <Select value={opinionType} onValueChange={setOpinionType}>
                <SelectTrigger id="opinion-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opinionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opinion-decision">Sentido da decisão</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger id="opinion-decision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {decisions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opinion-summary">Resumo</Label>
            <Textarea
              id="opinion-summary"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (errors.summary) setErrors((p) => ({ ...p, summary: "" }));
              }}
              placeholder="Síntese da apreciação efectuada..."
              rows={3}
              maxLength={SUMMARY_MAX}
              aria-invalid={!!errors.summary}
              className={cn(errors.summary && "border-destructive focus-visible:ring-destructive")}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-destructive">{errors.summary || ""}</p>
              <span className="text-xs text-muted-foreground">
                {summary.length}/{SUMMARY_MAX}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opinion-content">Conteúdo integral (opcional)</Label>
            <Textarea
              id="opinion-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((p) => ({ ...p, content: "" }));
              }}
              placeholder="Fundamentação completa do parecer..."
              rows={6}
              maxLength={CONTENT_MAX}
              aria-invalid={!!errors.content}
              className={cn(errors.content && "border-destructive focus-visible:ring-destructive")}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-destructive">{errors.content || ""}</p>
              <span className="text-xs text-muted-foreground">
                {content.length}/{CONTENT_MAX}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addOpinion.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={addOpinion.isPending}>
            {addOpinion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registar Parecer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
