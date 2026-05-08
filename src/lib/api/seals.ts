import { supabase } from "@/integrations/supabase/client";

export type ProtocolType = "ENT" | "SAI" | "INT";
export type ProtocolFilter = ProtocolType | "ALL";
export type SealStatus = "active" | "cancelled";
export type MovementType = "initial" | "handoff" | "archive" | "return";

export interface Seal {
  id: string;
  organization_id: string;
  protocol_number: string;
  protocol_type: ProtocolType;
  document_title: string;
  subject: string;
  sender_name: string | null;
  recipient_name: string | null;
  pdf_hash: string | null;
  pdf_storage_path: string | null;
  validation_token: string;
  qr_payload: string;
  status: SealStatus;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_by: string;
  created_at: string;
}

export interface SealMovement {
  id: string;
  seal_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  from_department: string | null;
  to_department: string | null;
  movement_type: MovementType;
  notes: string | null;
  scanned_qr: boolean;
  created_at: string;
  from_user_name?: string | null;
  to_user_name?: string | null;
}

export interface ListSealsFilters {
  type?: ProtocolFilter;
  from?: string | null;
  to?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "protocol_number" | "status";
  sortDir?: "asc" | "desc";
}

export interface ListSealsResult {
  rows: Seal[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listSeals(filters: ListSealsFilters = {}): Promise<ListSealsResult> {
  const {
    type = "ALL",
    from,
    to,
    search,
    page = 1,
    pageSize = 20,
    sortBy = "created_at",
    sortDir = "desc",
  } = filters;

  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  let q = supabase
    .from("physical_seals")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: sortDir === "asc" });

  if (type !== "ALL") q = q.eq("protocol_type", type);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);
  if (search && search.trim()) {
    const t = search.trim().replace(/[%_]/g, "");
    q = q.or(`protocol_number.ilike.%${t}%,document_title.ilike.%${t}%`);
  }

  const { data, error, count } = await q.range(fromIdx, toIdx);
  if (error) throw error;
  return {
    rows: (data ?? []) as Seal[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getSeal(id: string): Promise<Seal | null> {
  const { data, error } = await supabase
    .from("physical_seals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Seal | null;
}

export async function getSealMovements(sealId: string): Promise<SealMovement[]> {
  const { data, error } = await supabase
    .from("seal_movements")
    .select("*")
    .eq("seal_id", sealId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const movs = (data ?? []) as SealMovement[];

  const userIds = Array.from(
    new Set(movs.flatMap((m) => [m.from_user_id, m.to_user_id]).filter(Boolean) as string[])
  );
  if (userIds.length === 0) return movs;

  const { data: profs } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", userIds);
  const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.full_name as string]));
  return movs.map((m) => ({
    ...m,
    from_user_name: m.from_user_id ? map.get(m.from_user_id) ?? null : null,
    to_user_name: m.to_user_id ? map.get(m.to_user_id) ?? null : null,
  }));
}

export interface CreateSealResponse {
  protocol_number: string;
  validation_token: string;
  qr_payload: string;
  pdf_hash: string | null;
  created_at: string;
  id?: string;
}

export async function createSeal(form: FormData): Promise<CreateSealResponse> {
  const { data, error } = await supabase.functions.invoke("register-seal", {
    body: form,
  });
  if (error) throw error;
  return data as CreateSealResponse;
}

export async function cancelSeal(id: string, reason: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("physical_seals")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.id ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export interface RegisterMovementInput {
  seal_id: string;
  to_user_id: string;
  to_department: string;
  notes?: string | null;
  scanned_qr?: boolean;
}

export async function registerMovement(input: RegisterMovementInput): Promise<SealMovement> {
  const { data, error } = await supabase.functions.invoke("register-movement", {
    body: input,
  });
  if (error) throw error;
  return (data?.movement ?? data) as SealMovement;
}

export interface OrgMember {
  user_id: string;
  full_name: string;
  email: string | null;
}

export async function listOrgMembers(): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrgMember[];
}

export async function listOrgDepartments(): Promise<string[]> {
  const { data, error } = await supabase
    .from("seal_movements")
    .select("to_department")
    .not("to_department", "is", null)
    .limit(500);
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => r.to_department && set.add(r.to_department));
  return Array.from(set).sort();
}

export async function getSignedPdfUrl(path: string, expiresIn = 60): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("seal-pdfs")
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
