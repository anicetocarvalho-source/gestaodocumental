import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DecisionRow {
  id: string;
  dispatch_number: string;
  subject: string;
  dispatch_type: string;
  status: string;
  priority: string;
  workflow_status: string | null;
  deadline: string | null;
  created_at: string;
  origin_unit: { id: string; name: string } | null;
  documents: { id: string; entry_number: string; status: string }[];
  protocols: { id: string; protocol_number: string; direction: string; subject: string }[];
  deadlineState: "sem_prazo" | "atrasado" | "urgente" | "no_prazo" | "concluido";
  daysLeft: number | null;
}

export interface DecisionsDashboard {
  rows: DecisionRow[];
  total: number;
  emTramite: number;
  atrasados: number;
  urgentes: number;
  concluidos: number;
  aguardaAprovacao: number;
  byStatus: { key: string; label: string; count: number }[];
  byProtocolStage: { key: string; label: string; count: number }[];
}

export const DISPATCH_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  emitido: "Emitido",
  em_tramite: "Em trâmite",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const PROTOCOL_STAGE_FROM_DOC: Record<string, string> = {
  draft: "Entrada",
  received: "Entrada",
  in_progress: "Tramitação",
  pending: "Tramitação",
  dispatched: "Despacho",
  validated: "Despacho",
  archived: "Arquivado",
  rejected: "Rejeitado",
};

export function useDispatchDecisions() {
  return useQuery({
    queryKey: ["dispatch-decisions"],
    staleTime: 30000,
    queryFn: async (): Promise<DecisionsDashboard> => {
      const { data: dispatches, error } = await supabase
        .from("dispatches")
        .select(
          `id, dispatch_number, subject, dispatch_type, status, priority, workflow_status,
           deadline, created_at,
           origin_unit:organizational_units!dispatches_origin_unit_id_fkey(id, name)`
        )
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;

      const ids = (dispatches || []).map((d: any) => d.id);
      let links: any[] = [];
      let protocols: any[] = [];

      if (ids.length) {
        const { data: linkRows, error: linkError } = await supabase
          .from("dispatch_documents")
          .select(
            `dispatch_id, document:documents!dispatch_documents_document_id_fkey(id, entry_number, status)`
          )
          .in("dispatch_id", ids);
        if (linkError) throw linkError;
        links = linkRows || [];

        const docIds = links.map((l) => l.document?.id).filter(Boolean);
        if (docIds.length) {
          const { data: protoRows, error: protoError } = await supabase
            .from("protocol_entries")
            .select("id, protocol_number, direction, subject, document_id")
            .in("document_id", docIds);
          if (protoError) throw protoError;
          protocols = protoRows || [];
        }
      }

      const now = Date.now();
      const rows: DecisionRow[] = (dispatches || []).map((d: any) => {
        const docs = links
          .filter((l) => l.dispatch_id === d.id && l.document)
          .map((l) => l.document);
        const docIds = docs.map((doc: any) => doc.id);
        const protos = protocols.filter((p) => docIds.includes(p.document_id));

        const closed = d.status === "concluido" || d.status === "cancelado";
        let deadlineState: DecisionRow["deadlineState"] = "sem_prazo";
        let daysLeft: number | null = null;

        if (closed) {
          deadlineState = "concluido";
        } else if (d.deadline) {
          daysLeft = Math.ceil((new Date(d.deadline).getTime() - now) / 86400000);
          deadlineState = daysLeft < 0 ? "atrasado" : daysLeft <= 3 ? "urgente" : "no_prazo";
        }

        return {
          ...d,
          documents: docs,
          protocols: protos,
          deadlineState,
          daysLeft,
        } as DecisionRow;
      });

      const statusCounts = new Map<string, number>();
      const stageCounts = new Map<string, number>();
      rows.forEach((r) => {
        statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1);
        r.documents.forEach((doc) => {
          const stage = PROTOCOL_STAGE_FROM_DOC[doc.status] || "Outro";
          stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
        });
      });

      return {
        rows,
        total: rows.length,
        emTramite: rows.filter((r) => r.status === "emitido" || r.status === "em_tramite").length,
        atrasados: rows.filter((r) => r.deadlineState === "atrasado").length,
        urgentes: rows.filter((r) => r.deadlineState === "urgente").length,
        concluidos: rows.filter((r) => r.status === "concluido").length,
        aguardaAprovacao: rows.filter((r) => r.workflow_status === "em_aprovacao").length,
        byStatus: Array.from(statusCounts.entries()).map(([key, count]) => ({
          key,
          label: DISPATCH_STATUS_LABELS[key] || key,
          count,
        })),
        byProtocolStage: Array.from(stageCounts.entries()).map(([key, count]) => ({
          key,
          label: key,
          count,
        })),
      };
    },
  });
}
