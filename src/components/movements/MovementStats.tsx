import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  RotateCcw, 
  Archive,
  TrendingUp,
  Building2,
  Activity
} from "lucide-react";
import { MovementWithDetails, actionTypeLabels } from "@/hooks/useMovements";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface MovementStatsProps {
  movements: MovementWithDetails[];
  isLoading?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

export function MovementStats({ movements, isLoading }: MovementStatsProps) {
  const stats = useMemo(() => {
    if (!movements?.length) return null;

    // Count by action type
    const byActionType = movements.reduce((acc, m) => {
      acc[m.action_type] = (acc[m.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by destination unit
    const byToUnit = movements.reduce((acc, m) => {
      if (m.to_unit) {
        acc[m.to_unit.code] = (acc[m.to_unit.code] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Count pending (not read)
    const pending = movements.filter(m => !m.is_read).length;

    // Count by day (last 7 days)
    const last7Days = movements.filter(m => {
      const date = new Date(m.created_at);
      const diff = Date.now() - date.getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      total: movements.length,
      pending,
      last7Days,
      byActionType,
      byToUnit,
    };
  }, [movements]);

  const actionTypeData = useMemo(() => {
    if (!stats?.byActionType) return [];
    return Object.entries(stats.byActionType)
      .map(([key, value]) => ({
        name: actionTypeLabels[key] || key,
        value,
        type: key,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const unitData = useMemo(() => {
    if (!stats?.byToUnit) return [];
    return Object.entries(stats.byToUnit)
      .map(([key, value]) => ({
        name: key,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Movimentações</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes de Leitura</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <ArrowLeftRight className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                <p className="text-3xl font-bold">{stats.last7Days}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unidades Activas</p>
                <p className="text-3xl font-bold">{Object.keys(stats.byToUnit).length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Action Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Tipo de Acção</CardTitle>
          </CardHeader>
          <CardContent>
            {actionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={actionTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {actionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unit Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimentações por Unidade (Destino)</CardTitle>
          </CardHeader>
          <CardContent>
            {unitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={unitData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
