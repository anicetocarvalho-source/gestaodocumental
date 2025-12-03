import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  History, 
  Search,
  Filter,
  Download,
  User,
  FileText,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Activity,
  Clock,
  X,
  Calendar,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  UserX,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  userId: string;
  action: string;
  actionType: "create" | "update" | "delete" | "login" | "logout" | "export" | "permission" | "error";
  object: string;
  objectType: string;
  objectId: string;
  details: string;
  ip: string;
  userAgent: string;
  severity: "info" | "warning" | "critical";
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
}

const logs: AuditLog[] = [
  { 
    id: 1, 
    timestamp: "2024-01-15 14:45:32",
    user: "Maria Santos", 
    userId: "USR-001",
    action: "Modificou permissões", 
    actionType: "permission",
    object: "Perfil Editor",
    objectType: "Perfil",
    objectId: "ROLE-002",
    details: "Adicionada permissão 'Eliminar' para Documentos",
    ip: "192.168.1.45",
    userAgent: "Chrome/Windows",
    severity: "warning",
    beforeData: { permissoes: ["ver", "criar", "editar"] },
    afterData: { permissoes: ["ver", "criar", "editar", "eliminar"] }
  },
  { 
    id: 2, 
    timestamp: "2024-01-15 14:30:15",
    user: "João Silva", 
    userId: "USR-002",
    action: "Criou documento", 
    actionType: "create",
    object: "Relatório Orçamental Q4.pdf",
    objectType: "Documento",
    objectId: "DOC-2024-001245",
    details: "Documento carregado para pasta Finanças",
    ip: "192.168.1.67",
    userAgent: "Firefox/MacOS",
    severity: "info",
    afterData: { titulo: "Relatório Orçamental Q4.pdf", tamanho: "2.4 MB", classificacao: "210.02" }
  },
  { 
    id: 3, 
    timestamp: "2024-01-15 14:15:08",
    user: "Sistema", 
    userId: "SYSTEM",
    action: "Login bem-sucedido", 
    actionType: "login",
    object: "Ana Costa",
    objectType: "Utilizador",
    objectId: "USR-003",
    details: "Autenticação via Chrome/Windows",
    ip: "192.168.1.89",
    userAgent: "Chrome/Windows",
    severity: "info"
  },
  { 
    id: 4, 
    timestamp: "2024-01-15 13:50:22",
    user: "Carlos Pereira", 
    userId: "USR-004",
    action: "Actualizou utilizador", 
    actionType: "update",
    object: "Pedro Machado",
    objectType: "Utilizador",
    objectId: "USR-006",
    details: "Alteração de perfil",
    ip: "192.168.1.34",
    userAgent: "Edge/Windows",
    severity: "warning",
    beforeData: { perfil: "Visualizador", unidade: "Gabinete Jurídico" },
    afterData: { perfil: "Editor", unidade: "Gabinete Jurídico" }
  },
  { 
    id: 5, 
    timestamp: "2024-01-15 13:20:45",
    user: "Luísa Fernandes", 
    userId: "USR-005",
    action: "Eliminou documento", 
    actionType: "delete",
    object: "Rascunho_Politica_v1.docx",
    objectType: "Documento",
    objectId: "DOC-2024-001180",
    details: "Documento removido permanentemente",
    ip: "192.168.1.56",
    userAgent: "Chrome/MacOS",
    severity: "warning",
    beforeData: { titulo: "Rascunho_Politica_v1.docx", estado: "rascunho", autor: "Luísa Fernandes" }
  },
  { 
    id: 6, 
    timestamp: "2024-01-15 12:45:10",
    user: "Teresa Gomes", 
    userId: "USR-007",
    action: "Exportou dados", 
    actionType: "export",
    object: "Lista de Utilizadores",
    objectType: "Relatório",
    objectId: "RPT-001",
    details: "Exportados 156 registos para CSV",
    ip: "192.168.1.78",
    userAgent: "Chrome/Windows",
    severity: "info"
  },
  { 
    id: 7, 
    timestamp: "2024-01-15 11:30:55",
    user: "António Ribeiro", 
    userId: "USR-008",
    action: "Modificou configurações", 
    actionType: "update",
    object: "Configuração do Sistema",
    objectType: "Configurações",
    objectId: "CONFIG-001",
    details: "Alteração de timeout de sessão",
    ip: "192.168.1.12",
    userAgent: "Firefox/Linux",
    severity: "warning",
    beforeData: { session_timeout: "15 minutos" },
    afterData: { session_timeout: "30 minutos" }
  },
  { 
    id: 8, 
    timestamp: "2024-01-15 10:15:30",
    user: "Sistema", 
    userId: "SYSTEM",
    action: "Tentativa de login falhada", 
    actionType: "error",
    object: "admin@gov.mz",
    objectType: "Autenticação",
    objectId: "AUTH-FAIL-001",
    details: "3 tentativas falhadas consecutivas",
    ip: "45.67.89.123",
    userAgent: "Unknown",
    severity: "critical"
  },
  { 
    id: 9, 
    timestamp: "2024-01-15 09:45:18",
    user: "Sistema", 
    userId: "SYSTEM",
    action: "Acesso não autorizado bloqueado", 
    actionType: "error",
    object: "/admin/settings",
    objectType: "Rota",
    objectId: "BLOCK-001",
    details: "Tentativa de acesso a área restrita sem permissão",
    ip: "192.168.1.99",
    userAgent: "Chrome/Windows",
    severity: "critical"
  },
  { 
    id: 10, 
    timestamp: "2024-01-15 09:00:00",
    user: "Sistema", 
    userId: "SYSTEM",
    action: "Logout por expiração", 
    actionType: "logout",
    object: "Maria Santos",
    objectType: "Sessão",
    objectId: "SESSION-001",
    details: "Sessão expirada após 30 minutos de inactividade",
    ip: "192.168.1.45",
    userAgent: "Chrome/Windows",
    severity: "info"
  },
];

const criticalIncidents = [
  { id: 1, type: "Tentativas de login falhadas", count: 12, trend: "+5", severity: "critical" },
  { id: 2, type: "Acessos não autorizados", count: 3, trend: "+1", severity: "critical" },
  { id: 3, type: "Exportações em massa", count: 8, trend: "-2", severity: "warning" },
  { id: 4, type: "Alterações de permissões", count: 15, trend: "+3", severity: "warning" },
];

const anomalousActivity = [
  { id: 1, user: "IP 45.67.89.123", activity: "15 tentativas de login em 5 minutos", time: "Hoje 10:15", severity: "critical" },
  { id: 2, user: "João Silva", activity: "Exportou 500+ documentos", time: "Ontem 18:30", severity: "warning" },
  { id: 3, user: "Conta inactiva USR-099", activity: "Tentativa de reactivação", time: "Ontem 14:20", severity: "warning" },
  { id: 4, user: "Sistema", activity: "Pico de acessos anómalo detectado", time: "12 Jan 09:00", severity: "info" },
];

const users = ["Maria Santos", "João Silva", "Ana Costa", "Carlos Pereira", "Luísa Fernandes", "Teresa Gomes", "António Ribeiro", "Sistema"];
const actionTypes = [
  { value: "create", label: "Criação" },
  { value: "update", label: "Actualização" },
  { value: "delete", label: "Eliminação" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "export", label: "Exportação" },
  { value: "permission", label: "Permissões" },
  { value: "error", label: "Erro/Bloqueio" },
];
const objectTypes = ["Documento", "Utilizador", "Perfil", "Configurações", "Autenticação", "Processo"];

const getActionIcon = (type: string) => {
  switch (type) {
    case "create": return Plus;
    case "update": return Pencil;
    case "delete": return Trash2;
    case "login": return LogIn;
    case "logout": return LogOut;
    case "export": return Download;
    case "permission": return Shield;
    case "error": return AlertTriangle;
    default: return History;
  }
};

const getActionBadgeVariant = (type: string): "success" | "warning" | "destructive" | "secondary" | "default" => {
  switch (type) {
    case "create": 
    case "login": return "success";
    case "update": 
    case "permission": return "warning";
    case "delete": 
    case "error": return "destructive";
    case "logout": 
    case "export": return "secondary";
    default: return "default";
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "text-destructive";
    case "warning": return "text-warning";
    default: return "text-muted-foreground";
  }
};

const AuditLogs = () => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterObject, setFilterObject] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const activeFiltersCount = [filterUser, filterAction, filterObject, filterDateFrom, filterDateTo].filter(Boolean).length;

  const clearFilters = () => {
    setFilterUser("");
    setFilterAction("");
    setFilterObject("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.object.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = !filterUser || log.user === filterUser;
    const matchesAction = !filterAction || log.actionType === filterAction;
    const matchesObject = !filterObject || log.objectType === filterObject;
    return matchesSearch && matchesUser && matchesAction && matchesObject;
  });

  return (
    <DashboardLayout 
      title="Registos de Actividade" 
      subtitle="Monitorizar todas as actividades e alterações do sistema"
    >
      <PageBreadcrumb 
        items={[
          { label: "Gestão de Utilizadores", href: "/users" },
          { label: "Registos de Actividade" }
        ]} 
      />

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Registos
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xl font-bold">1.284</p>
                  <p className="text-xs text-muted-foreground">Total Eventos</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">342</p>
                  <p className="text-xs text-muted-foreground">Criações</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-warning-muted rounded-lg flex items-center justify-center">
                  <Pencil className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">567</p>
                  <p className="text-xs text-muted-foreground">Modificações</p>
                </div>
              </div>
            </Card>
            <Card variant="stat">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold">15</p>
                  <p className="text-xs text-muted-foreground">Incidentes</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Pesquisar registos..." 
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant={showFilters ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Registos
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Utilizador</Label>
                    <Select value={filterUser} onValueChange={setFilterUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Acção</Label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {actionTypes.map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Objecto</Label>
                    <Select value={filterObject} onValueChange={setFilterObject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {objectTypes.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input 
                      type="date" 
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input 
                      type="date" 
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="w-10 px-4 py-3"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Utilizador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Acção
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Objecto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Detalhes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const IconComponent = getActionIcon(log.actionType);
                      const hasDetails = log.beforeData || log.afterData;
                      const isExpanded = expandedRows.has(log.id);

                      return (
                        <>
                          <tr 
                            key={log.id} 
                            className={cn(
                              "border-b border-border hover:bg-muted/50 transition-colors",
                              log.severity === "critical" && "bg-destructive/5",
                              isExpanded && "bg-muted/30"
                            )}
                          >
                            <td className="px-4 py-3">
                              {hasDetails && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => toggleRow(log.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap font-mono">
                              {log.timestamp}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                                  log.user === "Sistema" 
                                    ? "bg-muted text-muted-foreground" 
                                    : "bg-primary text-primary-foreground"
                                )}>
                                  {log.user === "Sistema" ? "⚙️" : log.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="text-sm font-medium text-foreground">{log.user}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <IconComponent className={cn("h-4 w-4", getSeverityColor(log.severity))} />
                                <Badge variant={getActionBadgeVariant(log.actionType)}>
                                  {log.action}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{log.object}</p>
                                <p className="text-xs text-muted-foreground">{log.objectType} • {log.objectId}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">
                              {log.details}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                              {log.ip}
                            </td>
                          </tr>
                          {/* Expanded Row - Before/After Data */}
                          {isExpanded && hasDetails && (
                            <tr key={`${log.id}-details`} className="bg-muted/20">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="grid grid-cols-2 gap-6 ml-10">
                                  {log.beforeData && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-destructive"></span>
                                        Antes
                                      </h4>
                                      <Card className="bg-destructive/5 border-destructive/20">
                                        <CardContent className="p-3">
                                          <pre className="text-xs font-mono text-foreground overflow-x-auto">
                                            {JSON.stringify(log.beforeData, null, 2)}
                                          </pre>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}
                                  {log.afterData && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-success"></span>
                                        Depois
                                      </h4>
                                      <Card className="bg-success/5 border-success/20">
                                        <CardContent className="p-3">
                                          <pre className="text-xs font-mono text-foreground overflow-x-auto">
                                            {JSON.stringify(log.afterData, null, 2)}
                                          </pre>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-10 mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>User Agent: {log.userAgent}</span>
                                  <span>•</span>
                                  <span>ID do Utilizador: {log.userId}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              A mostrar {filteredLogs.length} de 1.284 eventos
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">...</Button>
              <Button variant="outline" size="sm">161</Button>
              <Button variant="outline" size="sm">Seguinte</Button>
            </div>
          </div>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Incidents */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    Incidentes Críticos
                  </CardTitle>
                  <Badge variant="destructive">Últimas 24h</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalIncidents.map((incident) => (
                  <div 
                    key={incident.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      incident.severity === "critical" 
                        ? "bg-destructive/5 border-destructive/20" 
                        : "bg-warning/5 border-warning/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        incident.severity === "critical" ? "bg-destructive/10" : "bg-warning/10"
                      )}>
                        {incident.severity === "critical" ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{incident.type}</p>
                        <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{incident.count}</p>
                      <p className={cn(
                        "text-sm font-medium flex items-center justify-end gap-1",
                        incident.trend.startsWith("+") ? "text-destructive" : "text-success"
                      )}>
                        <TrendingUp className="h-3 w-3" />
                        {incident.trend}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Anomalous Activity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-warning" />
                    Actividade Anómala
                  </CardTitle>
                  <Button variant="outline" size="sm">Ver Todas</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {anomalousActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      activity.severity === "critical" 
                        ? "bg-destructive/10" 
                        : activity.severity === "warning" 
                          ? "bg-warning/10" 
                          : "bg-muted"
                    )}>
                      {activity.severity === "critical" ? (
                        <UserX className="h-5 w-5 text-destructive" />
                      ) : activity.severity === "warning" ? (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      ) : (
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.activity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline Chart Placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Actividade do Sistema (7 dias)</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">7 dias</Button>
                  <Button variant="ghost" size="sm">30 dias</Button>
                  <Button variant="ghost" size="sm">90 dias</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Gráfico de actividade</p>
                  <p className="text-sm text-muted-foreground">Visualização temporal das actividades do sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-info-muted rounded-lg flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">89</p>
                    <p className="text-xs text-muted-foreground">Logins Hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-success-muted rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">142</p>
                    <p className="text-xs text-muted-foreground">Utilizadores Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-warning-muted rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">5</p>
                    <p className="text-xs text-muted-foreground">Contas Bloqueadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Alertas Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AuditLogs;
