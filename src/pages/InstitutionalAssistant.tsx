import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  FileText,
  FolderOpen,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/minagrif-assistant`;

const suggestedQuestions = [
  { icon: FileText, text: "Quais são os documentos mais recentes no sistema?" },
  { icon: FolderOpen, text: "Quantos processos estão em andamento?" },
  { icon: HelpCircle, text: "Como funciona o fluxo de aprovação de documentos?" },
  { icon: Sparkles, text: "Quais são as unidades organizacionais registadas?" },
];

const InstitutionalAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: { role: string; content: string }[]) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error("Limite de pedidos excedido. Por favor, aguarde um momento.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes. Por favor, contacte o administrador.");
      }
      throw new Error(errorData.error || "Erro ao comunicar com o assistente");
    }

    if (!response.body) throw new Error("Resposta sem corpo");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => 
              prev.map(m => m.id === assistantId 
                ? { ...m, content: assistantContent } 
                : m
              )
            );
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => 
              prev.map(m => m.id === assistantId 
                ? { ...m, content: assistantContent } 
                : m
              )
            );
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      await streamChat(chatHistory);
    } catch (error) {
      console.error("Erro no chat:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar a mensagem");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  return (
    <DashboardLayout
      title="Assistente Institucional"
      subtitle="Base de conhecimento interna do MINAGRIF"
    >
      <PageBreadcrumb items={[{ label: "Assistente Institucional" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        {/* Chat Area */}
        <Card className="lg:col-span-8 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Assistente MINAGRIF</CardTitle>
                  <p className="text-xs text-muted-foreground">Base de conhecimento institucional</p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChat}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
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
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleSend(q.text)}
                    >
                      <q.icon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                      <span className="text-sm">{q.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content || "..."}</div>
                      <div className={cn(
                        "text-[10px] mt-1.5",
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {message.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
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
              <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
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
        </Card>

        {/* Info Panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sobre o Assistente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                O Assistente Institucional é uma ferramenta de inteligência artificial 
                treinada exclusivamente com dados do sistema MINAGRIF.
              </p>
              <p>
                Todas as respostas são baseadas em informação factual e rastreável, 
                incluindo documentos, processos, workflows e metadados do sistema.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Capacidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Pesquisa de documentos e processos",
                "Explicação de procedimentos",
                "Consulta de estados de workflow",
                "Resumo de documentos",
                "Identificação de unidades responsáveis",
                "Pesquisa semântica avançada",
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="text-muted-foreground">{cap}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Nota de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                O assistente respeita as permissões de acesso do utilizador. 
                Informação restrita não será disponibilizada sem autorização adequada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstitutionalAssistant;
