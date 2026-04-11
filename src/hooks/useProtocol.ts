import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProtocolEntry {
  id: string;
  protocol_number: string;
  direction: "entrada" | "saida";
  subject: string;
  sender_name: string | null;
  sender_institution: string | null;
  recipient_name: string | null;
  recipient_institution: string | null;
  document_date: string | null;
  received_at: string | null;
  sent_at: string | null;
  delivery_method: string | null;
  observations: string | null;
  document_id: string | null;
  unit_id: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProtocolFilters {
  direction?: "entrada" | "saida";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  unitId?: string;
}

export function useProtocolEntries(filters: ProtocolFilters = {}) {
  return useQuery({
    queryKey: ["protocol-entries", filters],
    queryFn: async () => {
      let query = supabase
        .from("protocol_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.direction) query = query.eq("direction", filters.direction);
      if (filters.unitId) query = query.eq("unit_id", filters.unitId);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom.toISOString());
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo.toISOString());
      if (filters.search) {
        query = query.or(
          `subject.ilike.%${filters.search}%,protocol_number.ilike.%${filters.search}%,sender_name.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProtocolEntry[];
    },
  });
}

export function useCreateProtocolEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<ProtocolEntry, "id" | "protocol_number" | "created_at" | "updated_at" | "registered_by">) => {
      const { data, error } = await supabase
        .from("protocol_entries")
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocol-entries"] });
      toast.success("Registo de protocolo criado com sucesso");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar registo: " + error.message);
    },
  });
}

export function useProtocolStats(filters: ProtocolFilters = {}) {
  return useQuery({
    queryKey: ["protocol-stats", filters],
    queryFn: async () => {
      let baseQuery = supabase.from("protocol_entries").select("direction, created_at");
      if (filters.dateFrom) baseQuery = baseQuery.gte("created_at", filters.dateFrom.toISOString());
      if (filters.dateTo) baseQuery = baseQuery.lte("created_at", filters.dateTo.toISOString());
      if (filters.unitId) baseQuery = baseQuery.eq("unit_id", filters.unitId);

      const { data, error } = await baseQuery;
      if (error) throw error;

      const entries = data || [];
      const totalEntrada = entries.filter(e => e.direction === "entrada").length;
      const totalSaida = entries.filter(e => e.direction === "saida").length;

      return { total: entries.length, totalEntrada, totalSaida };
    },
  });
}
