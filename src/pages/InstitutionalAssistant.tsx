import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bot, RefreshCw, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConversations, Message } from "@/hooks/useConversations";
import { ConversationList } from "@/components/assistant/ConversationList";
import { ChatArea } from "@/components/assistant/ChatArea";
import { ExportConversation } from "@/components/assistant/ExportConversation";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/minagrif-assistant`;

const InstitutionalAssistant = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const {
    conversations,
    currentConversation,
    messages,
    setMessages,
    createConversation,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    clearCurrentConversation,
  } = useConversations(userId);

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

    setStreamingContent("");

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
            setStreamingContent(assistantContent);
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
            setStreamingContent(assistantContent);
          }
        } catch { /* ignore */ }
      }
    }

    setStreamingContent("");
    return assistantContent;
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput("");
    setIsLoading(true);

    try {
      let conversationId = currentConversation?.id;

      // Create conversation if needed (only for logged in users)
      if (!conversationId && userId) {
        const newConv = await createConversation(messageText.slice(0, 50));
        if (!newConv) {
          throw new Error("Erro ao criar conversa");
        }
        conversationId = newConv.id;
      }

      // Create temporary user message for display
      const tempUserMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || "",
        role: "user",
        content: messageText,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, tempUserMessage]);

      // Save user message to DB if logged in
      if (userId && conversationId) {
        await addMessage(conversationId, "user", messageText);
      }

      // Build chat history
      const chatHistory = [...messages, tempUserMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Stream response
      const assistantContent = await streamChat(chatHistory);

      // Create assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || "",
        role: "assistant",
        content: assistantContent,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to DB if logged in
      if (userId && conversationId) {
        await addMessage(conversationId, "assistant", assistantContent);
        
        // Update title if first message
        if (messages.length === 0) {
          await updateConversationTitle(conversationId, messageText.slice(0, 50));
        }
      }
    } catch (error) {
      console.error("Erro no chat:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar a mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    clearCurrentConversation();
  };

  const handleFeedback = (messageId: string, positive: boolean) => {
    // Could save to database in the future
    console.log("Feedback:", messageId, positive);
  };

  return (
    <DashboardLayout
      title="Assistente Institucional"
      subtitle="Base de conhecimento interna do MINAGRIF"
    >
      <PageBreadcrumb items={[{ label: "Assistente Institucional" }]} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar - Conversation History */}
        {userId && (
          <Card className="lg:col-span-3 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border py-3 shrink-0">
              <CardTitle className="text-sm">Histórico</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelect={selectConversation}
                onNew={handleNewConversation}
                onDelete={deleteConversation}
              />
            </div>
          </Card>
        )}

        {/* Chat Area */}
        <Card className={`${userId ? 'lg:col-span-6' : 'lg:col-span-8'} flex flex-col overflow-hidden`}>
          <CardHeader className="border-b border-border py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Assistente MINAGRIF</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {currentConversation?.title || "Base de conhecimento institucional"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExportConversation 
                  messages={messages} 
                  conversationTitle={currentConversation?.title}
                />
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleNewConversation}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nova
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <div className="flex-1 overflow-hidden">
            <ChatArea
              messages={messages}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              onSend={handleSend}
              streamingContent={streamingContent}
              onFeedback={handleFeedback}
            />
          </div>
        </Card>

        {/* Info Panel */}
        <div className="lg:col-span-3 space-y-4">
          {!userId && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Iniciar Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Inicie sessão para guardar o histórico das suas conversas.
                </p>
                <Button size="sm" className="w-full" onClick={() => window.location.href = "/auth"}>
                  Iniciar Sessão
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sobre o Assistente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                O Assistente Institucional é uma ferramenta de inteligência artificial 
                treinada exclusivamente com dados do sistema MINAGRIF.
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
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="text-muted-foreground">{cap}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstitutionalAssistant;
