import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  MailOpen,
  RefreshCw,
  X,
  Info,
  AlertTriangle,
  ArrowLeftRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications,
  useRealtimeNotificationsSubscription,
  Notification,
} from "@/hooks/useNotifications";

const Notifications = () => {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Hooks
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  // Enable realtime subscription
  useRealtimeNotificationsSubscription();

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "unread" && !n.is_read);
    return matchesSearch && matchesTab;
  });

  // Actions
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onSuccess: () => toast.success("Notificação marcada como lida"),
    });
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id, {
      onSuccess: () => toast.success("Notificação eliminada"),
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => toast.success("Todas as notificações marcadas como lidas"),
    });
  };

  const handleClearAll = () => {
    clearAll.mutate(undefined, {
      onSuccess: () => toast.success("Todas as notificações eliminadas"),
    });
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => markAsRead.mutate(id));
    setSelectedNotifications(new Set());
    toast.success(`${selectedNotifications.size} notificações marcadas como lidas`);
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => deleteNotification.mutate(id));
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
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info": return <Info className="h-5 w-5 text-info" />;
      case "success": return <CheckCircle className="h-5 w-5 text-success" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "error": return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "movement": return <ArrowLeftRight className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: string; label: string }> = {
      info: { variant: "info", label: "Informação" },
      success: { variant: "success", label: "Sucesso" },
      warning: { variant: "warning", label: "Aviso" },
      error: { variant: "destructive", label: "Erro" },
      movement: { variant: "default", label: "Movimentação" },
    };
    const config = variants[type] || { variant: "secondary", label: type };
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
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'movement').length}
                </p>
                <p className="text-xs text-muted-foreground">Movimentações</p>
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

                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchQuery("")}
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
                    <Button variant="outline" size="sm" onClick={handleMarkSelectedAsRead}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marcar como lidas
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDeleteSelected}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marcar todas como lidas
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={handleClearAll}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar todas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-start gap-4 px-4 py-4">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length > 0 ? (
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
                          !notification.is_read && "bg-primary/5",
                          selectedNotifications.has(notification.id) && "bg-primary/10"
                        )}
                      >
                        <Checkbox
                          checked={selectedNotifications.has(notification.id)}
                          onCheckedChange={() => toggleSelection(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div 
                          className="flex-1 flex items-start gap-4"
                          onClick={() => openDetail(notification)}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                            notification.type === 'movement' && "bg-primary/10",
                            notification.type === 'warning' && "bg-warning/10",
                            notification.type === 'success' && "bg-success/10",
                            notification.type === 'error' && "bg-destructive/10",
                            notification.type === 'info' && "bg-info/10",
                          )}>
                            {getTypeIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h3 className={cn(
                                  "text-sm font-medium truncate",
                                  !notification.is_read && "font-semibold"
                                )}>
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true, 
                                  locale: pt 
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.reference_type === 'document' && notification.reference_id && (
                              <Link 
                                to={`/documents/${notification.reference_id}`}
                                className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-3 w-3" />
                                Ver documento
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.is_read && (
                              <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como lida
                              </DropdownMenuItem>
                            )}
                            {notification.reference_type === 'document' && notification.reference_id && (
                              <DropdownMenuItem asChild>
                                <Link to={`/documents/${notification.reference_id}`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver documento
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium text-lg mb-1">Sem notificações</h3>
                    <p className="text-muted-foreground text-sm">
                      {activeTab === "unread" 
                        ? "Não tem notificações por ler."
                        : "Ainda não recebeu nenhuma notificação."
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedNotification && getTypeIcon(selectedNotification.type)}
              <div>
                <DialogTitle>{selectedNotification?.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3" />
                  {selectedNotification && format(new Date(selectedNotification.created_at), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedNotification && getTypeBadge(selectedNotification.type)}
              {selectedNotification?.is_read ? (
                <Badge variant="outline" className="text-success">
                  <MailOpen className="h-3 w-3 mr-1" />
                  Lida
                </Badge>
              ) : (
                <Badge variant="outline" className="text-warning">
                  <Mail className="h-3 w-3 mr-1" />
                  Não lida
                </Badge>
              )}
            </div>
            
            <p className="text-muted-foreground">{selectedNotification?.message}</p>
          </div>

          <DialogFooter>
            {selectedNotification?.reference_type === 'document' && selectedNotification.reference_id && (
              <Button asChild>
                <Link to={`/documents/${selectedNotification.reference_id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Documento
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Notifications;
