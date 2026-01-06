import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { ActiveProcesses } from "@/components/dashboard/ActiveProcesses";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useDashboardStats,
  useDocumentsByUnit,
  useDocumentsByType,
  useDocumentsByClassification,
} from "@/hooks/useDashboardStats";

const Index = () => {
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2024-01-15");
  const [selectedPeriod, setSelectedPeriod] = useState("mes");

  // Fetch real data from database
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: documentsByUnit, isLoading: unitLoading } = useDocumentsByUnit();
  const { data: documentsByType, isLoading: typeLoading } = useDocumentsByType();
  const { data: documentsByClassification, isLoading: classLoading } = useDocumentsByClassification();

  const handleExport = (format: string) => {
    console.log(`Exporting dashboard data as ${format}`);
  };

  // Calculate derived KPIs
  const completedDocs = (stats?.documentsByStatus?.completed || 0) + (stats?.documentsByStatus?.archived || 0);
  const trendPercentage = stats?.processedLastMonth 
    ? Math.round(((stats.processedThisMonth - stats.processedLastMonth) / stats.processedLastMonth) * 100)
    : 0;

  return (
    <DashboardLayout 
      title="Dashboard Institucional" 
      subtitle="Visão geral do sistema de gestão documental"
    >
      <PageBreadcrumb items={[{ label: "Painel" }]} />

      {/* Filters and Export Bar */}
      <Card variant="toolbar">
        <CardContent className="py-3">
          <div className="toolbar">
            <div className="toolbar-actions">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Período:</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="trimestre">Trimestre</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriod === "custom" && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-36 h-9"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">até</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36 h-9"
                  />
                </>
              )}
              <Button variant="ghost" size="icon-sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="toolbar-buttons">
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Documentos */}
        <Card variant="stat" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[13px] font-medium text-muted-foreground">Total Documentos</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {(stats?.totalDocuments || 0).toLocaleString()}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                {trendPercentage >= 0 ? (
                  <Badge variant="success" className="gap-0.5 text-[11px] px-1.5 py-0">
                    <TrendingUp className="h-3 w-3" />
                    +{trendPercentage}%
                  </Badge>
                ) : (
                  <Badge variant="error" className="gap-0.5 text-[11px] px-1.5 py-0">
                    <TrendingDown className="h-3 w-3" />
                    {trendPercentage}%
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground">vs mês anterior</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Processados este mês</span>
              <span className="font-medium">{stats?.processedThisMonth || 0}</span>
            </div>
          </div>
        </Card>

        {/* Documentos Pendentes */}
        <Card variant="stat" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[13px] font-medium text-muted-foreground">Documentos Pendentes</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-warning tabular-nums">
                  {stats?.pendingDocuments || 0}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                <Badge variant="error" className="gap-0.5 text-[11px] px-1.5 py-0">
                  {stats?.urgentDocuments || 0} urgentes
                </Badge>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-warning/8 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            <span>Em validação: {stats?.documentsByStatus?.validating || 0}</span>
          </div>
        </Card>

        {/* Concluídos vs Pendentes */}
        <Card variant="stat" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[13px] font-medium text-muted-foreground">Documentos</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-semibold tracking-tight text-success tabular-nums">{completedDocs}</p>
                  <span className="text-muted-foreground/60">/</span>
                  <p className="text-lg font-semibold text-warning tabular-nums">{stats?.pendingDocuments || 0}</p>
                </div>
              )}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                  Concluídos
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning"></span>
                  Pendentes
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-success/8 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden flex">
              {(completedDocs + (stats?.pendingDocuments || 0)) > 0 && (
                <>
                  <div 
                    className="h-full bg-success rounded-l-full"
                    style={{ width: `${(completedDocs / (completedDocs + (stats?.pendingDocuments || 0))) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-warning rounded-r-full"
                    style={{ width: `${((stats?.pendingDocuments || 0) / (completedDocs + (stats?.pendingDocuments || 0))) * 100}%` }}
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {/* SLA Compliance */}
        <Card variant="stat" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[13px] font-medium text-muted-foreground">Conformidade SLA</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {stats?.slaCompliance || 0}
                  <span className="text-base font-normal text-muted-foreground">%</span>
                </p>
              )}
              <div className="flex items-center gap-1.5">
                <Badge variant={(stats?.slaCompliance || 0) >= 95 ? "success" : "warning"} className="gap-0.5 text-[11px] px-1.5 py-0">
                  {(stats?.slaCompliance || 0) >= 95 ? "Dentro da meta" : "Abaixo da meta"}
                </Badge>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-info/8 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-info" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Meta: 95%</span>
              <span className={`font-medium ${(stats?.slaCompliance || 0) >= 95 ? "text-success" : "text-warning"}`}>
                {(stats?.slaCompliance || 0) >= 95 ? "Atingido" : "Em progresso"}
              </span>
            </div>
            <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${(stats?.slaCompliance || 0) >= 95 ? "bg-success" : "bg-warning"}`}
                style={{ width: `${Math.min(stats?.slaCompliance || 0, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Documentos por Unidade - Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Documentos por Unidade
              </CardTitle>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              {unitLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : !documentsByUnit?.length ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Sem dados disponíveis
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentsByUnit} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border)/0.5)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis 
                      dataKey="unidade" 
                      type="category" 
                      width={80} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }} 
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Documentos" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentos por Tipo - Pie Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Documentos por Tipo
              </CardTitle>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              {typeLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : !documentsByType?.length ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Sem dados disponíveis
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={documentsByType}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {documentsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }}
                      formatter={(value: number) => [value, ""]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={32}
                      formatter={(value) => <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "10px" }}>{value}</span>}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentos por Classificação - Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Documentos por Classificação
              </CardTitle>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              {classLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : !documentsByClassification?.length ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Sem dados disponíveis
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentsByClassification} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                    <XAxis 
                      dataKey="classificacao" 
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={55}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--popover))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }} 
                    />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" name="Documentos" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Documents - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentDocuments />
        </div>
        
        {/* Activity Feed - Takes 1 column */}
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Active Processes */}
      <ActiveProcesses />

      {/* Audit Log Reference */}
      <AuditLogReference context="Ver actividade recente do sistema" />
    </DashboardLayout>
  );
};

export default Index;
