import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, FolderTree, Layers, LineChart as LineChartIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGedDashboard, type GedDashboardSlice } from "@/hooks/useGedIndexing";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
];

interface GedControlPanelProps {
  onSelectStatus?: (status: string) => void;
  onSelectClassification?: (classificationId: string) => void;
  onSelectIndexing?: (indexed: "indexed" | "pending") => void;
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
    </div>
  );
}

export function GedControlPanel({
  onSelectStatus,
  onSelectClassification,
  onSelectIndexing,
}: GedControlPanelProps) {
  const { data, isLoading } = useGedDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-[220px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  const pct = (n: number) => `${Math.round((n / data.total) * 100)}%`;

  return (
    <div className="space-y-4">
      {/* Indexação */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.byIndexing.map((s, i) => (
          <Card
            key={s.key}
            className="cursor-pointer transition-colors hover:border-primary"
            onClick={() => onSelectIndexing?.(s.key as "indexed" | "pending")}
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">{s.count}</p>
                <Badge variant={i === 0 ? "default" : "secondary"}>{pct(s.count)}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {data.byStatus.slice(0, 2).map((s) => (
          <Card
            key={s.key}
            className="cursor-pointer transition-colors hover:border-primary"
            onClick={() => onSelectStatus?.(s.key)}
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">{s.count}</p>
                <Badge variant="outline">{pct(s.count)}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Estado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Documentos por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byStatus.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byStatus}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      onClick={(entry: unknown) =>
                        onSelectStatus?.((entry as GedDashboardSlice).key)
                      }
                    >
                      {data.byStatus.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* Classificação */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              Documentos por classificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byClassification.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byClassification} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(entry: unknown) =>
                        onSelectClassification?.((entry as GedDashboardSlice).key)
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* Categoria (lote) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Documentos por categoria (lote)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byCategory.length > 0 ? (
              <div className="space-y-3">
                {data.byCategory.map((c, i) => (
                  <div key={c.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-2">{c.label}</span>
                      <span className="text-muted-foreground">
                        {c.count} · {pct(c.count)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: pct(c.count),
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* Evolução */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChartIcon className="h-4 w-4 text-muted-foreground" />
              Entradas por mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byMonth.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Clique num estado, classificação ou indicador para filtrar a lista abaixo.
      </p>
    </div>
  );
}
