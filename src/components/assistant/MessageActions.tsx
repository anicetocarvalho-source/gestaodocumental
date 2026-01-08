import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  content: string;
  messageId: string;
  onFeedback?: (messageId: string, positive: boolean) => void;
};

export function MessageActions({ content, messageId, onFeedback }: Props) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Resposta copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleFeedback = (positive: boolean) => {
    setFeedback(positive ? "positive" : "negative");
    onFeedback?.(messageId, positive);
    toast.success(positive ? "Obrigado pelo feedback positivo!" : "Obrigado pelo feedback. Vamos melhorar!");
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copiar resposta</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              feedback === "positive" && "bg-success/10"
            )}
            onClick={() => handleFeedback(true)}
            disabled={feedback !== null}
          >
            <ThumbsUp
              className={cn(
                "h-3.5 w-3.5",
                feedback === "positive" ? "text-success fill-success" : "text-muted-foreground"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Resposta útil</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              feedback === "negative" && "bg-destructive/10"
            )}
            onClick={() => handleFeedback(false)}
            disabled={feedback !== null}
          >
            <ThumbsDown
              className={cn(
                "h-3.5 w-3.5",
                feedback === "negative" ? "text-destructive fill-destructive" : "text-muted-foreground"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Resposta não útil</TooltipContent>
      </Tooltip>
    </div>
  );
}
