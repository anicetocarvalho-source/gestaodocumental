import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TraceCategory =
  | "movimentacao"
  | "entrada_saida"
  | "devolucao"
  | "metadados";

export interface TraceEvent {
  id: string;
  category: TraceCategory;
  action: string;
  title: string;
  description: string;
  documentId?: string | null;
  reference?: string | null;
  actorId?: string | null;
  actorName?: string;
  createdAt: string;
  scannedQr?: boolean;
  changes?: { field: string; from: unknown; to: unknown }[];
  raw?: Record<string, unknown>;
}

export interface TraceabilityFilters {
  categories?: TraceCategory[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  documentId?: string;
}

const IGNORED_META_FIELDS = new Set(["updated_at", "created_at"]);

function diffJson(oldData: any, newData: any) {
  const changes: { field: string; from: unknown; to: unknown }[] = [];
  if (!newData || typeof newData !== "object") return changes;
  const keys = new Set([
    ...Object.keys(oldData && typeof oldData === "object" ? oldData : {}),
    ...Object.keys(newData),
  ]);
  keys.forEach((key) => {
    if (IGNORED_META_FIELDS.has(key)) return;
    const from = oldData?.[key];
    const to = newData?.[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field: key, from, to });
    }
  });
  return changes;
}

const MOVEMENT_LABELS: Record<string, string> = {
  despacho: "Despacho",
  dispatch: "Despacho",
  encaminhamento: "Encaminhamento",
  forward: "Encaminhamento",
  recebimento: "Recebimento",
  receive: "Recebimento",
  devolucao: "Devolução",
  return: "Devolução",
  arquivamento: "Arquivamento",
  archive: "Arquivamento",
  transferencia: "Transferência",
  emprestimo: "Empréstimo",
  entrada: "Entrada",
  saida: "Saída",
};

const label = (value?: string | null) =>
  (value && (MOVEMENT_LABELS[value] || value)) || "—";

export function useTraceability(filters: TraceabilityFilters = {}) {
  return useQuery({
    queryKey: ["traceability", filters],
    queryFn: async (): Promise<TraceEvent[]> => {
      const from = filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined;
      const to = filters.dateTo
        ? new Date(new Date(filters.dateTo).setHours(23, 59, 59, 999)).toISOString()
        : undefined;

      const applyRange = (q: any, column = "created_at") => {
        let query = q;
        if (from) query = query.gte(column, from);
        if (to) query = query.lte(column, to);
        return query;
      };

      let docMovQ = supabase
        .from("document_movements")
        .select("id, document_id, action_type, dispatch_text, notes, created_at, from_user_id, to_user_id")
        .order("created_at", { ascending: false })
        .limit(300);
      let physMovQ = supabase
        .from("physical_movements")
        .select("id, document_id, movement_type, reason, notes, scanned_qr, performed_by, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      let protocolQ = supabase
        .from("protocol_entries")
        .select("id, protocol_number, direction, subject, sender_name, recipient_name, document_id, registered_by, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      let loansQ = supabase
        .from("document_loans")
        .select("id, document_id, borrower_name, status, reason, return_notes, loaned_at, returned_at, due_date, loaned_by, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      let auditQ = supabase
        .from("audit_log")
        .select("id, table_name, record_id, action, old_data, new_data, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(400);
      let docAuditQ = supabase
        .from("document_audit_log")
        .select("id, document_id, action, description, old_values, new_values, performed_by, created_at")
        .order("created_at", { ascending: false })
        .limit(400);

      if (filters.documentId) {
        docMovQ = docMovQ.eq("document_id", filters.documentId);
        physMovQ = physMovQ.eq("document_id", filters.documentId);
        protocolQ = protocolQ.eq("document_id", filters.documentId);
        loansQ = loansQ.eq("document_id", filters.documentId);
        docAuditQ = docAuditQ.eq("document_id", filters.documentId);
        auditQ = auditQ.eq("record_id", filters.documentId);
      }

      const [docMov, physMov, protocol, loans, audit, docAudit] = await Promise.all([
        applyRange(docMovQ),
        applyRange(physMovQ),
        applyRange(protocolQ),
        applyRange(loansQ),
        applyRange(auditQ),
        applyRange(docAuditQ),
      ]);

      const events: TraceEvent[] = [];
      const actorIds = new Set<string>();
      const documentIds = new Set<string>();

      const track = (actor?: string | null, doc?: string | null) => {
        if (actor) actorIds.add(actor);
        if (doc) documentIds.add(doc);
      };

      (docMov.data || []).forEach((m: any) => {
        track(m.to_user_id || m.from_user_id, m.document_id);
        events.push({
          id: `dm-${m.id}`,
          category: "movimentacao",
          action: m.action_type,
          title: `Movimentação: ${label(m.action_type)}`,
          description: m.dispatch_text || m.notes || "Tramitação interna do documento",
          documentId: m.document_id,
          actorId: m.from_user_id || m.to_user_id,
          createdAt: m.created_at,
          raw: m,
        });
      });

      (physMov.data || []).forEach((m: any) => {
        track(m.performed_by, m.document_id);
        events.push({
          id: `pm-${m.id}`,
          category: "movimentacao",
          action: m.movement_type,
          title: `Movimento físico: ${label(m.movement_type)}`,
          description: m.reason || m.notes || "Movimento no arquivo físico",
          documentId: m.document_id,
          actorId: m.performed_by,
          createdAt: m.created_at,
          scannedQr: !!m.scanned_qr,
          raw: m,
        });
      });

      (protocol.data || []).forEach((p: any) => {
        track(p.registered_by, p.document_id);
        events.push({
          id: `pe-${p.id}`,
          category: "entrada_saida",
          action: p.direction,
          title: `${p.direction === "entrada" ? "Entrada" : "Saída"}: ${p.protocol_number}`,
          description: [
            p.subject,
            p.direction === "entrada"
              ? p.sender_name && `Remetente: ${p.sender_name}`
              : p.recipient_name && `Destinatário: ${p.recipient_name}`,
          ]
            .filter(Boolean)
            .join(" · "),
          reference: p.protocol_number,
          documentId: p.document_id,
          actorId: p.registered_by,
          createdAt: p.created_at,
          raw: p,
        });
      });

      (loans.data || []).forEach((l: any) => {
        track(l.loaned_by, l.document_id);
        events.push({
          id: `dl-out-${l.id}`,
          category: "entrada_saida",
          action: "emprestimo",
          title: "Saída por empréstimo",
          description: `Requisitante: ${l.borrower_name || "—"}${l.reason ? ` · ${l.reason}` : ""}`,
          documentId: l.document_id,
          actorId: l.loaned_by,
          createdAt: l.loaned_at || l.created_at,
          raw: l,
        });
        if (l.returned_at) {
          events.push({
            id: `dl-ret-${l.id}`,
            category: "devolucao",
            action: "devolucao",
            title: "Devolução de documento",
            description: `Devolvido por ${l.borrower_name || "—"}${
              l.return_notes ? ` · ${l.return_notes}` : ""
            }`,
            documentId: l.document_id,
            actorId: l.loaned_by,
            createdAt: l.returned_at,
            raw: l,
          });
        }
      });

      (docAudit.data || []).forEach((a: any) => {
        track(a.performed_by, a.document_id);
        const changes = diffJson(a.old_values, a.new_values);
        const isReturn = String(a.action).includes("devol");
        events.push({
          id: `da-${a.id}`,
          category: isReturn ? "devolucao" : "metadados",
          action: a.action,
          title: isReturn ? "Devolução registada" : `Alteração de metadados (${a.action})`,
          description: a.description || `${changes.length} campo(s) alterado(s)`,
          documentId: a.document_id,
          actorId: a.performed_by,
          createdAt: a.created_at,
          changes,
          raw: a,
        });
      });

      (audit.data || []).forEach((a: any) => {
        track(a.user_id, null);
        const changes = diffJson(a.old_data, a.new_data);
        events.push({
          id: `al-${a.id}`,
          category: "metadados",
          action: a.action,
          title: `${a.action} em ${a.table_name}`,
          description:
            changes.length > 0
              ? `Campos alterados: ${changes.slice(0, 4).map((c) => c.field).join(", ")}${
                  changes.length > 4 ? "…" : ""
                }`
              : "Registo de auditoria do sistema",
          reference: a.table_name,
          actorId: a.user_id,
          createdAt: a.created_at,
          changes,
          raw: a,
        });
      });

      // Resolve actor names and document references
      const [profilesRes, docsRes] = await Promise.all([
        actorIds.size
          ? supabase.from("profiles").select("user_id, full_name").in("user_id", Array.from(actorIds))
          : Promise.resolve({ data: [] as any[] }),
        documentIds.size
          ? supabase
              .from("documents")
              .select("id, entry_number, title")
              .in("id", Array.from(documentIds))
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const nameMap = new Map<string, string>(
        (profilesRes.data || []).map((p: any) => [p.user_id, p.full_name])
      );
      const docMap = new Map<string, string>(
        (docsRes.data || []).map((d: any) => [d.id, d.entry_number || d.title])
      );

      let result = events.map((e) => ({
        ...e,
        actorName: (e.actorId && nameMap.get(e.actorId)) || "Sistema",
        reference: e.reference || (e.documentId ? docMap.get(e.documentId) : null) || null,
      }));

      if (filters.categories?.length) {
        result = result.filter((e) => filters.categories!.includes(e.category));
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter((e) =>
          [e.title, e.description, e.reference, e.actorName, e.action]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        );
      }

      return result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  });
}
