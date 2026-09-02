import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ProtocolStage = "entrada" | "tramitacao" | "despacho" | "arquivado";

export const PROTOCOL_STAGE_LABELS: Record<ProtocolStage, string> = {
  entrada: "Entrada",
  tramitacao: "Tramitação",
  despacho: "Despacho",
  arquivado: "Arquivado",
};

export interface ProtocolFlowEntry {
  id: string;
  protocol_number: string;
  direction: "entrada" | "saida";
  subject: string;
  sender_name: string | null;
  sender_institution: string | null;
  recipient_name: string | null;
  recipient_institution: string | null;
  delivery_method: string | null;
  received_at: string | null;
  sent_at: string | null;
  created_at: string;
  document_id: string | null;
  unit_id: string | null;
  unit: { id: string; name: string } | null;
  document: {
    id: string;
    entry_number: string;
    title: string;
    status: string;
  } | null;
  stage: ProtocolStage;
}

export function deriveStage(documentStatus: string | null | undefined, direction: string): ProtocolStage {
  switch (documentStatus) {
    case "archived":
      return "arquivado";
    case "dispatched":
    case "validated":
      return "despacho";
    case "in_progress":
    case "pending":
      return "tramitacao";
    case "received":
    case "draft":
      return "entrada";
    default:
      return direction === "saida" ? "despacho" : "entrada";
  }
}

export function useProtocolFlowEntries(search?: string) {
  return useQuery({
    queryKey: ["protocol-flow", search ?? ""],
    queryFn: async (): Promise<ProtocolFlowEntry[]> => {
      let query = supabase
        .from("protocol_entries")
        .select(
          `id, protocol_number, direction, subject, sender_name, sender_institution,
           recipient_name, recipient_institution, delivery_method, received_at, sent_at,
           created_at, document_id, unit_id,
           unit:organizational_units!protocol_entries_unit_id_fkey(id, name),
           document:documents!protocol_entries_document_id_fkey(id, entry_number, title, status)`
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
          `subject.ilike.%${s}%,protocol_number.ilike.%${s}%,sender_name.ilike.%${s}%,recipient_name.ilike.%${s}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        stage: deriveStage(row.document?.status, row.direction),
      })) as ProtocolFlowEntry[];
    },
  });
}

export interface ProtocolMovement {
  id: string;
  action_type: string;
  notes: string | null;
  dispatch_text: string | null;
  created_at: string;
  from_unit: { name: string } | null;
  to_unit: { name: string } | null;
  from_user: { full_name: string } | null;
  to_user: { full_name: string } | null;
}

export function useProtocolEntryMovements(documentId: string | null | undefined) {
  return useQuery({
    queryKey: ["protocol-flow-movements", documentId],
    enabled: !!documentId,
    queryFn: async (): Promise<ProtocolMovement[]> => {
      const { data, error } = await supabase
        .from("document_movements")
        .select(
          `id, action_type, notes, dispatch_text, created_at,
           from_unit:organizational_units!document_movements_from_unit_id_fkey(name),
           to_unit:organizational_units!document_movements_to_unit_id_fkey(name),
           from_user:profiles!document_movements_from_user_id_fkey(full_name),
           to_user:profiles!document_movements_to_user_id_fkey(full_name)`
        )
        .eq("document_id", documentId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ProtocolMovement[];
    },
  });
}

type FlowAction = "receive" | "forward" | "dispatch" | "archive";

const ACTION_STATUS: Record<FlowAction, string> = {
  receive: "received",
  forward: "in_progress",
  dispatch: "dispatched",
  archive: "archived",
};

const ACTION_LABEL: Record<FlowAction, string> = {
  receive: "Recepção registada",
  forward: "Documento encaminhado",
  dispatch: "Despacho registado",
  archive: "Documento arquivado",
};

export function useProtocolFlowAction() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      entry,
      action,
      toUnitId,
      notes,
    }: {
      entry: ProtocolFlowEntry;
      action: FlowAction;
      toUnitId?: string | null;
      notes?: string;
    }) => {
      if (!entry.document_id) {
        throw new Error("Este registo de protocolo não tem documento associado.");
      }

      const { error: movementError } = await supabase.from("document_movements").insert({
        document_id: entry.document_id,
        action_type: action,
        from_unit_id: profile?.unit_id ?? null,
        to_unit_id: toUnitId ?? entry.unit_id ?? profile?.unit_id ?? null,
        from_user_id: profile?.id ?? null,
        notes: notes || null,
      });
      if (movementError) throw movementError;

      const { error: docError } = await supabase
        .from("documents")
        .update({ status: ACTION_STATUS[action] })
        .eq("id", entry.document_id);
      if (docError) throw docError;

      return action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["protocol-flow"] });
      queryClient.invalidateQueries({ queryKey: ["protocol-flow-movements"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(ACTION_LABEL[action as FlowAction]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Não foi possível concluir a acção");
    },
  });
}
