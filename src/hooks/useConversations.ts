import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (error) {
      console.error("Erro ao carregar conversas:", error);
      return;
    }
    
    setConversations(data || []);
  }, [userId]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    setLoading(false);
    
    if (error) {
      console.error("Erro ao carregar mensagens:", error);
      return;
    }
    
    const typedMessages: Message[] = (data || []).map(m => ({
      ...m,
      role: m.role as "user" | "assistant",
    }));
    setMessages(typedMessages);
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (title: string = "Nova Conversa") => {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title })
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar conversa:", error);
      toast.error("Erro ao criar nova conversa");
      return null;
    }
    
    setConversations(prev => [data, ...prev]);
    setCurrentConversation(data);
    setMessages([]);
    return data;
  }, [userId]);

  // Select conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Add message
  const addMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao guardar mensagem:", error);
      return null;
    }
    
    return data;
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(async (
    conversationId: string,
    title: string
  ) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);
    
    if (error) {
      console.error("Erro ao actualizar título:", error);
      return;
    }
    
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, title } : c)
    );
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null);
    }
  }, [currentConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);
    
    if (error) {
      console.error("Erro ao eliminar conversa:", error);
      toast.error("Erro ao eliminar conversa");
      return;
    }
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
    
    toast.success("Conversa eliminada");
  }, [currentConversation]);

  // Clear current conversation (start new)
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    setMessages,
    loading,
    fetchConversations,
    createConversation,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    clearCurrentConversation,
  };
}
