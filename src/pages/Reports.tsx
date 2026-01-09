import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  Clock,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  Bell,
  Send,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";
import {
  useKPIStats,
  useProcessesTimeSeries,
  useDocumentsByType,
  useProcessesByUnit,
  useTopPerformers,
  useRecentActivity,
  useReportReferenceData,
  type ReportFilters,
} from "@/hooks/useReportsData";
import { ReportFiltersPanel } from "@/components/reports/ReportFiltersPanel";
import { ExportReportButton } from "@/components/reports/ExportReportButton";
import { ScheduledReportsModal } from "@/components/reports/ScheduledReportsModal";

const Reports = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
  });
  const [showScheduledReports, setShowScheduledReports] = useState(false);

  // Fetch reference data for filters
  const { units, processTypes, users, isLoading: isLoadingRef } = useReportReferenceData();

  // Fetch report data
  const { data: kpiStats, isLoading: isLoadingKPI, refetch: refetchKPI } = useKPIStats(filters);
  const { data: processesTimeSeries, isLoading: isLoadingTimeSeries } = useProcessesTimeSeries(filters);
  const { data: documentsByType, isLoading: isLoadingDocTypes } = useDocumentsByType(filters);
  const { data: processesByUnit, isLoading: isLoadingByUnit } = useProcessesByUnit(filters);
  const { data: topPerformers, isLoading: isLoadingPerformers } = useTopPerformers(filters);
  const { data: recentActivity, isLoading: isLoadingActivity } = useRecentActivity(filters);

  const isLoading = isLoadingKPI || isLoadingTimeSeries || isLoadingDocTypes || 
                    isLoadingByUnit || isLoadingPerformers || isLoadingActivity;

  const handleRefresh = () => {
    refetchKPI();
  };

  // Fallback for empty data
  const stats = kpiStats || {
    totalDocuments: 0,
    documentsChange: 0,
    totalProcesses: 0,
    processesChange: 0,
    avgProcessingTime: 0,
    processingTimeChange: 0,
    slaCompliance: 0,
    slaChange: 0,
    totalDispatches: 0,
    dispatchesChange: 0,
    pendingApprovals: 0,
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <ReportFiltersPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  units={units}
                  processTypes={processTypes}
                  users={users}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScheduledReports(true)}>
                  <Bell className="h-4 w-4 mr-2" />
                  Agendamentos
                </Button>
                <ExportReportButton
                  data={{
                    kpiStats: stats,
                    processesTimeSeries: processesTimeSeries || [],
                    documentsByType: documentsByType || [],
                    processesByUnit: processesByUnit || [],
                    topPerformers: topPerformers || [],
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              {isLoadingKPI ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Documentos</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalDocuments.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stats.documentsChange >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        stats.documentsChange >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {Math.abs(stats.documentsChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {isLoadingKPI ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Processos</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalProcesses.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stats.processesChange >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        stats.processesChange >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {Math.abs(stats.processesChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-success" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {isLoadingKPI ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Despachos</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalDispatches.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stats.dispatchesChange >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        stats.dispatchesChange >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {Math.abs(stats.dispatchesChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                    <Send className="h-6 w-6 text-info" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {isLoadingKPI ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-3xl font-bold mt-1">{stats.avgProcessingTime}<span className="text-lg text-muted-foreground ml-1">dias</span></p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">processos concluídos</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {isLoadingKPI ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SLA Compliance</p>
                    <p className="text-3xl font-bold mt-1">{stats.slaCompliance}%</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stats.pendingApprovals > 0 && (
                        <>
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <span className="text-xs text-warning">{stats.pendingApprovals} pendentes</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              )}
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
                  <CardDescription>Processos criados vs concluídos (últimos 12 meses)</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTimeSeries ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : processesTimeSeries && processesTimeSeries.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processesTimeSeries}>
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>Sem dados para o período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documentos por Tipo</CardTitle>
                  <CardDescription>Distribuição de documentos por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocTypes ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : documentsByType && documentsByType.length > 0 ? (
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>Sem dados para o período selecionado</p>
                    </div>
                  )}
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
                {isLoadingActivity ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : recentActivity && recentActivity.length > 0 ? (
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
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>Sem actividade recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Processes by Unit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Processos por Unidade</CardTitle>
                  <CardDescription>Distribuição por unidade orgânica</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingByUnit ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : processesByUnit && processesByUnit.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processesByUnit} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis type="category" dataKey="unit" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={100} />
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>Sem dados para o período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Process Types Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Estatísticas por Unidade</CardTitle>
                  <CardDescription>Resumo de conclusões e pendências</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingByUnit ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : processesByUnit && processesByUnit.length > 0 ? (
                    <div className="space-y-4">
                      {processesByUnit.slice(0, 6).map((unit, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{unit.unit}</span>
                            <span className="text-sm text-muted-foreground">{unit.total} total</span>
                          </div>
                          <div className="flex gap-1 h-2">
                            <div 
                              className="bg-success rounded-l"
                              style={{ width: `${(unit.concluidos / unit.total) * 100}%` }}
                            />
                            <div 
                              className="bg-warning rounded-r"
                              style={{ width: `${(unit.pendentes / unit.total) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="text-success">{unit.concluidos} concluídos</span>
                            <span className="text-warning">{unit.pendentes} pendentes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>Sem dados para o período selecionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {isLoadingDocTypes ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : documentsByType && documentsByType.length > 0 ? (
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
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sem documentos no período selecionado</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Top Performers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
                <CardDescription>Colaboradores com melhor desempenho no período</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPerformers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : topPerformers && topPerformers.length > 0 ? (
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
                          <tr key={performer.id} className="border-b border-border hover:bg-muted/50">
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
                                  {performer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="font-medium">{performer.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{performer.processos}</td>
                            <td className="px-4 py-3 text-sm">{performer.avgDias} dias</td>
                            <td className="px-4 py-3">
                              <Badge variant={performer.sla >= 95 ? "default" : performer.sla >= 90 ? "secondary" : "destructive"} className={performer.sla >= 95 ? "bg-success" : ""}>
                                {performer.sla}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sem dados de desempenho para o período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Scheduled Reports Modal */}
      <ScheduledReportsModal
        isOpen={showScheduledReports}
        onClose={() => setShowScheduledReports(false)}
      />
    </DashboardLayout>
  );
};

export default Reports;
