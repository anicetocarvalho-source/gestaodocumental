import { useState } from "react";
import { format, parseISO, isToday, isYesterday, isThisWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Calendar,
  FileText,
  Filter,
  Building2,
  User,
  Clock,
  RotateCcw,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Archive,
  RefreshCw,
  Info,
  FileCheck,
  List,
  LayoutGrid,
  BarChart3,
  Search,
} from "lucide-react";
import { useMovements, actionTypeLabels, MovementFilters } from "@/hooks/useMovements";
import { useOrganizationalUnits, useProfiles } from "@/hooks/useReferenceData";
import { Link } from "react-router-dom";
import { MovementStats } from "@/components/movements/MovementStats";
import { MovementTable } from "@/components/movements/MovementTable";
import { ExportMovements } from "@/components/movements/ExportMovements";

const actionTypeIcons: Record<string, React.ElementType> = {
  despacho: ArrowRight,
  encaminhamento: ArrowLeftRight,
  recebimento: CheckCircle2,
  devolucao: RotateCcw,
  arquivamento: Archive,
  reativacao: RefreshCw,
  informacao: Info,
  parecer: FileCheck,
};

const actionTypeColors: Record<string, string> = {
  despacho: "bg-primary/10 text-primary border-primary/20",
  encaminhamento: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  recebimento: "bg-success/10 text-success border-success/20",
  devolucao: "bg-warning/10 text-warning border-warning/20",
  arquivamento: "bg-muted text-muted-foreground border-border",
  reativacao: "bg-success/10 text-success border-success/20",
  informacao: "bg-info/10 text-info border-info/20",
  parecer: "bg-primary/10 text-primary border-primary/20",
};

const priorityVariants: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-secondary/10 text-secondary-foreground border-secondary/30",
};

interface ExtendedMovementFilters extends MovementFilters {
  userId?: string;
  search?: string;
  readStatus?: string;
}

export default function MovementHistory() {
  const [filters, setFilters] = useState<ExtendedMovementFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");
  
  const { data: movements, isLoading } = useMovements(filters);
  const { data: units } = useOrganizationalUnits({ activeOnly: true });
  const { data: profiles } = useProfiles({ activeOnly: true });

  const handleFilterChange = (key: keyof ExtendedMovementFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasFilters = Object.values(filters).some(v => v);

  // Apply client-side filters for userId and search
  const filteredMovements = movements?.filter(m => {
    if (filters.userId) {
      const matchesUser = m.from_user?.id === filters.userId || m.to_user?.id === filters.userId;
      if (!matchesUser) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        m.document?.title?.toLowerCase().includes(searchLower) ||
        m.document?.entry_number?.toLowerCase().includes(searchLower) ||
        m.dispatch_text?.toLowerCase().includes(searchLower) ||
        m.notes?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (filters.readStatus) {
      if (filters.readStatus === "read" && !m.is_read) return false;
      if (filters.readStatus === "unread" && m.is_read) return false;
    }
    return true;
  }) || [];

  // Group movements by date
  const groupedMovements = filteredMovements.reduce((acc, movement) => {
    const date = format(parseISO(movement.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(movement);
    return acc;
  }, {} as Record<string, typeof movements>);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    if (isThisWeek(date)) return format(date, "EEEE", { locale: pt });
    return format(date, "d 'de' MMMM", { locale: pt });
  };

  return (
    <DashboardLayout title="Histórico de Movimentações" subtitle="Timeline de todas as movimentações de documentos">
      <div className="space-y-6">
        <PageBreadcrumb
          items={[
            { label: "Painel", href: "/" },
            { label: "Histórico de Movimentações" },
          ]}
        />

        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Tabela
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <ExportMovements movements={filteredMovements} isLoading={isLoading} />
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasFilters && (
                <Badge variant="default" className="ml-2 h-5 w-5 p-0 justify-center">
                  {Object.values(filters).filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filtros Avançados</CardTitle>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                {/* Search */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm">Pesquisar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nº documento, título, despacho..."
                      className="pl-9"
                      value={filters.search || ""}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Date From */}
                <div className="space-y-2">
                  <Label className="text-sm">Data Início</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>
                
                {/* Date To */}
                <div className="space-y-2">
                  <Label className="text-sm">Data Fim</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
                
                {/* Unit */}
                <div className="space-y-2">
                  <Label className="text-sm">Unidade</Label>
                  <Select
                    value={filters.unitId || "all"}
                    onValueChange={(v) => handleFilterChange("unitId", v === "all" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as unidades</SelectItem>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.code} - {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Action Type */}
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de Acção</Label>
                  <Select
                    value={filters.actionType || "all"}
                    onValueChange={(v) => handleFilterChange("actionType", v === "all" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(actionTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User */}
                <div className="space-y-2">
                  <Label className="text-sm">Utilizador</Label>
                  <Select
                    value={filters.userId || "all"}
                    onValueChange={(v) => handleFilterChange("userId", v === "all" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os utilizadores</SelectItem>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Read Status */}
                <div className="space-y-2">
                  <Label className="text-sm">Estado Leitura</Label>
                  <Select
                    value={filters.readStatus || "all"}
                    onValueChange={(v) => handleFilterChange("readStatus", v === "all" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="read">Lidos</SelectItem>
                      <SelectItem value="unread">Não lidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content based on active tab */}
        {activeTab === "stats" && (
          <MovementStats movements={filteredMovements} isLoading={isLoading} />
        )}

        {activeTab === "table" && (
          <Card>
            <CardContent className="p-6">
              <MovementTable movements={filteredMovements} isLoading={isLoading} />
            </CardContent>
          </Card>
        )}

        {activeTab === "timeline" && (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                {isLoading ? (
                  <div className="p-6 space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredMovements.length === 0 ? (
                  <div className="p-12 text-center">
                    <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-1">Nenhuma movimentação encontrada</h3>
                    <p className="text-muted-foreground text-sm">
                      {hasFilters 
                        ? "Tente ajustar os filtros para ver mais resultados."
                        : "As movimentações de documentos aparecerão aqui."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {groupedMovements && Object.entries(groupedMovements).map(([date, dayMovements]) => (
                      <div key={date} className="py-4">
                        <div className="px-6 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">
                              {getDateLabel(date)}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {dayMovements?.length} movimentações
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-[39px] top-0 bottom-0 w-px bg-border" />
                          
                          <div className="space-y-0">
                            {dayMovements?.map((movement, index) => {
                              const Icon = actionTypeIcons[movement.action_type] || ArrowRight;
                              const colorClass = actionTypeColors[movement.action_type] || "bg-muted text-muted-foreground";
                              
                              return (
                                <div key={movement.id} className="relative pl-6 pr-6 py-3 hover:bg-muted/30 transition-colors">
                                  {/* Timeline dot */}
                                  <div className={`absolute left-[30px] w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center z-10 ${colorClass}`}>
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  
                                  <div className="ml-10">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        {/* Action type badge */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <Badge variant="outline" className={colorClass}>
                                            {actionTypeLabels[movement.action_type] || movement.action_type}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            <Clock className="inline h-3 w-3 mr-1" />
                                            {format(parseISO(movement.created_at), "HH:mm")}
                                          </span>
                                          {movement.is_read && (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                          )}
                                        </div>
                                        
                                        {/* Document link */}
                                        {movement.document && (
                                          <Link 
                                            to={`/documents/${movement.document.id}`}
                                            className="group flex items-center gap-2 mb-2"
                                          >
                                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                            <span className="font-medium group-hover:text-primary truncate">
                                              {movement.document.entry_number}
                                            </span>
                                            <span className="text-muted-foreground truncate">
                                              - {movement.document.title}
                                            </span>
                                            {movement.document.priority !== 'normal' && (
                                              <Badge variant="outline" className={priorityVariants[movement.document.priority]}>
                                                {movement.document.priority === 'urgent' ? 'Urgente' : 
                                                 movement.document.priority === 'high' ? 'Alta' : 'Baixa'}
                                              </Badge>
                                            )}
                                          </Link>
                                        )}
                                        
                                        {/* Movement details */}
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                          {movement.from_unit && (
                                            <span className="flex items-center gap-1">
                                              <Building2 className="h-3.5 w-3.5" />
                                              {movement.from_unit.code}
                                            </span>
                                          )}
                                          {(movement.from_unit || movement.from_user) && movement.to_unit && (
                                            <ArrowRight className="h-3.5 w-3.5" />
                                          )}
                                          {movement.to_unit && (
                                            <span className="flex items-center gap-1">
                                              <Building2 className="h-3.5 w-3.5" />
                                              {movement.to_unit.code}
                                            </span>
                                          )}
                                          {movement.to_user && (
                                            <span className="flex items-center gap-1 ml-2">
                                              <User className="h-3.5 w-3.5" />
                                              {movement.to_user.full_name}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {/* Dispatch text or notes */}
                                        {(movement.dispatch_text || movement.notes) && (
                                          <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2 border-l-2 border-primary/30">
                                            {movement.dispatch_text || movement.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
