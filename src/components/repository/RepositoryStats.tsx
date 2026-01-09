import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderTree,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useRepositoryStats } from "@/hooks/useRepository";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  in_progress: "Em Tratamento",
  completed: "Concluído",
  archived: "Arquivado",
  cancelled: "Cancelado",
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
];

interface RepositoryStatsProps {
  isLoading?: boolean;
}

export function RepositoryStats({ isLoading: externalLoading }: RepositoryStatsProps) {
  const { data: stats, isLoading } = useRepositoryStats();

  const loading = isLoading || externalLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total de Documentos",
      value: stats?.totalDocuments || 0,
      icon: FileText,
      variant: "default" as const,
    },
    {
      label: "Classificações Activas",
      value: stats?.totalClassifications || 0,
      icon: FolderTree,
      variant: "info" as const,
    },
    {
      label: "Documentos Este Mês",
      value: stats?.documentsThisMonth || 0,
      icon: TrendingUp,
      variant: "success" as const,
    },
    {
      label: "Documentos Pendentes",
      value: stats?.pendingDocuments || 0,
      icon: Clock,
      variant: "warning" as const,
    },
  ];

  const statusData = stats?.byStatus.map((item) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
  })) || [];

  const classificationData = stats?.byClassification || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      kpi.variant === "info"
                        ? "bg-info/10 text-info"
                        : kpi.variant === "success"
                        ? "bg-success/10 text-success"
                        : kpi.variant === "warning"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Sem dados disponíveis
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Classifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              Top 5 Classificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classificationData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classificationData}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Sem dados disponíveis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
