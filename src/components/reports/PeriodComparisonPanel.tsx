import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowUpRight, ArrowDownRight, ArrowRight, CalendarIcon, RefreshCw, Minus } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

interface PeriodData {
  documents: number;
  processes: number;
  dispatches: number;
  avgProcessingTime: number;
  slaCompliance: number;
}

interface PeriodComparisonPanelProps {
  unitId?: string;
}

export function PeriodComparisonPanel({ unitId }: PeriodComparisonPanelProps) {
  const [period1, setPeriod1] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  });
  const [period2, setPeriod2] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const fetchPeriodData = async (from: Date, to: Date): Promise<PeriodData> => {
    const fromStr = startOfDay(from).toISOString();
    const toStr = endOfDay(to).toISOString();

    // Documents
    let docQuery = supabase.from("documents").select("id", { count: "exact", head: true })
      .gte("created_at", fromStr).lte("created_at", toStr);
    if (unitId) docQuery = docQuery.eq("current_unit_id", unitId);
    const { count: documents } = await docQuery;

    // Processes
    let procQuery = supabase.from("processes").select("id", { count: "exact", head: true })
      .gte("created_at", fromStr).lte("created_at", toStr);
    if (unitId) procQuery = procQuery.eq("current_unit_id", unitId);
    const { count: processes } = await procQuery;

    // Dispatches
    let dispQuery = supabase.from("dispatches").select("id", { count: "exact", head: true })
      .gte("created_at", fromStr).lte("created_at", toStr);
    if (unitId) dispQuery = dispQuery.eq("origin_unit_id", unitId);
    const { count: dispatches } = await dispQuery;

    // Average processing time
    let completedQuery = supabase.from("processes")
      .select("started_at, completed_at")
      .eq("status", "concluido")
      .not("started_at", "is", null)
      .not("completed_at", "is", null)
      .gte("completed_at", fromStr)
      .lte("completed_at", toStr);
    if (unitId) completedQuery = completedQuery.eq("current_unit_id", unitId);
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

    // SLA compliance
    let slaQuery = supabase.from("processes")
      .select("deadline, completed_at")
      .eq("status", "concluido")
      .not("deadline", "is", null)
      .gte("completed_at", fromStr)
      .lte("completed_at", toStr);
    if (unitId) slaQuery = slaQuery.eq("current_unit_id", unitId);
    const { data: slaProcesses } = await slaQuery;

    let slaCompliance = 100;
    if (slaProcesses && slaProcesses.length > 0) {
      const onTime = slaProcesses.filter(proc => 
        new Date(proc.completed_at!) <= new Date(proc.deadline!)
      ).length;
      slaCompliance = Number(((onTime / slaProcesses.length) * 100).toFixed(1));
    }

    return {
      documents: documents || 0,
      processes: processes || 0,
      dispatches: dispatches || 0,
      avgProcessingTime,
      slaCompliance,
    };
  };

  const { data: period1Data, isLoading: isLoading1, refetch: refetch1 } = useQuery({
    queryKey: ["period-comparison-1", period1.from, period1.to, unitId],
    queryFn: () => fetchPeriodData(period1.from, period1.to),
  });

  const { data: period2Data, isLoading: isLoading2, refetch: refetch2 } = useQuery({
    queryKey: ["period-comparison-2", period2.from, period2.to, unitId],
    queryFn: () => fetchPeriodData(period2.from, period2.to),
  });

  const isLoading = isLoading1 || isLoading2;

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  const metrics = [
    { label: "Documentos", key: "documents" as keyof PeriodData },
    { label: "Processos", key: "processes" as keyof PeriodData },
    { label: "Despachos", key: "dispatches" as keyof PeriodData },
    { label: "Tempo Médio (dias)", key: "avgProcessingTime" as keyof PeriodData, inverted: true },
    { label: "SLA (%)", key: "slaCompliance" as keyof PeriodData },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Comparação entre Períodos</CardTitle>
            <CardDescription>Compare métricas de dois períodos diferentes</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetch1(); refetch2(); }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Period Selectors */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Período 1:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(period1.from, "dd/MM/yyyy", { locale: pt })} - {format(period1.to, "dd/MM/yyyy", { locale: pt })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: period1.from, to: period1.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setPeriod1({ from: range.from, to: range.to });
                    }
                  }}
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Período 2:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(period2.from, "dd/MM/yyyy", { locale: pt })} - {format(period2.to, "dd/MM/yyyy", { locale: pt })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: period2.from, to: period2.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setPeriod2({ from: range.from, to: range.to });
                    }
                  }}
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Comparison Table */}
        {isLoading ? (
          <div className="space-y-4">
            {metrics.map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.map((metric) => {
              const val1 = period1Data?.[metric.key] || 0;
              const val2 = period2Data?.[metric.key] || 0;
              const change = calcChange(val2, val1);
              const isPositive = metric.inverted ? change <= 0 : change >= 0;

              return (
                <div key={metric.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono">
                      {val1}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono">
                      {val2}
                    </Badge>
                    <div className={cn(
                      "flex items-center gap-1 min-w-[80px] justify-end",
                      change === 0 ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
                    )}>
                      {change === 0 ? (
                        <Minus className="h-4 w-4" />
                      ) : isPositive ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{Math.abs(change)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
