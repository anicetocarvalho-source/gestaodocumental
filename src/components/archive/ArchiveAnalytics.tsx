import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  FolderTree,
  Clock,
  TrendingUp,
  Calendar,
  Building2,
  Filter,
  X,
} from "lucide-react";
import { 
  format, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  startOfQuarter, 
  endOfQuarter,
  getYear,
  getQuarter,
} from "date-fns";
import { pt } from "date-fns/locale";
import { Document } from "@/types/database";
import { DocumentRetention } from "@/hooks/useArchive";

interface ClassificationCode {
  id: string;
  code: string;
  name: string;
}

interface OrganizationalUnit {
  id: string;
  code: string;
  name: string;
}

interface ArchiveAnalyticsProps {
  documents: Document[];
  retentions: DocumentRetention[];
  classifications: ClassificationCode[];
  units: OrganizationalUnit[];
  isLoading: boolean;
}

// Cores do design system
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

// Gerar opções de anos (últimos 5 anos)
const currentYear = getYear(new Date());
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const QUARTER_OPTIONS = [
  { value: "1", label: "1º Trimestre (Jan-Mar)" },
  { value: "2", label: "2º Trimestre (Abr-Jun)" },
  { value: "3", label: "3º Trimestre (Jul-Set)" },
  { value: "4", label: "4º Trimestre (Out-Dez)" },
];

export function ArchiveAnalytics({
  documents,
  retentions,
  classifications,
  units,
  isLoading,
}: ArchiveAnalyticsProps) {
  // Estados dos filtros
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [quarterFilter, setQuarterFilter] = useState<string>("all");

  // Filtrar documentos por período
  const filteredDocuments = useMemo(() => {
    if (yearFilter === "all" && quarterFilter === "all") {
      return documents;
    }

    return documents.filter((doc) => {
      if (!doc.archived_at) return false;
      const archivedDate = new Date(doc.archived_at);
      const docYear = getYear(archivedDate);
      const docQuarter = getQuarter(archivedDate);

      if (yearFilter !== "all" && docYear !== parseInt(yearFilter)) {
        return false;
      }

      if (quarterFilter !== "all" && docQuarter !== parseInt(quarterFilter)) {
        return false;
      }

      return true;
    });
  }, [documents, yearFilter, quarterFilter]);

  // Filtrar retenções por período (baseado na data de marcação)
  const filteredRetentions = useMemo(() => {
    if (yearFilter === "all" && quarterFilter === "all") {
      return retentions;
    }

    return retentions.filter((r) => {
      const markedDate = new Date(r.marked_at);
      const docYear = getYear(markedDate);
      const docQuarter = getQuarter(markedDate);

      if (yearFilter !== "all" && docYear !== parseInt(yearFilter)) {
        return false;
      }

      if (quarterFilter !== "all" && docQuarter !== parseInt(quarterFilter)) {
        return false;
      }

      return true;
    });
  }, [retentions, yearFilter, quarterFilter]);

  const hasActiveFilters = yearFilter !== "all" || quarterFilter !== "all";

  const clearFilters = () => {
    setYearFilter("all");
    setQuarterFilter("all");
  };

  // Período formatado para exibição
  const periodLabel = useMemo(() => {
    if (yearFilter === "all" && quarterFilter === "all") {
      return "Todos os períodos";
    }
    if (yearFilter !== "all" && quarterFilter === "all") {
      return `Ano ${yearFilter}`;
    }
    if (yearFilter !== "all" && quarterFilter !== "all") {
      return `${quarterFilter}º Trim. ${yearFilter}`;
    }
    return `${quarterFilter}º Trimestre`;
  }, [yearFilter, quarterFilter]);

  // Dados por classificação
  const classificationData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredDocuments.forEach((doc) => {
      const classId = doc.classification_id || "sem_classificacao";
      counts[classId] = (counts[classId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const classification = classifications.find((c) => c.id === id);
        return {
          name: classification ? `${classification.code}` : "Sem classificação",
          fullName: classification?.name || "Sem classificação",
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredDocuments, classifications]);

  // Dados por unidade orgânica
  const unitData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredDocuments.forEach((doc) => {
      const unitId = doc.current_unit_id || "sem_unidade";
      counts[unitId] = (counts[unitId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const unit = units.find((u) => u.id === id);
        return {
          name: unit?.code || "S/U",
          fullName: unit?.name || "Sem unidade",
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredDocuments, units]);

  // Dados por período de retenção
  const retentionPeriodData = useMemo(() => {
    const periods = [
      { label: "< 1 ano", min: 0, max: 1 },
      { label: "1-3 anos", min: 1, max: 3 },
      { label: "3-5 anos", min: 3, max: 5 },
      { label: "5-10 anos", min: 5, max: 10 },
      { label: "> 10 anos", min: 10, max: 100 },
    ];

    const now = new Date();
    
    return periods.map((period) => {
      const count = filteredRetentions.filter((r) => {
        const scheduledDate = new Date(r.scheduled_destruction_date);
        const yearsUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return yearsUntil >= period.min && yearsUntil < period.max;
      }).length;

      return {
        name: period.label,
        pendentes: count,
      };
    });
  }, [filteredRetentions]);

  // Tendência de arquivamento (últimos 6 meses)
  const archivingTrend = useMemo(() => {
    const months: { month: Date; label: string; arquivados: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const count = documents.filter((doc) => {
        if (!doc.archived_at) return false;
        const archivedDate = new Date(doc.archived_at);
        return archivedDate >= start && archivedDate <= end;
      }).length;

      months.push({
        month,
        label: format(month, "MMM", { locale: pt }),
        arquivados: count,
      });
    }

    return months;
  }, [documents]);

  // Status de retenção
  const retentionStatusData = useMemo(() => {
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    filteredRetentions.forEach((r) => {
      if (r.status in statusCounts) {
        statusCounts[r.status as keyof typeof statusCounts]++;
      }
    });

    return [
      { name: "Pendentes", value: statusCounts.pending, color: "hsl(var(--warning))" },
      { name: "Aprovados", value: statusCounts.approved, color: "hsl(var(--destructive))" },
      { name: "Rejeitados", value: statusCounts.rejected, color: "hsl(var(--muted-foreground))" },
    ].filter((d) => d.value > 0);
  }, [filteredRetentions]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{label || payload[0]?.payload?.fullName || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name || "Valor"}: <span className="font-medium text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filtros de período */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por período:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os trimestres</SelectItem>
                  {QUARTER_OPTIONS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-9 text-muted-foreground"
              >
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Badge variant={hasActiveFilters ? "default" : "secondary"}>
                {periodLabel}
              </Badge>
              <Badge variant="outline">
                {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 1: Classification and Units */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Classificação */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              Documentos por Classificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classificationData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Sem dados de classificação
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={classificationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {classificationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value, entry: any) => (
                      <span className="text-xs text-muted-foreground">
                        {entry.payload?.name}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por Unidade Orgânica */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-info" />
              Documentos por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unitData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Sem dados de unidades
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={unitData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 11 }} 
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--info))" 
                    radius={[0, 4, 4, 0]}
                    name="Documentos"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Retention and Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Períodos de Retenção */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Por Período de Retenção
              <Badge variant="secondary" className="ml-auto text-xs">
                {retentions.length} pendentes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {retentions.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Sem documentos marcados para eliminação
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={retentionPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="pendentes" 
                    fill="hsl(var(--warning))" 
                    radius={[4, 4, 0, 0]}
                    name="Pendentes"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tendência de Arquivamento */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Tendência de Arquivamento
              <Badge variant="outline" className="ml-auto text-xs">
                Últimos 6 meses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={archivingTrend}>
                <defs>
                  <linearGradient id="archiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="arquivados"
                  stroke="hsl(var(--success))"
                  fill="url(#archiveGradient)"
                  strokeWidth={2}
                  name="Arquivados"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Status Summary */}
      {retentionStatusData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Estado das Marcações para Eliminação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {retentionStatusData.map((status) => (
                <div
                  key={status.name}
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50"
                >
                  <span
                    className="text-3xl font-bold"
                    style={{ color: status.color }}
                  >
                    {status.value}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {status.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
