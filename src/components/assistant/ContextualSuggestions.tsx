import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Message } from "@/hooks/useConversations";
import { useMemo } from "react";

type Props = {
  messages: Message[];
  onSelectSuggestion: (text: string) => void;
  isLoading: boolean;
};

// Generate contextual suggestions based on conversation history
function generateSuggestions(messages: Message[]): string[] {
  if (messages.length === 0) return [];
  
  const lastMessages = messages.slice(-4); // Consider last 4 messages for context
  const conversationText = lastMessages.map(m => m.content.toLowerCase()).join(" ");
  
  const suggestions: string[] = [];
  
  // Document-related suggestions
  if (conversationText.includes("documento") || conversationText.includes("documentos")) {
    suggestions.push("Qual é o estado actual deste documento?");
    suggestions.push("Quem é o responsável por este documento?");
    suggestions.push("Mostrar o histórico de movimentações do documento");
  }
  
  // Process-related suggestions
  if (conversationText.includes("processo") || conversationText.includes("processos")) {
    suggestions.push("Quais são as próximas etapas deste processo?");
    suggestions.push("Qual é o prazo para conclusão?");
    suggestions.push("Listar os documentos anexados ao processo");
  }
  
  // Workflow-related suggestions
  if (conversationText.includes("workflow") || conversationText.includes("fluxo") || conversationText.includes("aprovação")) {
    suggestions.push("Explicar as etapas do fluxo de aprovação");
    suggestions.push("Quem são os aprovadores definidos?");
    suggestions.push("Qual é o tempo médio de aprovação?");
  }
  
  // Unit/department-related suggestions
  if (conversationText.includes("unidade") || conversationText.includes("departamento") || conversationText.includes("direcção")) {
    suggestions.push("Quais processos estão pendentes nesta unidade?");
    suggestions.push("Listar os colaboradores desta unidade");
    suggestions.push("Quais são as responsabilidades desta unidade?");
  }
  
  // Search/query-related suggestions
  if (conversationText.includes("pesquisa") || conversationText.includes("encontrar") || conversationText.includes("buscar")) {
    suggestions.push("Refinar a pesquisa por data");
    suggestions.push("Filtrar por tipo de documento");
    suggestions.push("Ordenar resultados por prioridade");
  }
  
  // Statistics/reports-related suggestions
  if (conversationText.includes("estatístic") || conversationText.includes("relatório") || conversationText.includes("quantidade")) {
    suggestions.push("Comparar com o período anterior");
    suggestions.push("Exportar estes dados para relatório");
    suggestions.push("Mostrar tendências ao longo do tempo");
  }
  
  // Classification-related suggestions
  if (conversationText.includes("classificaç") || conversationText.includes("categoria") || conversationText.includes("taxonomia")) {
    suggestions.push("Mostrar a hierarquia de classificação");
    suggestions.push("Quais documentos pertencem a esta categoria?");
    suggestions.push("Qual é o tempo de retenção definido?");
  }
  
  // Deadline/SLA-related suggestions
  if (conversationText.includes("prazo") || conversationText.includes("sla") || conversationText.includes("urgente") || conversationText.includes("atraso")) {
    suggestions.push("Listar processos em risco de atraso");
    suggestions.push("Quais são os SLAs definidos?");
    suggestions.push("Notificar responsáveis sobre prazos");
  }
  
  // Archive-related suggestions
  if (conversationText.includes("arquiv") || conversationText.includes("histórico")) {
    suggestions.push("Quando foi arquivado este documento?");
    suggestions.push("Quem autorizou o arquivamento?");
    suggestions.push("Pesquisar documentos no arquivo");
  }
  
  // Permission-related suggestions
  if (conversationText.includes("permiss") || conversationText.includes("acesso") || conversationText.includes("autorização")) {
    suggestions.push("Quem tem acesso a este documento?");
    suggestions.push("Solicitar permissões adicionais");
    suggestions.push("Verificar níveis de confidencialidade");
  }
  
  // Generic follow-ups based on last message type
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "assistant") {
    // If AI mentioned IDs, suggest exploring them
    if (lastMessage.content.includes("ID") || lastMessage.content.includes("nº")) {
      suggestions.push("Mostrar mais detalhes sobre este registo");
    }
    
    // If AI mentioned a list, suggest actions
    if (lastMessage.content.includes("1.") || lastMessage.content.includes("•") || lastMessage.content.includes("-")) {
      suggestions.push("Explicar cada item em detalhe");
    }
    
    // If AI gave a summary
    if (lastMessage.content.length > 500) {
      suggestions.push("Resumir em tópicos principais");
    }
  }
  
  // Remove duplicates and limit to 3 suggestions
  const uniqueSuggestions = [...new Set(suggestions)];
  return uniqueSuggestions.slice(0, 3);
}

export function ContextualSuggestions({ messages, onSelectSuggestion, isLoading }: Props) {
  const suggestions = useMemo(() => generateSuggestions(messages), [messages]);
  
  if (suggestions.length === 0 || isLoading) return null;
  
  return (
    <div className="px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Sugestões de seguimento</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-auto py-1.5 px-3 text-xs bg-background hover:bg-primary/5 hover:border-primary/30 transition-colors"
            onClick={() => onSelectSuggestion(suggestion)}
          >
            <span>{suggestion}</span>
            <ArrowRight className="h-3 w-3 ml-1.5 opacity-50" />
          </Button>
        ))}
      </div>
    </div>
  );
}
