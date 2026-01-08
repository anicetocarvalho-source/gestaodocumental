import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2, Sparkles, FileText, FolderOpen, HelpCircle } from "lucide-react";
import { Message } from "@/hooks/useConversations";
import { MarkdownContent } from "./MarkdownContent";
import { MessageActions } from "./MessageActions";
import { ContextualSuggestions } from "./ContextualSuggestions";

const suggestedQuestions = [
  { icon: FileText, text: "Quais são os documentos mais recentes no sistema?" },
  { icon: FolderOpen, text: "Quantos processos estão em andamento?" },
  { icon: HelpCircle, text: "Como funciona o fluxo de aprovação de documentos?" },
  { icon: Sparkles, text: "Quais são as unidades organizacionais registadas?" },
];

type Props = {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: (text?: string) => void;
  streamingContent?: string;
  onFeedback?: (messageId: string, positive: boolean) => void;
};

export function ChatArea({
  messages,
  input,
  setInput,
  isLoading,
  onSend,
  streamingContent,
  onFeedback,
}: Props) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Bem-vindo ao Assistente MINAGRIF
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Sou o seu assistente de conhecimento interno. Posso ajudá-lo a encontrar documentos, 
              processos, explicar procedimentos e muito mais.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 overflow-hidden"
                  onClick={() => onSend(q.text)}
                >
                  <q.icon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{q.text}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                onFeedback={onFeedback}
              />
            ))}
            {streamingContent && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%] rounded-xl px-4 py-3 bg-muted">
                  <MarkdownContent content={streamingContent || "..."} className="text-sm" />
                </div>
              </div>
            )}
            {isLoading && !streamingContent && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Contextual Suggestions */}
      {messages.length > 0 && !streamingContent && (
        <ContextualSuggestions
          messages={messages}
          onSelectSuggestion={onSend}
          isLoading={isLoading}
        />
      )}

      <div className="border-t border-border p-4 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Escreva a sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => onSend()} disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          As respostas são baseadas exclusivamente nos dados do sistema MINAGRIF.
        </p>
      </div>
    </div>
  );
}

type MessageBubbleProps = {
  message: Message;
  onFeedback?: (messageId: string, positive: boolean) => void;
};

function MessageBubble({ message, onFeedback }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 group",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "assistant" && (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "rounded-xl px-4 py-3",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {message.role === "assistant" ? (
            <MarkdownContent content={message.content || "..."} className="text-sm" />
          ) : (
            <div className="text-sm whitespace-pre-wrap">{message.content || "..."}</div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={cn(
            "text-[10px]",
            message.role === "user" ? "text-muted-foreground ml-auto" : "text-muted-foreground"
          )}>
            {new Date(message.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.role === "assistant" && (
            <MessageActions 
              content={message.content} 
              messageId={message.id}
              onFeedback={onFeedback}
            />
          )}
        </div>
      </div>
      {message.role === "user" && (
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
