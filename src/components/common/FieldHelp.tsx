import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FieldHelpProps {
  /** Texto de ajuda a mostrar no tooltip */
  helpText: string;
  /** Tamanho do ícone */
  size?: "sm" | "default";
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente de ícone de ajuda (?) com tooltip explicativo.
 * Use junto a labels de campos técnicos para ajudar utilizadores.
 */
export function FieldHelp({ helpText, size = "default", className }: FieldHelpProps) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "sm" ? "h-4 w-4" : "h-5 w-5",
            className
          )}
          aria-label="Ajuda"
        >
          <HelpCircle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs text-sm"
        sideOffset={5}
      >
        {helpText}
      </TooltipContent>
    </Tooltip>
  );
}

// Textos de ajuda predefinidos para termos técnicos comuns do sistema
export const fieldHelpTexts = {
  classification: "Código arquivístico que define como o documento será organizado e o seu tempo de retenção no sistema.",
  confidentiality: "Define quem pode aceder ao documento. Público: todos. Interno: apenas funcionários. Restrito: apenas autorizados. Secreto: acesso muito limitado.",
  priority: "Define a urgência de tratamento. Normal: prazo padrão. Alta: atenção prioritária. Urgente: requer acção imediata.",
  documentType: "Categoria do documento (ofício, memorando, relatório, etc.) que determina o seu tratamento.",
  organizationalUnit: "Departamento ou secção da organização responsável pelo documento.",
  entryNumber: "Número único atribuído automaticamente quando o documento entra no sistema.",
  externalReference: "Referência do documento na instituição de origem (número de ofício externo, protocolo, etc.).",
  ocr: "Reconhecimento Óptico de Caracteres - tecnologia que converte imagens de texto em texto editável e pesquisável.",
  retention: "Período durante o qual o documento deve ser mantido antes de poder ser eliminado ou arquivado permanentemente.",
  digitalSignature: "Assinatura electrónica que garante a autenticidade e integridade do documento.",
  workflow: "Fluxo de trabalho - sequência de passos e aprovações que o documento deve seguir.",
};
