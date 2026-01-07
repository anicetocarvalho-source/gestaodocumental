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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Check, X, RotateCcw } from "lucide-react";

interface DispatchApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispatchNumber: string;
  approverName: string;
  onApprove: (status: "aprovado" | "rejeitado" | "devolvido", comments?: string) => Promise<void>;
  isLoading?: boolean;
}

export function DispatchApprovalModal({
  open,
  onOpenChange,
  dispatchNumber,
  approverName,
  onApprove,
  isLoading,
}: DispatchApprovalModalProps) {
  const [decision, setDecision] = useState<"aprovado" | "rejeitado" | "devolvido">("aprovado");
  const [comments, setComments] = useState("");

  const handleSubmit = async () => {
    await onApprove(decision, comments.trim() || undefined);
    setDecision("aprovado");
    setComments("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setDecision("aprovado");
    setComments("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processar Aprovação</DialogTitle>
          <DialogDescription>
            Aprovar ou rejeitar o despacho {dispatchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Decisão</Label>
            <RadioGroup
              value={decision}
              onValueChange={(v) => setDecision(v as typeof decision)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="aprovado" id="aprovado" />
                <Label htmlFor="aprovado" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <Check className="h-4 w-4 text-success" />
                  Aprovar
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="devolvido" id="devolvido" />
                <Label htmlFor="devolvido" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <RotateCcw className="h-4 w-4 text-warning" />
                  Devolver para revisão
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="rejeitado" id="rejeitado" />
                <Label htmlFor="rejeitado" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <X className="h-4 w-4 text-destructive" />
                  Rejeitar
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">
              Comentários {decision !== "aprovado" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="comments"
              placeholder={
                decision === "aprovado" 
                  ? "Comentários opcionais..." 
                  : "Justifique a sua decisão..."
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || (decision !== "aprovado" && !comments.trim())}
            variant={decision === "rejeitado" ? "destructive" : "default"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : decision === "aprovado" ? (
              <Check className="h-4 w-4 mr-2" />
            ) : decision === "devolvido" ? (
              <RotateCcw className="h-4 w-4 mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            {decision === "aprovado" ? "Aprovar" : decision === "devolvido" ? "Devolver" : "Rejeitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
