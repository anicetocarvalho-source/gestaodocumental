import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type DispatchType = Database["public"]["Enums"]["dispatch_type"];
type DispatchStatus = Database["public"]["Enums"]["dispatch_status"];
type DispatchPriority = Database["public"]["Enums"]["dispatch_priority"];

export interface Dispatch {
  id: string;
  dispatch_number: string;
  dispatch_type: DispatchType;
  subject: string;
  content: string;
  status: DispatchStatus;
  priority: DispatchPriority;
  origin_unit_id: string | null;
  deadline: string | null;
  requires_response: boolean;
  signer_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  emitted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  origin_unit?: { id: string; name: string } | null;
  signer?: { id: string; full_name: string } | null;
  recipients?: DispatchRecipient[];
}

export interface DispatchRecipient {
  id: string;
  dispatch_id: string;
  recipient_type: "unit" | "person";
  unit_id: string | null;
  profile_id: string | null;
  is_read: boolean;
  read_at: string | null;
  unit?: { id: string; name: string } | null;
  profile?: { id: string; full_name: string } | null;
}

export interface CreateDispatchInput {
  dispatch_type: DispatchType;
  subject: string;
  content: string;
  priority?: DispatchPriority;
  origin_unit_id?: string;
  deadline?: string;
  requires_response?: boolean;
  signer_id?: string;
  recipients: Array<{
    type: "unit" | "person";
    unit_id?: string;
    profile_id?: string;
  }>;
  document_ids?: string[];
}

export interface DispatchFilters {
  search?: string;
  dispatch_type?: DispatchType;
  status?: DispatchStatus;
  origin_unit_id?: string;
  created_by?: string;
  date?: string;
}

// Labels for display
export const dispatchTypeLabels: Record<DispatchType, string> = {
  informativo: "Informativo",
  determinativo: "Determinativo",
  autorizativo: "Autorizativo",
  homologativo: "Homologatório",
  decisorio: "Decisório",
};

export const dispatchStatusLabels: Record<DispatchStatus, string> = {
  rascunho: "Rascunho",
  emitido: "Emitido",
  em_tramite: "Em Trâmite",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const dispatchPriorityLabels: Record<DispatchPriority, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export function useDispatches(filters?: DispatchFilters) {
  return useQuery({
    queryKey: ["dispatches", filters],
    queryFn: async () => {
      let query = supabase
        .from("dispatches")
        .select(`
          *,
          origin_unit:organizational_units!origin_unit_id(id, name),
          signer:profiles!signer_id(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.or(
          `dispatch_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
        );
      }
      if (filters?.dispatch_type) {
        query = query.eq("dispatch_type", filters.dispatch_type);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.origin_unit_id) {
        query = query.eq("origin_unit_id", filters.origin_unit_id);
      }
      if (filters?.date) {
        query = query.gte("created_at", `${filters.date}T00:00:00`)
                     .lt("created_at", `${filters.date}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Dispatch[];
    },
  });
}

export function useDispatch(id: string | undefined) {
  return useQuery({
    queryKey: ["dispatch", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("dispatches")
        .select(`
          *,
          origin_unit:organizational_units!origin_unit_id(id, name),
          signer:profiles!signer_id(id, full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch recipients separately
      const { data: recipients, error: recipientsError } = await supabase
        .from("dispatch_recipients")
        .select(`
          *,
          unit:organizational_units!unit_id(id, name),
          profile:profiles!profile_id(id, full_name)
        `)
        .eq("dispatch_id", id);

      if (recipientsError) throw recipientsError;

      return { ...data, recipients } as Dispatch;
    },
    enabled: !!id,
  });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateDispatchInput) => {
      // Create the dispatch
      const { data: dispatch, error: dispatchError } = await supabase
        .from("dispatches")
        .insert({
          dispatch_number: "", // Will be generated by trigger
          dispatch_type: input.dispatch_type,
          subject: input.subject,
          content: input.content,
          priority: input.priority || "normal",
          origin_unit_id: input.origin_unit_id,
          deadline: input.deadline,
          requires_response: input.requires_response || false,
          signer_id: input.signer_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      // Add recipients
      if (input.recipients.length > 0) {
        const recipientsToInsert = input.recipients.map((r) => ({
          dispatch_id: dispatch.id,
          recipient_type: r.type,
          unit_id: r.type === "unit" ? r.unit_id : null,
          profile_id: r.type === "person" ? r.profile_id : null,
        }));

        const { error: recipientsError } = await supabase
          .from("dispatch_recipients")
          .insert(recipientsToInsert);

        if (recipientsError) throw recipientsError;
      }

      // Link documents if provided
      if (input.document_ids && input.document_ids.length > 0) {
        const docsToInsert = input.document_ids.map((docId) => ({
          dispatch_id: dispatch.id,
          document_id: docId,
        }));

        const { error: docsError } = await supabase
          .from("dispatch_documents")
          .insert(docsToInsert);

        if (docsError) throw docsError;
      }

      return dispatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}

export function useUpdateDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Dispatch> & { id: string }) => {
      const { data, error } = await supabase
        .from("dispatches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", data.id] });
    },
  });
}

export function useEmitDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("dispatches")
        .update({
          status: "emitido" as DispatchStatus,
          emitted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", data.id] });
    },
  });
}

export function useCancelDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from("dispatches")
        .update({
          status: "cancelado" as DispatchStatus,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch", data.id] });
    },
  });
}

export function useDispatchStats() {
  return useQuery({
    queryKey: ["dispatch-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispatches")
        .select("status");

      if (error) throw error;

      const stats = {
        total: data.length,
        rascunho: data.filter((d) => d.status === "rascunho").length,
        emitido: data.filter((d) => d.status === "emitido").length,
        em_tramite: data.filter((d) => d.status === "em_tramite").length,
        concluido: data.filter((d) => d.status === "concluido").length,
        cancelado: data.filter((d) => d.status === "cancelado").length,
      };

      return stats;
    },
  });
}
