import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

interface TrendForecastChartsProps {
  unitId?: string;
}

// Simple linear regression function
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
    sumY2 += point.y * point.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const point of data) {
    const predicted = slope * point.x + intercept;
    ssRes += (point.y - predicted) ** 2;
    ssTot += (point.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// Predict future value
function predict(model: { slope: number; intercept: number }, x: number): number {
  return Math.max(0, Math.round(model.slope * x + model.intercept));
}

export function TrendForecastCharts({ unitId }: TrendForecastChartsProps) {
  // Fetch historical data for the last 12 months
  const { data: trendData, isLoading } = useQuery({
    queryKey: ["trend-forecast", unitId],
    queryFn: async () => {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        months.push(subMonths(new Date(), i));
      }

      const historicalData = [];

      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const monthStart = startOfMonth(month).toISOString();
        const monthEnd = endOfMonth(month).toISOString();
        const monthLabel = format(month, "MMM yy", { locale: pt });

        // Documents
        let docsQuery = supabase.from("documents")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd);
        if (unitId) docsQuery = docsQuery.eq("current_unit_id", unitId);
        const { count: docs } = await docsQuery;

        // Processes
        let procsQuery = supabase.from("processes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd);
        if (unitId) procsQuery = procsQuery.eq("current_unit_id", unitId);
        const { count: procs } = await procsQuery;

        // Dispatches
        let dispsQuery = supabase.from("dispatches")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd);
        if (unitId) dispsQuery = dispsQuery.eq("origin_unit_id", unitId);
        const { count: disps } = await dispsQuery;

        historicalData.push({
          month: monthLabel,
          monthIndex: i,
          documentos: docs || 0,
          processos: procs || 0,
          despachos: disps || 0,
          isHistorical: true,
        });
      }

      // Calculate trends using linear regression
      const docsRegression = linearRegression(
        historicalData.map(d => ({ x: d.monthIndex, y: d.documentos }))
      );
      const procsRegression = linearRegression(
        historicalData.map(d => ({ x: d.monthIndex, y: d.processos }))
      );
      const dispsRegression = linearRegression(
        historicalData.map(d => ({ x: d.monthIndex, y: d.despachos }))
      );

      // Generate predictions for next 3 months
      const forecastData = [];
      for (let i = 1; i <= 3; i++) {
        const futureMonth = addMonths(new Date(), i);
        const monthLabel = format(futureMonth, "MMM yy", { locale: pt });
        const monthIndex = 12 + i - 1;

        forecastData.push({
          month: monthLabel,
          monthIndex,
          documentos: null,
          processos: null,
          despachos: null,
          documentosForecast: predict(docsRegression, monthIndex),
          processosForecast: predict(procsRegression, monthIndex),
          despachosForecast: predict(dispsRegression, monthIndex),
          isHistorical: false,
        });
      }

      // Add trend line to historical data
      const historicalWithTrend = historicalData.map(d => ({
        ...d,
        documentosTrend: predict(docsRegression, d.monthIndex),
        processosTrend: predict(procsRegression, d.monthIndex),
        despachosTrend: predict(dispsRegression, d.monthIndex),
        documentosForecast: null,
        processosForecast: null,
        despachosForecast: null,
      }));

      // Combine historical and forecast data
      const combinedData = [...historicalWithTrend, ...forecastData.map(f => ({
        ...f,
        documentosTrend: predict(docsRegression, f.monthIndex),
        processosTrend: predict(procsRegression, f.monthIndex),
        despachosTrend: predict(dispsRegression, f.monthIndex),
      }))];

      return {
        data: combinedData,
        models: {
          documentos: docsRegression,
          processos: procsRegression,
          despachos: dispsRegression,
        },
        forecasts: {
          documentos: forecastData.map(f => f.documentosForecast),
          processos: forecastData.map(f => f.processosForecast),
          despachos: forecastData.map(f => f.despachosForecast),
        },
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getTrendIcon = (slope: number) => {
    if (slope > 0.5) return <TrendingUp className="h-4 w-4 text-success" />;
    if (slope < -0.5) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendLabel = (slope: number) => {
    if (slope > 0.5) return "Crescimento";
    if (slope < -0.5) return "Decrescimento";
    return "Estável";
  };

  const getTrendVariant = (slope: number): "default" | "secondary" | "destructive" | "outline" => {
    if (slope > 0.5) return "default";
    if (slope < -0.5) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      {!isLoading && trendData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documentos</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(trendData.models.documentos.slope)}
                    <Badge variant={getTrendVariant(trendData.models.documentos.slope)}>
                      {getTrendLabel(trendData.models.documentos.slope)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Previsão próx. mês</p>
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {trendData.forecasts.documentos[0]}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                R² = {(trendData.models.documentos.r2 * 100).toFixed(1)}% de confiança
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processos</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(trendData.models.processos.slope)}
                    <Badge variant={getTrendVariant(trendData.models.processos.slope)}>
                      {getTrendLabel(trendData.models.processos.slope)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Previsão próx. mês</p>
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {trendData.forecasts.processos[0]}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                R² = {(trendData.models.processos.r2 * 100).toFixed(1)}% de confiança
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despachos</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(trendData.models.despachos.slope)}
                    <Badge variant={getTrendVariant(trendData.models.despachos.slope)}>
                      {getTrendLabel(trendData.models.despachos.slope)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Previsão próx. mês</p>
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {trendData.forecasts.despachos[0]}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                R² = {(trendData.models.despachos.r2 * 100).toFixed(1)}% de confiança
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Charts */}
      <Tabs defaultValue="documentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          <TabsTrigger value="despachos">Despachos</TabsTrigger>
          <TabsTrigger value="combined">Visão Combinada</TabsTrigger>
        </TabsList>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência de Documentos</CardTitle>
              <CardDescription>Histórico de 12 meses com previsão de 3 meses baseada em regressão linear</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : trendData ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData.data}>
                      <defs>
                        <linearGradient id="colorDocsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <ReferenceLine x={format(new Date(), "MMM yy", { locale: pt })} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Hoje", fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Area type="monotone" dataKey="documentos" name="Documentos (Real)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorDocsArea)" />
                      <Line type="monotone" dataKey="documentosTrend" name="Linha de Tendência" stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="documentosForecast" name="Previsão" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <p>Sem dados disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência de Processos</CardTitle>
              <CardDescription>Histórico de 12 meses com previsão de 3 meses baseada em regressão linear</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : trendData ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData.data}>
                      <defs>
                        <linearGradient id="colorProcsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <ReferenceLine x={format(new Date(), "MMM yy", { locale: pt })} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Hoje", fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Area type="monotone" dataKey="processos" name="Processos (Real)" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorProcsArea)" />
                      <Line type="monotone" dataKey="processosTrend" name="Linha de Tendência" stroke="hsl(var(--success))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="processosForecast" name="Previsão" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <p>Sem dados disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despachos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendência de Despachos</CardTitle>
              <CardDescription>Histórico de 12 meses com previsão de 3 meses baseada em regressão linear</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : trendData ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData.data}>
                      <defs>
                        <linearGradient id="colorDispsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <ReferenceLine x={format(new Date(), "MMM yy", { locale: pt })} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Hoje", fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Area type="monotone" dataKey="despachos" name="Despachos (Real)" stroke="hsl(var(--info))" fillOpacity={1} fill="url(#colorDispsArea)" />
                      <Line type="monotone" dataKey="despachosTrend" name="Linha de Tendência" stroke="hsl(var(--info))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="despachosForecast" name="Previsão" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ fill: 'hsl(var(--warning))' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <p>Sem dados disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combined">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendências Combinadas</CardTitle>
              <CardDescription>Comparação de tendências e previsões para todos os tipos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : trendData ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <ReferenceLine x={format(new Date(), "MMM yy", { locale: pt })} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Hoje", fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      
                      {/* Historical Lines */}
                      <Line type="monotone" dataKey="documentos" name="Documentos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="processos" name="Processos" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="despachos" name="Despachos" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} />
                      
                      {/* Forecast Lines */}
                      <Line type="monotone" dataKey="documentosForecast" name="Previsão Docs" stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                      <Line type="monotone" dataKey="processosForecast" name="Previsão Procs" stroke="hsl(var(--success))" strokeDasharray="5 5" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                      <Line type="monotone" dataKey="despachosForecast" name="Previsão Desps" stroke="hsl(var(--info))" strokeDasharray="5 5" strokeWidth={2} dot={{ fill: 'hsl(var(--info))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <p>Sem dados disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
