import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export interface ReportFilters {
  dateFrom: Date;
  dateTo: Date;
  unitId?: string;
  processTypeId?: string;
  responsibleUserId?: string;
}

export interface KPIStats {
  totalDocuments: number;
  documentsChange: number;
  totalProcesses: number;
  processesChange: number;
  avgProcessingTime: number;
  processingTimeChange: number;
  slaCompliance: number;
  slaChange: number;
  totalDispatches: number;
  dispatchesChange: number;
  pendingApprovals: number;
}

export interface TimeSeriesData {
  month: string;
  criados: number;
  concluidos: number;
  pendentes: number;
}

export interface DocumentTypeData {
  name: string;
  value: number;
  color: string;
}

export interface UnitData {
  unit: string;
  unitId: string;
  total: number;
  concluidos: number;
  pendentes: number;
}

export interface PerformerData {
  id: string;
  name: string;
  processos: number;
  avgDias: number;
  sla: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

// Main KPI Stats
export function useKPIStats(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-kpi-stats", filters.dateFrom, filters.dateTo, filters.unitId],
    queryFn: async (): Promise<KPIStats> => {
      const currentFrom = startOfDay(filters.dateFrom).toISOString();
      const currentTo = endOfDay(filters.dateTo).toISOString();
      
      // Calculate previous period for comparison
      const daysDiff = Math.ceil((filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
      const prevFrom = startOfDay(subDays(filters.dateFrom, daysDiff)).toISOString();
      const prevTo = endOfDay(subDays(filters.dateTo, daysDiff)).toISOString();

      // Current period counts
      let docQuery = supabase.from("documents").select("id", { count: "exact", head: true })
        .gte("created_at", currentFrom).lte("created_at", currentTo);
      if (filters.unitId) docQuery = docQuery.eq("current_unit_id", filters.unitId);
      const { count: currentDocs } = await docQuery;

      let procQuery = supabase.from("processes").select("id", { count: "exact", head: true })
        .gte("created_at", currentFrom).lte("created_at", currentTo);
      if (filters.unitId) procQuery = procQuery.eq("current_unit_id", filters.unitId);
      const { count: currentProcs } = await procQuery;

      let dispQuery = supabase.from("dispatches").select("id", { count: "exact", head: true })
        .gte("created_at", currentFrom).lte("created_at", currentTo);
      if (filters.unitId) dispQuery = dispQuery.eq("origin_unit_id", filters.unitId);
      const { count: currentDisp } = await dispQuery;

      // Previous period counts
      let prevDocQuery = supabase.from("documents").select("id", { count: "exact", head: true })
        .gte("created_at", prevFrom).lte("created_at", prevTo);
      if (filters.unitId) prevDocQuery = prevDocQuery.eq("current_unit_id", filters.unitId);
      const { count: prevDocs } = await prevDocQuery;

      let prevProcQuery = supabase.from("processes").select("id", { count: "exact", head: true })
        .gte("created_at", prevFrom).lte("created_at", prevTo);
      if (filters.unitId) prevProcQuery = prevProcQuery.eq("current_unit_id", filters.unitId);
      const { count: prevProcs } = await prevProcQuery;

      let prevDispQuery = supabase.from("dispatches").select("id", { count: "exact", head: true })
        .gte("created_at", prevFrom).lte("created_at", prevTo);
      if (filters.unitId) prevDispQuery = prevDispQuery.eq("origin_unit_id", filters.unitId);
      const { count: prevDisp } = await prevDispQuery;

      // Pending approvals
      const { count: pendingApprovals } = await supabase
        .from("dispatch_approvals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente");

      // Calculate average processing time for completed processes
      let completedQuery = supabase.from("processes")
        .select("started_at, completed_at")
        .eq("status", "concluido")
        .not("started_at", "is", null)
        .not("completed_at", "is", null)
        .gte("completed_at", currentFrom)
        .lte("completed_at", currentTo);
      if (filters.unitId) completedQuery = completedQuery.eq("current_unit_id", filters.unitId);
      const { data: completedProcesses } = await completedQuery;

      let avgProcessingTime = 0;
      if (completedProcesses && completedProcesses.length > 0) {
        const totalDays = completedProcesses.reduce((acc, proc) => {
          const start = new Date(proc.started_at!);
          const end = new Date(proc.completed_at!);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        avgProcessingTime = Number((totalDays / completedProcesses.length).toFixed(1));
      }

      // SLA compliance (processes completed within deadline)
      let slaQuery = supabase.from("processes")
        .select("deadline, completed_at")
        .eq("status", "concluido")
        .not("deadline", "is", null)
        .gte("completed_at", currentFrom)
        .lte("completed_at", currentTo);
      if (filters.unitId) slaQuery = slaQuery.eq("current_unit_id", filters.unitId);
      const { data: slaProcesses } = await slaQuery;

      let slaCompliance = 100;
      if (slaProcesses && slaProcesses.length > 0) {
        const onTime = slaProcesses.filter(proc => 
          new Date(proc.completed_at!) <= new Date(proc.deadline!)
        ).length;
        slaCompliance = Number(((onTime / slaProcesses.length) * 100).toFixed(1));
      }

      // Calculate changes
      const calcChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
      };

      return {
        totalDocuments: currentDocs || 0,
        documentsChange: calcChange(currentDocs || 0, prevDocs || 0),
        totalProcesses: currentProcs || 0,
        processesChange: calcChange(currentProcs || 0, prevProcs || 0),
        avgProcessingTime,
        processingTimeChange: 0, // Would need previous period calc
        slaCompliance,
        slaChange: 0,
        totalDispatches: currentDisp || 0,
        dispatchesChange: calcChange(currentDisp || 0, prevDisp || 0),
        pendingApprovals: pendingApprovals || 0,
      };
    },
  });
}

// Processes over time (monthly)
export function useProcessesTimeSeries(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-processes-time", filters.dateFrom, filters.dateTo, filters.unitId],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const months: TimeSeriesData[] = [];
      
      // Get last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date).toISOString();
        const monthEnd = endOfMonth(date).toISOString();
        const monthName = format(date, "MMM");

        let criadosQuery = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd);
        if (filters.unitId) criadosQuery = criadosQuery.eq("current_unit_id", filters.unitId);
        const { count: criados } = await criadosQuery;

        let concluidosQuery = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .eq("status", "concluido")
          .gte("completed_at", monthStart)
          .lte("completed_at", monthEnd);
        if (filters.unitId) concluidosQuery = concluidosQuery.eq("current_unit_id", filters.unitId);
        const { count: concluidos } = await concluidosQuery;

        let pendentesQuery = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .in("status", ["em_andamento", "aguardando_aprovacao"]);
        if (filters.unitId) pendentesQuery = pendentesQuery.eq("current_unit_id", filters.unitId);
        const { count: pendentes } = await pendentesQuery;

        months.push({
          month: monthName,
          criados: criados || 0,
          concluidos: concluidos || 0,
          pendentes: i === 0 ? (pendentes || 0) : 0, // Only show current pending
        });
      }

      return months;
    },
  });
}

// Documents by type
export function useDocumentsByType(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-documents-type", filters.dateFrom, filters.dateTo, filters.unitId],
    queryFn: async (): Promise<DocumentTypeData[]> => {
      const { data: types } = await supabase
        .from("document_types")
        .select("id, name")
        .eq("is_active", true);

      if (!types) return [];

      const result: DocumentTypeData[] = [];

      for (let i = 0; i < types.length; i++) {
        let query = supabase.from("documents")
          .select("id", { count: "exact", head: true })
          .eq("document_type_id", types[i].id)
          .gte("created_at", startOfDay(filters.dateFrom).toISOString())
          .lte("created_at", endOfDay(filters.dateTo).toISOString());
        
        if (filters.unitId) query = query.eq("current_unit_id", filters.unitId);
        
        const { count } = await query;

        if (count && count > 0) {
          result.push({
            name: types[i].name,
            value: count,
            color: COLORS[i % COLORS.length],
          });
        }
      }

      return result.sort((a, b) => b.value - a.value);
    },
  });
}

// Processes by unit
export function useProcessesByUnit(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-processes-unit", filters.dateFrom, filters.dateTo],
    queryFn: async (): Promise<UnitData[]> => {
      const { data: units } = await supabase
        .from("organizational_units")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (!units) return [];

      const result: UnitData[] = [];

      for (const unit of units) {
        const { count: total } = await supabase
          .from("processes")
          .select("id", { count: "exact", head: true })
          .eq("current_unit_id", unit.id)
          .gte("created_at", startOfDay(filters.dateFrom).toISOString())
          .lte("created_at", endOfDay(filters.dateTo).toISOString());

        const { count: concluidos } = await supabase
          .from("processes")
          .select("id", { count: "exact", head: true })
          .eq("current_unit_id", unit.id)
          .eq("status", "concluido")
          .gte("created_at", startOfDay(filters.dateFrom).toISOString())
          .lte("created_at", endOfDay(filters.dateTo).toISOString());

        if (total && total > 0) {
          result.push({
            unit: unit.name,
            unitId: unit.id,
            total: total || 0,
            concluidos: concluidos || 0,
            pendentes: (total || 0) - (concluidos || 0),
          });
        }
      }

      return result.sort((a, b) => b.total - a.total).slice(0, 10);
    },
  });
}

// Top performers
export function useTopPerformers(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-top-performers", filters.dateFrom, filters.dateTo, filters.unitId],
    queryFn: async (): Promise<PerformerData[]> => {
      // Get completed processes with responsible user
      let query = supabase.from("processes")
        .select(`
          id,
          responsible_user_id,
          started_at,
          completed_at,
          deadline,
          profiles!processes_responsible_user_id_fkey (
            id,
            full_name
          )
        `)
        .eq("status", "concluido")
        .not("responsible_user_id", "is", null)
        .gte("completed_at", startOfDay(filters.dateFrom).toISOString())
        .lte("completed_at", endOfDay(filters.dateTo).toISOString());

      if (filters.unitId) query = query.eq("current_unit_id", filters.unitId);

      const { data: processes } = await query;

      if (!processes || processes.length === 0) return [];

      // Group by user
      const userStats: Record<string, {
        id: string;
        name: string;
        count: number;
        totalDays: number;
        onTime: number;
        total: number;
      }> = {};

      for (const proc of processes) {
        const profile = proc.profiles as { id: string; full_name: string } | null;
        if (!profile) continue;

        if (!userStats[profile.id]) {
          userStats[profile.id] = {
            id: profile.id,
            name: profile.full_name,
            count: 0,
            totalDays: 0,
            onTime: 0,
            total: 0,
          };
        }

        userStats[profile.id].count++;
        userStats[profile.id].total++;

        if (proc.started_at && proc.completed_at) {
          const days = (new Date(proc.completed_at).getTime() - new Date(proc.started_at).getTime()) / (1000 * 60 * 60 * 24);
          userStats[profile.id].totalDays += days;
        }

        if (proc.deadline && proc.completed_at) {
          if (new Date(proc.completed_at) <= new Date(proc.deadline)) {
            userStats[profile.id].onTime++;
          }
        }
      }

      return Object.values(userStats)
        .map(user => ({
          id: user.id,
          name: user.name,
          processos: user.count,
          avgDias: user.count > 0 ? Number((user.totalDays / user.count).toFixed(1)) : 0,
          sla: user.total > 0 ? Math.round((user.onTime / user.total) * 100) : 100,
        }))
        .sort((a, b) => b.processos - a.processos)
        .slice(0, 10);
    },
  });
}

// Recent activity (last 7 days)
export function useRecentActivity(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-recent-activity", filters.unitId],
    queryFn: async () => {
      const days = [];
      const labels = ["Hoje", "Ontem", "2 dias", "3 dias", "4 dias", "5 dias", "6 dias"];

      for (let i = 0; i < 7; i++) {
        const dayStart = startOfDay(subDays(new Date(), i)).toISOString();
        const dayEnd = endOfDay(subDays(new Date(), i)).toISOString();

        let docQuery = supabase.from("documents")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        if (filters.unitId) docQuery = docQuery.eq("current_unit_id", filters.unitId);
        const { count: documentos } = await docQuery;

        let procQuery = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        if (filters.unitId) procQuery = procQuery.eq("current_unit_id", filters.unitId);
        const { count: processos } = await procQuery;

        let dispQuery = supabase.from("dispatches")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        if (filters.unitId) dispQuery = dispQuery.eq("origin_unit_id", filters.unitId);
        const { count: despachos } = await dispQuery;

        days.push({
          date: labels[i],
          documentos: documentos || 0,
          processos: processos || 0,
          despachos: despachos || 0,
        });
      }

      return days;
    },
  });
}

// Reference data for filters
export function useReportReferenceData() {
  const unitsQuery = useQuery({
    queryKey: ["report-ref-units"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizational_units")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const processTypesQuery = useQuery({
    queryKey: ["report-ref-process-types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("process_types")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const usersQuery = useQuery({
    queryKey: ["report-ref-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name");
      return data || [];
    },
  });

  return {
    units: unitsQuery.data || [],
    processTypes: processTypesQuery.data || [],
    users: usersQuery.data || [],
    isLoading: unitsQuery.isLoading || processTypesQuery.isLoading || usersQuery.isLoading,
  };
}
