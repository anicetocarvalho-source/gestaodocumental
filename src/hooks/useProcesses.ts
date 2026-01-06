import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// Types
export interface ProcessType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_sla_days: number;
  requires_approval: boolean;
  is_active: boolean;
}

export interface Process {
  id: string;
  process_number: string;
  process_type_id: string | null;
  subject: string;
  description: string | null;
  status: 'rascunho' | 'em_andamento' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'suspenso' | 'arquivado' | 'concluido';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  origin: string | null;
  requester_name: string | null;
  requester_unit_id: string | null;
  external_requester_info: unknown | null;
  current_unit_id: string | null;
  responsible_user_id: string | null;
  sla_days: number | null;
  deadline: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  process_type?: ProcessType;
  current_unit?: { id: string; name: string; code: string };
  requester_unit?: { id: string; name: string; code: string };
  responsible_user?: { id: string; full_name: string };
}

export interface ProcessStage {
  id: string;
  process_id: string;
  stage_order: number;
  name: string;
  unit_id: string | null;
  assigned_user_id: string | null;
  status: 'pending' | 'current' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  duration_days: number | null;
  created_at: string;
  // Joined data
  unit?: { id: string; name: string };
  assigned_user?: { id: string; full_name: string };
  completed_by_user?: { id: string; full_name: string };
}

export interface ProcessMovement {
  id: string;
  process_id: string;
  action_type: string;
  from_unit_id: string | null;
  to_unit_id: string | null;
  from_user_id: string | null;
  to_user_id: string | null;
  dispatch_text: string | null;
  notes: string | null;
  is_read: boolean;
  read_at: string | null;
  created_by: string | null;
  created_at: string;
  // Joined data
  from_unit?: { id: string; name: string };
  to_unit?: { id: string; name: string };
  from_user?: { id: string; full_name: string };
  to_user?: { id: string; full_name: string };
}

export interface ProcessComment {
  id: string;
  process_id: string;
  author_id: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  author?: { id: string; full_name: string; avatar_url: string | null };
}

export interface ProcessOpinion {
  id: string;
  process_id: string;
  opinion_number: string;
  opinion_type: string;
  author_id: string | null;
  unit_id: string | null;
  summary: string;
  content: string | null;
  decision: string | null;
  created_at: string;
  author?: { id: string; full_name: string };
  unit?: { id: string; name: string };
}

export interface CreateProcessInput {
  process_type_id?: string;
  subject: string;
  description?: string;
  priority?: 'baixa' | 'normal' | 'alta' | 'urgente';
  origin?: string;
  requester_name?: string;
  requester_unit_id?: string;
  current_unit_id?: string;
  sla_days?: number;
  deadline?: string;
  linked_document_ids?: string[];
}

// Fetch process types
export function useProcessTypes() {
  return useQuery({
    queryKey: ['process-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ProcessType[];
    },
  });
}

// Fetch processes with filters
export function useProcesses(filters?: {
  status?: string;
  priority?: string;
  type_id?: string;
  unit_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['processes', filters],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          process_type:process_types(*),
          current_unit:organizational_units!processes_current_unit_id_fkey(id, name, code),
          requester_unit:organizational_units!processes_requester_unit_id_fkey(id, name, code),
          responsible_user:profiles!processes_responsible_user_id_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status as 'rascunho' | 'em_andamento' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'suspenso' | 'arquivado' | 'concluido');
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority as 'baixa' | 'normal' | 'alta' | 'urgente');
      }
      if (filters?.type_id) {
        query = query.eq('process_type_id', filters.type_id);
      }
      if (filters?.unit_id) {
        query = query.eq('current_unit_id', filters.unit_id);
      }
      if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,process_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Process[];
    },
  });
}

// Fetch single process with all related data
export function useProcess(processId: string | undefined) {
  return useQuery({
    queryKey: ['process', processId],
    queryFn: async () => {
      if (!processId) return null;

      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          process_type:process_types(*),
          current_unit:organizational_units!processes_current_unit_id_fkey(id, name, code),
          requester_unit:organizational_units!processes_requester_unit_id_fkey(id, name, code),
          responsible_user:profiles!processes_responsible_user_id_fkey(id, full_name)
        `)
        .eq('id', processId)
        .single();

      if (error) throw error;
      return data as Process;
    },
    enabled: !!processId,
  });
}

// Fetch process stages
export function useProcessStages(processId: string | undefined) {
  return useQuery({
    queryKey: ['process-stages', processId],
    queryFn: async () => {
      if (!processId) return [];

      const { data, error } = await supabase
        .from('process_stages')
        .select(`
          *,
          unit:organizational_units(id, name),
          assigned_user:profiles!process_stages_assigned_user_id_fkey(id, full_name),
          completed_by_user:profiles!process_stages_completed_by_fkey(id, full_name)
        `)
        .eq('process_id', processId)
        .order('stage_order');

      if (error) throw error;
      return data as ProcessStage[];
    },
    enabled: !!processId,
  });
}

// Fetch process movements
export function useProcessMovements(processId: string | undefined) {
  return useQuery({
    queryKey: ['process-movements', processId],
    queryFn: async () => {
      if (!processId) return [];

      const { data, error } = await supabase
        .from('process_movements')
        .select(`
          *,
          from_unit:organizational_units!process_movements_from_unit_id_fkey(id, name),
          to_unit:organizational_units!process_movements_to_unit_id_fkey(id, name),
          from_user:profiles!process_movements_from_user_id_fkey(id, full_name),
          to_user:profiles!process_movements_to_user_id_fkey(id, full_name)
        `)
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProcessMovement[];
    },
    enabled: !!processId,
  });
}

// Fetch process comments
export function useProcessComments(processId: string | undefined) {
  return useQuery({
    queryKey: ['process-comments', processId],
    queryFn: async () => {
      if (!processId) return [];

      const { data, error } = await supabase
        .from('process_comments')
        .select(`
          *,
          author:profiles!process_comments_author_id_fkey(id, full_name, avatar_url)
        `)
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProcessComment[];
    },
    enabled: !!processId,
  });
}

// Fetch process opinions
export function useProcessOpinions(processId: string | undefined) {
  return useQuery({
    queryKey: ['process-opinions', processId],
    queryFn: async () => {
      if (!processId) return [];

      const { data, error } = await supabase
        .from('process_opinions')
        .select(`
          *,
          author:profiles!process_opinions_author_id_fkey(id, full_name),
          unit:organizational_units(id, name)
        `)
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProcessOpinion[];
    },
    enabled: !!processId,
  });
}

// Process statistics
export function useProcessStats() {
  return useQuery({
    queryKey: ['process-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select('status, priority, deadline');

      if (error) throw error;

      const now = new Date();
      const processData = data as Array<{ status: string; priority: string; deadline: string | null }>;
      const stats = {
        total: processData.length,
        em_andamento: processData.filter(p => p.status === 'em_andamento').length,
        aguardando_aprovacao: processData.filter(p => p.status === 'aguardando_aprovacao').length,
        urgentes: processData.filter(p => p.priority === 'urgente').length,
        atrasados: processData.filter(p => p.deadline && new Date(p.deadline) < now && p.status !== 'concluido' && p.status !== 'arquivado').length,
        concluidos: processData.filter(p => p.status === 'concluido').length,
      };

      return stats;
    },
  });
}

// Create process
export function useCreateProcess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateProcessInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const insertData = {
        process_type_id: input.process_type_id || null,
        subject: input.subject,
        description: input.description || null,
        priority: (input.priority || 'normal') as 'baixa' | 'normal' | 'alta' | 'urgente',
        origin: input.origin || 'interno',
        requester_name: input.requester_name || null,
        requester_unit_id: input.requester_unit_id || null,
        current_unit_id: input.current_unit_id || null,
        sla_days: input.sla_days || null,
        deadline: input.deadline || null,
        created_by: user.id,
        process_number: '', // Will be generated by trigger
      };

      const { data, error } = await supabase
        .from('processes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Link documents if provided
      if (input.linked_document_ids && input.linked_document_ids.length > 0) {
        const documentLinks = input.linked_document_ids.map(docId => ({
          process_id: data.id,
          document_id: docId,
        }));

        const { error: linkError } = await supabase
          .from('process_documents')
          .insert(documentLinks);

        if (linkError) {
          console.error('Error linking documents:', linkError);
          // Don't throw - process was created successfully
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process-stats'] });
      toast({
        title: "Processo criado",
        description: "O processo foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar processo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update process
export function useUpdateProcess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, priority, subject, description, current_unit_id, responsible_user_id, deadline }: { 
      id: string;
      status?: string;
      priority?: string;
      subject?: string;
      description?: string;
      current_unit_id?: string;
      responsible_user_id?: string;
      deadline?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (subject) updates.subject = subject;
      if (description !== undefined) updates.description = description;
      if (current_unit_id) updates.current_unit_id = current_unit_id;
      if (responsible_user_id) updates.responsible_user_id = responsible_user_id;
      if (deadline) updates.deadline = deadline;

      const { data, error } = await supabase
        .from('processes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['process-stats'] });
      toast({
        title: "Processo actualizado",
        description: "O processo foi actualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao actualizar processo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Start process (change from draft to in progress)
export function useStartProcess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (processId: string) => {
      const { data, error } = await supabase
        .from('processes')
        .update({
          status: 'em_andamento',
          started_at: new Date().toISOString(),
        })
        .eq('id', processId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, processId) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process', processId] });
      queryClient.invalidateQueries({ queryKey: ['process-stats'] });
      toast({
        title: "Processo iniciado",
        description: "O processo foi iniciado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar processo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Create process movement
export function useCreateProcessMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      process_id: string;
      action_type: string;
      to_unit_id?: string;
      to_user_id?: string;
      dispatch_text?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get current user's profile to get from_unit
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, unit_id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('process_movements')
        .insert({
          ...input,
          from_unit_id: profile?.unit_id,
          from_user_id: profile?.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update process current_unit if encaminhamento
      if (input.to_unit_id && (input.action_type === 'encaminhamento' || input.action_type === 'despacho')) {
        await supabase
          .from('processes')
          .update({ 
            current_unit_id: input.to_unit_id,
            responsible_user_id: input.to_user_id || null,
          })
          .eq('id', input.process_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.process_id] });
      queryClient.invalidateQueries({ queryKey: ['process-movements', variables.process_id] });
      toast({
        title: "Movimentação registada",
        description: "A movimentação foi registada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registar movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Add comment
export function useAddProcessComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      process_id: string;
      content: string;
      is_internal?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('process_comments')
        .insert({
          ...input,
          author_id: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-comments', variables.process_id] });
      toast({
        title: "Comentário adicionado",
        description: "O seu comentário foi adicionado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Add opinion/parecer
export function useAddProcessOpinion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      process_id: string;
      opinion_type: string;
      summary: string;
      content?: string;
      decision?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, unit_id')
        .eq('user_id', user.id)
        .single();

      // Generate opinion number
      const year = new Date().getFullYear();
      const prefix = input.opinion_type === 'parecer_tecnico' ? 'PAR-TEC' 
                   : input.opinion_type === 'parecer_juridico' ? 'PAR-JUR'
                   : 'DESP';
      
      const { count } = await supabase
        .from('process_opinions')
        .select('*', { count: 'exact', head: true })
        .ilike('opinion_number', `${prefix}-${year}-%`);
      
      const opinionNumber = `${prefix}-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      const { data, error } = await supabase
        .from('process_opinions')
        .insert({
          ...input,
          opinion_number: opinionNumber,
          author_id: profile?.id,
          unit_id: profile?.unit_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-opinions', variables.process_id] });
      toast({
        title: "Parecer adicionado",
        description: "O parecer foi registado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar parecer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Realtime subscription for processes
export function useRealtimeProcesses() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('processes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'processes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['processes'] });
          queryClient.invalidateQueries({ queryKey: ['process-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'process_movements' },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'process_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['process-movements', payload.new.process_id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
