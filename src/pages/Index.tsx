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
  AlertCircle,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
  Filter,
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
  LineChart,
  Line,
} from "recharts";

// KPI Data
const kpiData = {
  documentosProcessados: { value: 1284, trend: 12, target: 1500 },
  tempoMedioTramitacao: { value: 3.2, trend: -8, unit: "dias" },
  processosConcluidos: { value: 156, pendentes: 47 },
  slaCompliance: { value: 94.5, trend: 2.3 },
};

// Chart Data
const processosPorUnidade = [
  { unidade: "Finanças", concluidos: 45, pendentes: 12 },
  { unidade: "RH", concluidos: 32, pendentes: 8 },
  { unidade: "Jurídico", concluidos: 28, pendentes: 15 },
  { unidade: "TI", concluidos: 22, pendentes: 5 },
  { unidade: "Operações", concluidos: 18, pendentes: 4 },
  { unidade: "Comunicação", concluidos: 11, pendentes: 3 },
];

const processosPorTipo = [
  { name: "Expediente", value: 35, color: "hsl(var(--primary))" },
  { name: "Contratação", value: 25, color: "hsl(var(--info))" },
  { name: "Parecer", value: 20, color: "hsl(var(--success))" },
  { name: "Autorização", value: 12, color: "hsl(var(--warning))" },
  { name: "Outros", value: 8, color: "hsl(var(--muted-foreground))" },
];

const documentosPorClassificacao = [
  { classificacao: "100 - Admin", quantidade: 320 },
  { classificacao: "200 - Finanças", quantidade: 280 },
  { classificacao: "300 - Jurídico", quantidade: 190 },
  { classificacao: "400 - Específico", quantidade: 245 },
  { classificacao: "500 - Projectos", quantidade: 150 },
  { classificacao: "Outros", quantidade: 99 },
];

const Index = () => {
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2024-01-15");
  const [selectedPeriod, setSelectedPeriod] = useState("mes");

  const handleExport = (format: string) => {
    console.log(`Exporting dashboard data as ${format}`);
  };

  return (
    <DashboardLayout 
      title="Dashboard Institucional" 
      subtitle="Visão geral do sistema de gestão documental"
    >
      <PageBreadcrumb items={[{ label: "Dashboard" }]} />

      {/* Filters and Export Bar */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Período:</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
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
                      className="w-36"
                    />
                  </div>
                  <span className="text-muted-foreground">até</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36"
                  />
                </>
              )}
              <Button variant="ghost" size="icon-sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Documentos Processados */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documentos Processados</p>
                <p className="text-3xl font-bold text-foreground mt-2">{kpiData.documentosProcessados.value.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{kpiData.documentosProcessados.trend}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs mês anterior</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Meta: {kpiData.documentosProcessados.target.toLocaleString()}</span>
                <span>{Math.round((kpiData.documentosProcessados.value / kpiData.documentosProcessados.target) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((kpiData.documentosProcessados.value / kpiData.documentosProcessados.target) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tempo Médio de Tramitação */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio Tramitação</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {kpiData.tempoMedioTramitacao.value}
                  <span className="text-lg font-normal text-muted-foreground ml-1">{kpiData.tempoMedioTramitacao.unit}</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {kpiData.tempoMedioTramitacao.trend}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">mais rápido</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-info" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Meta: 5 dias</span>
              <Badge variant="outline" className="ml-auto">Dentro da meta</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Processos Concluídos vs Pendentes */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processos</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-success">{kpiData.processosConcluidos.value}</p>
                  <span className="text-muted-foreground">/</span>
                  <p className="text-xl font-semibold text-warning">{kpiData.processosConcluidos.pendentes}</p>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success"></span>
                    Concluídos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-warning"></span>
                    Pendentes
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-success"
                  style={{ width: `${(kpiData.processosConcluidos.value / (kpiData.processosConcluidos.value + kpiData.processosConcluidos.pendentes)) * 100}%` }}
                />
                <div 
                  className="h-full bg-warning"
                  style={{ width: `${(kpiData.processosConcluidos.pendentes / (kpiData.processosConcluidos.value + kpiData.processosConcluidos.pendentes)) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conformidade SLA</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {kpiData.slaCompliance.value}
                  <span className="text-lg font-normal text-muted-foreground">%</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{kpiData.slaCompliance.trend}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs trimestre</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Meta: 95%</span>
                <span className={kpiData.slaCompliance.value >= 95 ? "text-success" : "text-warning"}>
                  {kpiData.slaCompliance.value >= 95 ? "Atingido" : "Em progresso"}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${kpiData.slaCompliance.value >= 95 ? "bg-success" : "bg-warning"}`}
                  style={{ width: `${Math.min(kpiData.slaCompliance.value, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-6">
        {/* Processos por Unidade - Bar Chart */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Processos por Unidade
              </CardTitle>
              <Button variant="ghost" size="icon-sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processosPorUnidade} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis 
                    dataKey="unidade" 
                    type="category" 
                    width={70} 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }} 
                  />
                  <Bar dataKey="concluidos" fill="hsl(var(--success))" name="Concluídos" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pendentes" fill="hsl(var(--warning))" name="Pendentes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Processos por Tipo - Pie Chart */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Processos por Tipo
              </CardTitle>
              <Button variant="ghost" size="icon-sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={processosPorTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {processosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: "11px" }}>{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Documentos por Classificação - Bar Chart */}
        <Card className="xl:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Documentos por Classificação
              </CardTitle>
              <Button variant="ghost" size="icon-sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentosPorClassificacao} margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="classificacao" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }} 
                  />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" name="Documentos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
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
      <div className="mb-6">
        <ActiveProcesses />
      </div>

      {/* Audit Log Reference */}
      <div>
        <AuditLogReference context="Ver actividade recente do sistema" />
      </div>
    </DashboardLayout>
  );
};

export default Index;
