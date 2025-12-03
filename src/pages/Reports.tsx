import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  CalendarIcon,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChartIcon,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { pt } from "date-fns/locale";

// Sample Data
const processesOverTime = [
  { month: "Jan", criados: 45, concluidos: 38, pendentes: 12 },
  { month: "Fev", criados: 52, concluidos: 45, pendentes: 15 },
  { month: "Mar", criados: 61, concluidos: 55, pendentes: 18 },
  { month: "Abr", criados: 48, concluidos: 52, pendentes: 14 },
  { month: "Mai", criados: 55, concluidos: 48, pendentes: 21 },
  { month: "Jun", criados: 67, concluidos: 62, pendentes: 26 },
  { month: "Jul", criados: 72, concluidos: 68, pendentes: 30 },
  { month: "Ago", criados: 58, concluidos: 55, pendentes: 33 },
  { month: "Set", criados: 63, concluidos: 60, pendentes: 36 },
  { month: "Out", criados: 70, concluidos: 65, pendentes: 41 },
  { month: "Nov", criados: 75, concluidos: 72, pendentes: 44 },
  { month: "Dez", criados: 68, concluidos: 70, pendentes: 42 },
];

const documentsByType = [
  { name: "Ofícios", value: 245, color: "hsl(var(--primary))" },
  { name: "Contratos", value: 156, color: "hsl(var(--success))" },
  { name: "Relatórios", value: 189, color: "hsl(var(--warning))" },
  { name: "Pareceres", value: 98, color: "hsl(var(--info))" },
  { name: "Despachos", value: 312, color: "hsl(var(--destructive))" },
  { name: "Outros", value: 78, color: "hsl(var(--muted-foreground))" },
];

const processesByUnit = [
  { unit: "Gabinete DG", total: 89, concluidos: 72, pendentes: 17 },
  { unit: "DAF", total: 156, concluidos: 134, pendentes: 22 },
  { unit: "DRH", total: 124, concluidos: 98, pendentes: 26 },
  { unit: "DTI", total: 78, concluidos: 65, pendentes: 13 },
  { unit: "DJ", total: 45, concluidos: 38, pendentes: 7 },
  { unit: "Operações", total: 98, concluidos: 85, pendentes: 13 },
];

const slaComplianceData = [
  { month: "Jan", compliance: 92 },
  { month: "Fev", compliance: 88 },
  { month: "Mar", compliance: 95 },
  { month: "Abr", compliance: 91 },
  { month: "Mai", compliance: 87 },
  { month: "Jun", compliance: 93 },
  { month: "Jul", compliance: 96 },
  { month: "Ago", compliance: 89 },
  { month: "Set", compliance: 94 },
  { month: "Out", compliance: 91 },
  { month: "Nov", compliance: 97 },
  { month: "Dez", compliance: 95 },
];

const avgProcessingTime = [
  { type: "Aprovação Despesas", dias: 3.2 },
  { type: "Contratação", dias: 18.5 },
  { type: "Aquisição Bens", dias: 12.3 },
  { type: "Férias", dias: 2.1 },
  { type: "Contratos", dias: 8.7 },
  { type: "Pareceres", dias: 5.4 },
];

const topPerformers = [
  { name: "Maria Santos", processos: 45, avgDias: 2.3, sla: 98 },
  { name: "João Costa", processos: 38, avgDias: 2.8, sla: 95 },
  { name: "Ana Rodrigues", processos: 42, avgDias: 3.1, sla: 92 },
  { name: "Pedro Almeida", processos: 35, avgDias: 2.5, sla: 96 },
  { name: "Teresa Gomes", processos: 31, avgDias: 3.5, sla: 89 },
];

const recentActivity = [
  { date: "Hoje", documentos: 23, processos: 12, despachos: 8 },
  { date: "Ontem", documentos: 31, processos: 15, despachos: 11 },
  { date: "2 dias", documentos: 28, processos: 9, despachos: 6 },
  { date: "3 dias", documentos: 19, processos: 11, despachos: 9 },
  { date: "4 dias", documentos: 25, processos: 14, despachos: 7 },
  { date: "5 dias", documentos: 22, processos: 8, despachos: 5 },
  { date: "6 dias", documentos: 17, processos: 10, despachos: 4 },
];

const Reports = () => {
  const [period, setPeriod] = useState("month");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // KPI Stats
  const stats = {
    totalDocuments: 1078,
    documentsChange: 12.5,
    totalProcesses: 734,
    processesChange: 8.3,
    avgProcessingTime: 4.2,
    processingTimeChange: -15.2,
    slaCompliance: 94.5,
    slaChange: 2.1,
  };

  return (
    <DashboardLayout
      title="Relatórios e Analytics"
      subtitle="Estatísticas e métricas de desempenho"
    >
      <PageBreadcrumb items={[{ label: "Relatórios" }]} />

      <div className="space-y-6">
        {/* Toolbar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                    <SelectItem value="quarter">Último Trimestre</SelectItem>
                    <SelectItem value="year">Último Ano</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-60 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Documentos</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalDocuments.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.documentsChange > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      stats.documentsChange > 0 ? "text-success" : "text-destructive"
                    )}>
                      {Math.abs(stats.documentsChange)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mês anterior</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Processos</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProcesses.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.processesChange > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      stats.processesChange > 0 ? "text-success" : "text-destructive"
                    )}>
                      {Math.abs(stats.processesChange)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mês anterior</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio (dias)</p>
                  <p className="text-3xl font-bold mt-1">{stats.avgProcessingTime}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.processingTimeChange < 0 ? (
                      <ArrowDownRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      stats.processingTimeChange < 0 ? "text-success" : "text-destructive"
                    )}>
                      {Math.abs(stats.processingTimeChange)}%
                    </span>
                    <span className="text-xs text-muted-foreground">mais rápido</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SLA Compliance</p>
                  <p className="text-3xl font-bold mt-1">{stats.slaCompliance}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.slaChange > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      stats.slaChange > 0 ? "text-success" : "text-destructive"
                    )}>
                      {Math.abs(stats.slaChange)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mês anterior</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="processes" className="gap-2">
              <Activity className="h-4 w-4" />
              Processos
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Zap className="h-4 w-4" />
              Desempenho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Processes Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evolução de Processos</CardTitle>
                  <CardDescription>Processos criados vs concluídos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={processesOverTime}>
                        <defs>
                          <linearGradient id="colorCriados" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Area type="monotone" dataKey="criados" name="Criados" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCriados)" />
                        <Area type="monotone" dataKey="concluidos" name="Concluídos" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorConcluidos)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Documents by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documentos por Tipo</CardTitle>
                  <CardDescription>Distribuição de documentos por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={documentsByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {documentsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividade Recente</CardTitle>
                <CardDescription>Volume de actividade nos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentActivity}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Processes by Unit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Processos por Unidade</CardTitle>
                  <CardDescription>Distribuição de processos por unidade orgânica</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processesByUnit} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="unit" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="concluidos" name="Concluídos" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="pendentes" name="Pendentes" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Average Processing Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tempo Médio de Processamento</CardTitle>
                  <CardDescription>Dias médios por tipo de processo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={avgProcessingTime} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="type" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={120} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value} dias`, 'Tempo Médio']}
                        />
                        <Bar dataKey="dias" name="Dias" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SLA Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SLA Compliance ao Longo do Tempo</CardTitle>
                <CardDescription>Percentagem de processos concluídos dentro do prazo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={slaComplianceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[80, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value}%`, 'SLA Compliance']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="compliance" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      {/* Target line */}
                      <Line 
                        type="monotone" 
                        dataKey={() => 90} 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Meta (90%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {documentsByType.map((doc, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{doc.name}</h3>
                      <Badge variant="secondary">{doc.value}</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(doc.value / Math.max(...documentsByType.map(d => d.value))) * 100}%`,
                          backgroundColor: doc.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {((doc.value / documentsByType.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}% do total
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Top Performers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
                <CardDescription>Colaboradores com melhor desempenho no período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colaborador</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Processos</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempo Médio</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPerformers.map((performer, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                              index === 0 && "bg-warning/20 text-warning",
                              index === 1 && "bg-muted text-muted-foreground",
                              index === 2 && "bg-orange-500/20 text-orange-500",
                              index > 2 && "bg-muted text-muted-foreground"
                            )}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {performer.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium">{performer.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{performer.processos}</td>
                          <td className="px-4 py-3 text-sm">{performer.avgDias} dias</td>
                          <td className="px-4 py-3">
                            <Badge variant={performer.sla >= 95 ? "success" : performer.sla >= 90 ? "warning" : "destructive"}>
                              {performer.sla}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
