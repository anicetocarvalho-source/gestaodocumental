import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MovementType = "initial" | "handoff" | "archive" | "return";

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
}

export interface PhysicalSeal {
  id: string;
  protocol_number: string;
  protocol_type: string;
  document_title: string;
  subject: string;
  sender_name: string | null;
  recipient_name: string | null;
  pdf_hash: string | null;
  pdf_storage_path: string | null;
  validation_token: string;
  qr_payload: string;
  status: string;
  created_at: string;
  created_by: string;
}

export function usePhysicalSeals() {
  return useQuery({
    queryKey: ["physical-seals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("physical_seals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PhysicalSeal[];
    },
  });
}

export function usePhysicalSeal(id: string | undefined) {
  return useQuery({
    queryKey: ["physical-seal", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("physical_seals")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as PhysicalSeal | null;
    },
  });
}

export function useSealMovements(sealId: string | undefined) {
  return useQuery({
    queryKey: ["seal-movements", sealId],
    enabled: !!sealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seal_movements")
        .select("*")
        .eq("seal_id", sealId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SealMovement[];
    },
  });
}

export interface CreateMovementInput {
  seal_id: string;
  movement_type: MovementType;
  to_department?: string | null;
  from_department?: string | null;
  notes?: string | null;
  scanned_qr?: boolean;
}

export function useCreateSealMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMovementInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("seal_movements")
        .insert({
          seal_id: input.seal_id,
          movement_type: input.movement_type,
          to_department: input.to_department ?? null,
          from_department: input.from_department ?? null,
          notes: input.notes ?? null,
          scanned_qr: input.scanned_qr ?? false,
          from_user_id: user?.id ?? null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as SealMovement;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["seal-movements", vars.seal_id] });
    },
  });
}
