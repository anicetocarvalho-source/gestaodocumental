import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { pt } from "date-fns/locale";

interface AdvancedChartsProps {
  dateFrom: Date;
  dateTo: Date;
  unitId?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(142, 76%, 36%)",
  "hsl(231, 48%, 48%)",
  "hsl(47, 100%, 45%)",
];

export function AdvancedCharts({ dateFrom, dateTo, unitId }: AdvancedChartsProps) {
  // Process funnel data
  const { data: funnelData, isLoading: isLoadingFunnel } = useQuery({
    queryKey: ["chart-funnel", dateFrom, dateTo, unitId],
    queryFn: async () => {
      const fromStr = startOfDay(dateFrom).toISOString();
      const toStr = endOfDay(dateTo).toISOString();

      const statuses: { status: "rascunho" | "em_andamento" | "aguardando_aprovacao" | "concluido"; label: string }[] = [
        { status: "rascunho", label: "Rascunho" },
        { status: "em_andamento", label: "Em Andamento" },
        { status: "aguardando_aprovacao", label: "Aguardando Aprovação" },
        { status: "concluido", label: "Concluído" },
      ];

      const result = [];

      for (const s of statuses) {
        let query = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .eq("status", s.status)
          .gte("created_at", fromStr)
          .lte("created_at", toStr);
        if (unitId) query = query.eq("current_unit_id", unitId);
        const { count } = await query;
        result.push({ name: s.label, value: count || 0, fill: COLORS[result.length] });
      }

      return result;
    },
  });

  // Hourly activity heatmap data
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ["chart-heatmap", unitId],
    queryFn: async () => {
      const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
      const result = [];

      for (const day of days) {
        const dayStart = startOfDay(day).toISOString();
        const dayEnd = endOfDay(day).toISOString();
        const dayName = format(day, "EEE", { locale: pt });

        let query = supabase.from("documents")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        if (unitId) query = query.eq("current_unit_id", unitId);
        const { count: docs } = await query;

        let procQuery = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        if (unitId) procQuery = procQuery.eq("current_unit_id", unitId);
        const { count: procs } = await procQuery;

        let dispQuery = supabase.from("dispatches")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        if (unitId) dispQuery = dispQuery.eq("origin_unit_id", unitId);
        const { count: disps } = await dispQuery;

        result.push({
          day: dayName,
          documentos: docs || 0,
          processos: procs || 0,
          despachos: disps || 0,
          total: (docs || 0) + (procs || 0) + (disps || 0),
        });
      }

      return result;
    },
  });

  // Unit performance radar
  const { data: radarData, isLoading: isLoadingRadar } = useQuery({
    queryKey: ["chart-radar", dateFrom, dateTo],
    queryFn: async () => {
      const { data: units } = await supabase
        .from("organizational_units")
        .select("id, name")
        .eq("is_active", true)
        .limit(5);

      if (!units) return [];

      const result = [];

      for (const unit of units) {
        const fromStr = startOfDay(dateFrom).toISOString();
        const toStr = endOfDay(dateTo).toISOString();

        // Get counts
        const { count: docs } = await supabase.from("documents")
          .select("id", { count: "exact", head: true })
          .eq("current_unit_id", unit.id)
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const { count: procs } = await supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .eq("current_unit_id", unit.id)
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const { count: completed } = await supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .eq("current_unit_id", unit.id)
          .eq("status", "concluido")
          .gte("completed_at", fromStr)
          .lte("completed_at", toStr);

        const { count: disps } = await supabase.from("dispatches")
          .select("id", { count: "exact", head: true })
          .eq("origin_unit_id", unit.id)
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        result.push({
          unit: unit.name.length > 15 ? unit.name.slice(0, 15) + "..." : unit.name,
          documentos: docs || 0,
          processos: procs || 0,
          concluidos: completed || 0,
          despachos: disps || 0,
        });
      }

      return result;
    },
  });

  // Priority distribution
  const { data: priorityData, isLoading: isLoadingPriority } = useQuery({
    queryKey: ["chart-priority", dateFrom, dateTo, unitId],
    queryFn: async () => {
      const fromStr = startOfDay(dateFrom).toISOString();
      const toStr = endOfDay(dateTo).toISOString();
      const priorities: ("baixa" | "normal" | "alta" | "urgente")[] = ["baixa", "normal", "alta", "urgente"];
      const labels = { baixa: "Baixa", normal: "Normal", alta: "Alta", urgente: "Urgente" };
      const result = [];

      for (let i = 0; i < priorities.length; i++) {
        let query = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .eq("priority", priorities[i])
          .gte("created_at", fromStr)
          .lte("created_at", toStr);
        if (unitId) query = query.eq("current_unit_id", unitId);
        const { count } = await query;
        
        if (count && count > 0) {
          result.push({
            name: labels[priorities[i] as keyof typeof labels],
            value: count,
            fill: COLORS[i],
          });
        }
      }

      return result;
    },
  });

  return (
    <Tabs defaultValue="funnel" className="space-y-4">
      <TabsList>
        <TabsTrigger value="funnel">Funil de Processos</TabsTrigger>
        <TabsTrigger value="activity">Actividade Semanal</TabsTrigger>
        <TabsTrigger value="radar">Radar por Unidade</TabsTrigger>
        <TabsTrigger value="priority">Prioridades</TabsTrigger>
      </TabsList>

      <TabsContent value="funnel">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de Processos</CardTitle>
            <CardDescription>Distribuição de processos por estado no período</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFunnel ? (
              <Skeleton className="h-[350px] w-full" />
            ) : funnelData && funnelData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                    >
                      <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" />
                      <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividade Semanal</CardTitle>
            <CardDescription>Volume de actividade por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHeatmap ? (
              <Skeleton className="h-[350px] w-full" />
            ) : heatmapData && heatmapData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={heatmapData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="documentos" name="Documentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="processos" name="Processos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despachos" name="Despachos" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="radar">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radar por Unidade</CardTitle>
            <CardDescription>Comparação de métricas entre unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRadar ? (
              <Skeleton className="h-[350px] w-full" />
            ) : radarData && radarData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="unit" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Radar name="Documentos" dataKey="documentos" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Processos" dataKey="processos" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} />
                    <Radar name="Concluídos" dataKey="concluidos" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="priority">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Prioridade</CardTitle>
            <CardDescription>Processos agrupados por nível de prioridade</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPriority ? (
              <Skeleton className="h-[350px] w-full" />
            ) : priorityData && priorityData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
