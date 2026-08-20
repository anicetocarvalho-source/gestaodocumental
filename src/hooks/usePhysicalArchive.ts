import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// =============================================
// Tipos
// =============================================

export type LocationType = "deposito" | "sala" | "estante" | "prateleira" | "caixa";
export type PhysicalStatus = "arquivado" | "emprestado" | "em_transito" | "em_falta";
export type PhysicalMovementType = "entrada" | "saida" | "devolucao" | "transferencia" | "arquivo";

export interface StorageLocation {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  location_type: LocationType;
  parent_id: string | null;
  level: number;
  path: string | null;
  capacity: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageLocationNode extends StorageLocation {
  children: StorageLocationNode[];
}

export interface DocumentLocation {
  id: string;
  document_id: string;
  location_id: string | null;
  physical_status: PhysicalStatus;
  placed_at: string;
  notes: string | null;
  location?: StorageLocation | null;
  document?: {
    id: string;
    entry_number: string;
    title: string;
    status: string;
  } | null;
}

export interface PhysicalMovement {
  id: string;
  document_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  movement_type: PhysicalMovementType;
  to_user_id: string | null;
  reason: string | null;
  notes: string | null;
  scanned_qr: boolean;
  performed_by: string | null;
  created_at: string;
  from_location?: { id: string; code: string; name: string; path: string | null } | null;
  to_location?: { id: string; code: string; name: string; path: string | null } | null;
  document?: { id: string; entry_number: string; title: string } | null;
}

export interface DocumentLoan {
  id: string;
  document_id: string;
  borrower_user_id: string | null;
  borrower_unit_id: string | null;
  borrower_name: string | null;
  reason: string | null;
  due_date: string;
  status: "activo" | "devolvido";
  origin_location_id: string | null;
  returned_location_id: string | null;
  return_notes: string | null;
  loaned_at: string;
  returned_at: string | null;
  document?: { id: string; entry_number: string; title: string } | null;
  origin_location?: { id: string; code: string; name: string; path: string | null } | null;
}

export const locationTypeLabels: Record<LocationType, string> = {
  deposito: "Depósito",
  sala: "Sala",
  estante: "Estante",
  prateleira: "Prateleira",
  caixa: "Caixa/Pasta",
};

export const locationTypeOrder: LocationType[] = [
  "deposito",
  "sala",
  "estante",
  "prateleira",
  "caixa",
];

export const physicalStatusLabels: Record<PhysicalStatus, string> = {
  arquivado: "Arquivado",
  emprestado: "Emprestado",
  em_transito: "Em trânsito",
  em_falta: "Em falta",
};

export const movementTypeLabels: Record<PhysicalMovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  devolucao: "Devolução",
  transferencia: "Transferência",
  arquivo: "Arquivo",
};

// =============================================
// Localizações
// =============================================

export function useStorageLocations(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ["storage-locations", options?.activeOnly ?? true],
    queryFn: async (): Promise<StorageLocation[]> => {
      let query = supabase.from("storage_locations").select("*").order("code");
      if (options?.activeOnly !== false) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StorageLocation[];
    },
  });
}

export function buildLocationTree(locations: StorageLocation[]): StorageLocationNode[] {
  const map = new Map<string, StorageLocationNode>();
  locations.forEach((l) => map.set(l.id, { ...l, children: [] }));
  const roots: StorageLocationNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function useCreateStorageLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      location_type: LocationType;
      parent_id?: string | null;
      capacity?: number | null;
      notes?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userData.user!.id)
        .maybeSingle();

      const { data: code, error: codeError } = await supabase.rpc("get_next_location_code", {
        org_id: profile?.organization_id as string,
        ltype: input.location_type,
      });
      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from("storage_locations")
        .insert({
          code: code as string,
          name: input.name,
          location_type: input.location_type,
          parent_id: input.parent_id || null,
          capacity: input.capacity ?? null,
          notes: input.notes ?? null,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as StorageLocation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["storage-locations"] }),
  });
}

export function useUpdateStorageLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<Pick<StorageLocation, "name" | "capacity" | "notes" | "is_active" | "parent_id">>) => {
      const { error } = await supabase.from("storage_locations").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["storage-locations"] }),
  });
}

export function useDeleteStorageLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("storage_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["storage-locations"] }),
  });
}

// Ocupação por localização
export function useLocationOccupancy() {
  return useQuery({
    queryKey: ["location-occupancy"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("document_locations")
        .select("location_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        if (row.location_id) counts[row.location_id] = (counts[row.location_id] || 0) + 1;
      });
      return counts;
    },
  });
}

// =============================================
// Localização de documentos
// =============================================

export function useDocumentLocation(documentId: string | undefined) {
  return useQuery({
    queryKey: ["document-location", documentId],
    enabled: !!documentId,
    queryFn: async (): Promise<DocumentLocation | null> => {
      const { data, error } = await supabase
        .from("document_locations")
        .select("*, location:storage_locations(*)")
        .eq("document_id", documentId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DocumentLocation | null;
    },
  });
}

export function useDocumentLocations(filters?: { locationId?: string; search?: string }) {
  return useQuery({
    queryKey: ["document-locations", filters],
    queryFn: async (): Promise<DocumentLocation[]> => {
      let query = supabase
        .from("document_locations")
        .select("*, location:storage_locations(*), document:documents(id, entry_number, title, status)")
        .order("placed_at", { ascending: false })
        .limit(200);
      if (filters?.locationId) query = query.eq("location_id", filters.locationId);
      const { data, error } = await query;
      if (error) throw error;
      let rows = (data ?? []) as unknown as DocumentLocation[];
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.document?.entry_number?.toLowerCase().includes(s) ||
            r.document?.title?.toLowerCase().includes(s) ||
            r.location?.code?.toLowerCase().includes(s),
        );
      }
      return rows;
    },
  });
}

/**
 * Regista um movimento físico e actualiza a posição actual do documento.
 */
export function useRegisterPhysicalMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      document_id: string;
      movement_type: PhysicalMovementType;
      to_location_id?: string | null;
      to_user_id?: string | null;
      reason?: string | null;
      notes?: string | null;
      scanned_qr?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data: current } = await supabase
        .from("document_locations")
        .select("*")
        .eq("document_id", input.document_id)
        .maybeSingle();

      const fromLocationId = current?.location_id ?? null;

      const { error: movError } = await supabase.from("physical_movements").insert({
        document_id: input.document_id,
        from_location_id: fromLocationId,
        to_location_id: input.to_location_id ?? null,
        movement_type: input.movement_type,
        to_user_id: input.to_user_id ?? null,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        scanned_qr: input.scanned_qr ?? false,
        performed_by: userId,
      });
      if (movError) throw movError;

      const nextStatus: PhysicalStatus =
        input.movement_type === "saida"
          ? "emprestado"
          : input.movement_type === "transferencia"
            ? "em_transito"
            : "arquivado";

      const nextLocation =
        input.movement_type === "saida" ? fromLocationId : (input.to_location_id ?? fromLocationId);

      if (current) {
        const { error } = await supabase
          .from("document_locations")
          .update({
            location_id: nextLocation,
            physical_status: nextStatus,
            placed_by: userId,
            placed_at: new Date().toISOString(),
            notes: input.notes ?? current.notes,
          })
          .eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("document_locations").insert({
          document_id: input.document_id,
          location_id: nextLocation,
          physical_status: nextStatus,
          placed_by: userId,
          notes: input.notes ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-location"] });
      qc.invalidateQueries({ queryKey: ["document-locations"] });
      qc.invalidateQueries({ queryKey: ["physical-movements"] });
      qc.invalidateQueries({ queryKey: ["location-occupancy"] });
      qc.invalidateQueries({ queryKey: ["document-loans"] });
    },
  });
}

export function usePhysicalMovements(filters?: {
  documentId?: string;
  movementType?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  scannedOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["physical-movements", filters],
    queryFn: async (): Promise<PhysicalMovement[]> => {
      let query = supabase
        .from("physical_movements")
        .select(
          `*,
           from_location:storage_locations!physical_movements_from_location_id_fkey(id, code, name, path),
           to_location:storage_locations!physical_movements_to_location_id_fkey(id, code, name, path),
           document:documents(id, entry_number, title)`,
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (filters?.documentId) query = query.eq("document_id", filters.documentId);
      if (filters?.movementType) query = query.eq("movement_type", filters.movementType);
      if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters?.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
      if (filters?.scannedOnly) query = query.eq("scanned_qr", true);
      if (filters?.locationId)
        query = query.or(
          `from_location_id.eq.${filters.locationId},to_location_id.eq.${filters.locationId}`,
        );

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as PhysicalMovement[];
    },
  });
}

// =============================================
// Empréstimos
// =============================================

export function useDocumentLoans(filters?: { status?: "activo" | "devolvido"; overdueOnly?: boolean }) {
  return useQuery({
    queryKey: ["document-loans", filters],
    queryFn: async (): Promise<DocumentLoan[]> => {
      let query = supabase
        .from("document_loans")
        .select(
          `*, document:documents(id, entry_number, title),
           origin_location:storage_locations!document_loans_origin_location_id_fkey(id, code, name, path)`,
        )
        .order("due_date", { ascending: true })
        .limit(200);
      if (filters?.status) query = query.eq("status", filters.status);
      const { data, error } = await query;
      if (error) throw error;
      let rows = (data ?? []) as unknown as DocumentLoan[];
      if (filters?.overdueOnly) {
        const today = new Date().toISOString().slice(0, 10);
        rows = rows.filter((r) => r.status === "activo" && r.due_date < today);
      }
      return rows;
    },
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  const registerMovement = useRegisterPhysicalMovement();
  return useMutation({
    mutationFn: async (input: {
      document_id: string;
      borrower_user_id?: string | null;
      borrower_unit_id?: string | null;
      borrower_name?: string | null;
      reason?: string | null;
      due_date: string;
      scanned_qr?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: current } = await supabase
        .from("document_locations")
        .select("location_id")
        .eq("document_id", input.document_id)
        .maybeSingle();

      const { error } = await supabase.from("document_loans").insert({
        document_id: input.document_id,
        borrower_user_id: input.borrower_user_id ?? null,
        borrower_unit_id: input.borrower_unit_id ?? null,
        borrower_name: input.borrower_name ?? null,
        reason: input.reason ?? null,
        due_date: input.due_date,
        origin_location_id: current?.location_id ?? null,
        loaned_by: userData.user?.id,
      });
      if (error) throw error;

      await registerMovement.mutateAsync({
        document_id: input.document_id,
        movement_type: "saida",
        to_user_id: input.borrower_user_id ?? null,
        reason: input.reason ?? null,
        scanned_qr: input.scanned_qr,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-loans"] });
      qc.invalidateQueries({ queryKey: ["document-locations"] });
    },
  });
}

export function useReturnLoan() {
  const qc = useQueryClient();
  const registerMovement = useRegisterPhysicalMovement();
  return useMutation({
    mutationFn: async (input: {
      loan_id: string;
      document_id: string;
      returned_location_id: string | null;
      return_notes?: string | null;
      scanned_qr?: boolean;
    }) => {
      const { error } = await supabase
        .from("document_loans")
        .update({
          status: "devolvido",
          returned_at: new Date().toISOString(),
          returned_location_id: input.returned_location_id,
          return_notes: input.return_notes ?? null,
        })
        .eq("id", input.loan_id);
      if (error) throw error;

      await registerMovement.mutateAsync({
        document_id: input.document_id,
        movement_type: "devolucao",
        to_location_id: input.returned_location_id,
        notes: input.return_notes ?? null,
        scanned_qr: input.scanned_qr,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-loans"] });
      qc.invalidateQueries({ queryKey: ["document-locations"] });
    },
  });
}

// =============================================
// Pesquisa rápida por código / QR
// =============================================

export interface ScanLookupResult {
  kind: "document" | "location" | "none";
  document?: {
    id: string;
    entry_number: string;
    title: string;
    status: string;
  };
  location?: StorageLocation;
  currentLocation?: StorageLocation | null;
  physicalStatus?: PhysicalStatus | null;
  activeLoan?: DocumentLoan | null;
}

/**
 * Resolve um código lido (QR/manual): pode ser código de localização,
 * número de entrada do documento, URL de validação ou UUID.
 */
export async function lookupScannedCode(raw: string): Promise<ScanLookupResult> {
  const code = raw.trim();
  if (!code) return { kind: "none" };

  // Extrai o último segmento se for URL
  const value = code.includes("/") ? code.split("/").filter(Boolean).pop()! : code;

  // 1) Localização por código
  const { data: loc } = await supabase
    .from("storage_locations")
    .select("*")
    .eq("code", value.toUpperCase())
    .maybeSingle();
  if (loc) return { kind: "location", location: loc as StorageLocation };

  // 2) Documento por entry_number
  const { data: doc } = await supabase
    .from("documents")
    .select("id, entry_number, title, status")
    .eq("entry_number", value.toUpperCase())
    .maybeSingle();

  if (doc) {
    const { data: dl } = await supabase
      .from("document_locations")
      .select("*, location:storage_locations(*)")
      .eq("document_id", doc.id)
      .maybeSingle();
    const { data: loan } = await supabase
      .from("document_loans")
      .select("*")
      .eq("document_id", doc.id)
      .eq("status", "activo")
      .maybeSingle();
    return {
      kind: "document",
      document: doc,
      currentLocation: (dl as unknown as DocumentLocation | null)?.location ?? null,
      physicalStatus: (dl?.physical_status as PhysicalStatus) ?? null,
      activeLoan: (loan as unknown as DocumentLoan) ?? null,
    };
  }

  return { kind: "none" };
}
