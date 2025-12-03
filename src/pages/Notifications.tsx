import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Search,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  FileText,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Settings,
  Mail,
  MailOpen,
  Archive,
  Star,
  StarOff,
  RefreshCw,
  X,
  BellOff,
  Info,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

// Types
interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "task" | "document" | "process" | "system";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  link?: string;
  sender?: string;
  category: "geral" | "documentos" | "processos" | "tarefas" | "sistema";
}

// Sample Data
const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "task",
    title: "Nova tarefa atribuída",
    message: "Foi-lhe atribuída a tarefa 'Revisão de Contrato XYZ' com prazo até 20/01/2024.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isRead: false,
    isStarred: true,
    sender: "Maria Santos",
    category: "tarefas",
  },
  {
    id: "2",
    type: "document",
    title: "Documento requer aprovação",
    message: "O documento 'Relatório Financeiro Q4 2024' aguarda a sua aprovação.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
    isStarred: false,
    sender: "João Costa",
    category: "documentos",
  },
  {
    id: "3",
    type: "success",
    title: "Processo concluído",
    message: "O processo 'Aquisição de Equipamentos' foi concluído com sucesso.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: false,
    isStarred: false,
    category: "processos",
  },
  {
    id: "4",
    type: "warning",
    title: "Prazo a expirar",
    message: "O prazo para a tarefa 'Parecer Jurídico' expira em 24 horas.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isRead: true,
    isStarred: true,
    category: "tarefas",
  },
  {
    id: "5",
    type: "process",
    title: "Novo despacho recebido",
    message: "Recebeu um novo despacho do Gabinete do Director-Geral referente ao processo PROC-2024-0089.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    isRead: true,
    isStarred: false,
    sender: "Dr. António Silva",
    category: "processos",
  },
  {
    id: "6",
    type: "info",
    title: "Actualização do sistema",
    message: "O sistema será actualizado no dia 25/01/2024 das 02:00 às 04:00. Durante este período, o acesso estará indisponível.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
    isStarred: false,
    category: "sistema",
  },
  {
    id: "7",
    type: "error",
    title: "Falha na sincronização",
    message: "A sincronização do documento 'Contrato ABC' falhou. Por favor, tente novamente.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    isRead: true,
    isStarred: false,
    category: "sistema",
  },
  {
    id: "8",
    type: "document",
    title: "Documento partilhado",
    message: "Ana Rodrigues partilhou o documento 'Proposta Orçamento 2025' consigo.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    isRead: true,
    isStarred: false,
    sender: "Ana Rodrigues",
    category: "documentos",
  },
  {
    id: "9",
    type: "task",
    title: "Lembrete de tarefa",
    message: "A tarefa 'Submeter Relatório Mensal' vence amanhã.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    isRead: true,
    isStarred: false,
    category: "tarefas",
  },
  {
    id: "10",
    type: "success",
    title: "Aprovação concedida",
    message: "O seu pedido de férias foi aprovado por Carlos Ferreira.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    isRead: true,
    isStarred: true,
    sender: "Carlos Ferreira",
    category: "geral",
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Stats
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const starredCount = notifications.filter(n => n.isStarred).length;

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || n.category === categoryFilter;
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "unread" && !n.isRead) ||
      (activeTab === "starred" && n.isStarred);
    return matchesSearch && matchesCategory && matchesTab;
  });

  // Actions
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAsUnread = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: false } : n
    ));
  };

  const toggleStar = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isStarred: !n.isStarred } : n
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success("Notificação eliminada");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success("Todas as notificações marcadas como lidas");
  };

  const markSelectedAsRead = () => {
    setNotifications(notifications.map(n => 
      selectedNotifications.has(n.id) ? { ...n, isRead: true } : n
    ));
    setSelectedNotifications(new Set());
    toast.success(`${selectedNotifications.size} notificações marcadas como lidas`);
  };

  const deleteSelected = () => {
    setNotifications(notifications.filter(n => !selectedNotifications.has(n.id)));
    toast.success(`${selectedNotifications.size} notificações eliminadas`);
    setSelectedNotifications(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const openDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info": return <Info className="h-5 w-5 text-info" />;
      case "success": return <CheckCircle className="h-5 w-5 text-success" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "error": return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "task": return <ClipboardList className="h-5 w-5 text-primary" />;
      case "document": return <FileText className="h-5 w-5 text-primary" />;
      case "process": return <ClipboardList className="h-5 w-5 text-success" />;
      case "system": return <Settings className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: Notification["type"]) => {
    const variants: Record<Notification["type"], { variant: string; label: string }> = {
      info: { variant: "info", label: "Informação" },
      success: { variant: "success", label: "Sucesso" },
      warning: { variant: "warning", label: "Aviso" },
      error: { variant: "destructive", label: "Erro" },
      task: { variant: "default", label: "Tarefa" },
      document: { variant: "secondary", label: "Documento" },
      process: { variant: "outline", label: "Processo" },
      system: { variant: "secondary", label: "Sistema" },
    };
    const config = variants[type];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout
      title="Centro de Notificações"
      subtitle="Gerir todas as suas notificações"
    >
      <PageBreadcrumb items={[{ label: "Notificações" }]} />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Não lidas</p>
              </div>
            </div>
          </Card>
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <MailOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                <p className="text-xs text-muted-foreground">Lidas</p>
              </div>
            </div>
          </Card>
          <Card variant="stat">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{starredCount}</p>
                <p className="text-xs text-muted-foreground">Favoritas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar notificações..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="documentos">Documentos</SelectItem>
                    <SelectItem value="processos">Processos</SelectItem>
                    <SelectItem value="tarefas">Tarefas</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || categoryFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedNotifications.size > 0 ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedNotifications.size} seleccionadas
                    </span>
                    <Button variant="outline" size="sm" onClick={markSelectedAsRead}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marcar como lidas
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteSelected}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marcar todas como lidas
                    </Button>
                    <Button variant="outline" size="icon-sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              Todas
              <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Mail className="h-4 w-4" />
              Não lidas
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="starred" className="gap-2">
              <Star className="h-4 w-4" />
              Favoritas
              {starredCount > 0 && (
                <Badge variant="warning" className="ml-1">{starredCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {/* Select All Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
                      <Checkbox
                        checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedNotifications.size > 0 
                          ? `${selectedNotifications.size} de ${filteredNotifications.length} seleccionadas`
                          : "Seleccionar todas"
                        }
                      </span>
                    </div>

                    {/* Notification Items */}
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer",
                          !notification.isRead && "bg-primary/5",
                          selectedNotifications.has(notification.id) && "bg-primary/10"
                        )}
                      >
                        <Checkbox
                          checked={selectedNotifications.has(notification.id)}
                          onCheckedChange={() => toggleSelection(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <button
                          className="flex-shrink-0 mt-0.5"
                          onClick={(e) => { e.stopPropagation(); toggleStar(notification.id); }}
                        >
                          {notification.isStarred ? (
                            <Star className="h-5 w-5 text-warning fill-warning" />
                          ) : (
                            <StarOff className="h-5 w-5 text-muted-foreground hover:text-warning" />
                          )}
                        </button>

                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => openDetail(notification)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                                notification.type === "info" && "bg-info/10",
                                notification.type === "success" && "bg-success/10",
                                notification.type === "warning" && "bg-warning/10",
                                notification.type === "error" && "bg-destructive/10",
                                (notification.type === "task" || notification.type === "document" || notification.type === "process") && "bg-primary/10",
                                notification.type === "system" && "bg-muted"
                              )}>
                                {getTypeIcon(notification.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "text-sm",
                                    !notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {!notification.isRead && (
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  {getTypeBadge(notification.type)}
                                  {notification.sender && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {notification.sender}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: pt })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-popover">
                                {notification.isRead ? (
                                  <DropdownMenuItem onClick={() => markAsUnread(notification.id)}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Marcar como não lida
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                    <MailOpen className="mr-2 h-4 w-4" />
                                    Marcar como lida
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => toggleStar(notification.id)}>
                                  {notification.isStarred ? (
                                    <>
                                      <StarOff className="mr-2 h-4 w-4" />
                                      Remover favorito
                                    </>
                                  ) : (
                                    <>
                                      <Star className="mr-2 h-4 w-4" />
                                      Adicionar favorito
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <BellOff className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Nenhuma notificação</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "unread" 
                        ? "Todas as notificações foram lidas" 
                        : activeTab === "starred"
                        ? "Nenhuma notificação marcada como favorita"
                        : "Não tem notificações no momento"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    selectedNotification.type === "info" && "bg-info/10",
                    selectedNotification.type === "success" && "bg-success/10",
                    selectedNotification.type === "warning" && "bg-warning/10",
                    selectedNotification.type === "error" && "bg-destructive/10",
                    (selectedNotification.type === "task" || selectedNotification.type === "document" || selectedNotification.type === "process") && "bg-primary/10",
                    selectedNotification.type === "system" && "bg-muted"
                  )}>
                    {getTypeIcon(selectedNotification.type)}
                  </div>
                  {getTypeBadge(selectedNotification.type)}
                </div>
                <DialogTitle>{selectedNotification.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 pt-2">
                  {selectedNotification.sender && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedNotification.sender}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(selectedNotification.timestamp, { addSuffix: true, locale: pt })}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>
              <DialogFooter className="flex-row justify-between sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStar(selectedNotification.id)}
                  >
                    {selectedNotification.isStarred ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Remover favorito
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Favorito
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      deleteNotification(selectedNotification.id);
                      setDetailDialogOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
                <Button onClick={() => setDetailDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Notifications;
