import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole, roleLabels } from "@/hooks/useUserRole";
import { usePendingApprovalsCount } from "@/hooks/usePendingApprovalsCount";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  ClipboardList,
  Archive,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  Users,
  Package,
  CheckSquare,
  ScanLine,
  GitBranch,
  Layers,
  FileCheck,
  BarChart3,
  FileSearch,
  Tags,
  Bot,
  History,
  LucideIcon,
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeInfo {
  count: number;
  urgent: number;
  hasUrgent: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
  badge?: BadgeInfo;
}

const navigation: NavItem[] = [
  { name: "Painel", href: "/", icon: LayoutDashboard, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Documentos", href: "/documents", icon: FileText, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Processos", href: "/processes", icon: ClipboardList, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Expedições", href: "/dispatches", icon: Package, roles: ["admin", "gestor", "tecnico"] },
  { name: "Aprovações", href: "/approvals", icon: CheckSquare, roles: ["admin", "gestor"] },
  { name: "Assistente IA", href: "/assistant", icon: Bot, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Digitalização", href: "/digitization", icon: ScanLine, roles: ["admin", "gestor", "tecnico"] },
  { name: "Processamento OCR", href: "/ocr-processing", icon: FileSearch, roles: ["admin", "gestor", "tecnico"] },
  { name: "Classificação", href: "/classification", icon: Tags, roles: ["admin", "gestor", "tecnico"] },
  { name: "Revisão Qualidade", href: "/quality-review", icon: FileCheck, roles: ["admin", "gestor"] },
  { name: "Relatórios", href: "/reports", icon: BarChart3, roles: ["admin", "gestor"] },
  { name: "Movimentações", href: "/movement-history", icon: History, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Pastas", href: "/folders", icon: FolderOpen, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Arquivo", href: "/archive", icon: Archive, roles: ["admin", "gestor", "tecnico", "consulta"] },
];

const management: NavItem[] = [
  { name: "Utilizadores", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Permissões", href: "/permissions", icon: Shield, roles: ["admin"] },
  { name: "Notificações", href: "/notifications", icon: Bell, roles: ["admin", "gestor", "tecnico", "consulta"] },
  { name: "Editor Fluxos", href: "/workflow-builder", icon: GitBranch, roles: ["admin"] },
  { name: "Modelos", href: "/process-templates", icon: Layers, roles: ["admin", "gestor"] },
  { name: "Definições", href: "/settings", icon: Settings, roles: ["admin"] },
];

const roleBadgeColors: Record<AppRole, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  gestor: "bg-primary/15 text-primary border-primary/30",
  tecnico: "bg-success/15 text-success border-success/30",
  consulta: "bg-muted text-muted-foreground border-border",
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAuthenticated, signOut } = useAuth();
  const { primaryRole, hasAnyRole } = useUserRole();
  const pendingApprovalsCount = usePendingApprovalsCount();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Filter menu items based on user role and add badge for approvals
  const filteredNavigation = navigation
    .filter(item => primaryRole && item.roles.includes(primaryRole))
    .map(item => ({
      ...item,
      badge: item.href === '/approvals' && pendingApprovalsCount.total > 0
        ? { 
            count: pendingApprovalsCount.total, 
            urgent: pendingApprovalsCount.urgent,
            hasUrgent: pendingApprovalsCount.hasUrgent 
          }
        : undefined,
    }));
  
  const filteredManagement = management.filter(item => 
    primaryRole && item.roles.includes(primaryRole)
  );

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));
    
    const linkContent = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate flex-1">{item.name}</span>}
        {item.badge && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Badge 
                variant={item.badge.hasUrgent ? "destructive" : "secondary"}
                className={cn(
                  "h-5 min-w-5 px-1.5 text-[10px] font-semibold cursor-help",
                  collapsed && "absolute -top-1 -right-1",
                  item.badge.hasUrgent && "animate-pulse"
                )}
              >
                {item.badge.count > 99 ? '99+' : item.badge.count}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {item.badge.hasUrgent 
                ? `${item.badge.urgent} urgente${item.badge.urgent > 1 ? 's' : ''} de ${item.badge.count} pendente${item.badge.count > 1 ? 's' : ''}`
                : `${item.badge.count} aprovação${item.badge.count > 1 ? 'ões' : ''} pendente${item.badge.count > 1 ? 's' : ''}`
              }
            </TooltipContent>
          </Tooltip>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="relative">
              {linkContent}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium flex items-center gap-2">
            {item.name}
            {item.badge && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={item.badge.hasUrgent ? "destructive" : "secondary"} 
                    className={cn("h-4 min-w-4 px-1 text-[9px] cursor-help", item.badge.hasUrgent && "animate-pulse")}
                  >
                    {item.badge.count > 99 ? '99+' : item.badge.count}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {item.badge.hasUrgent 
                    ? `${item.badge.urgent} urgente${item.badge.urgent > 1 ? 's' : ''} de ${item.badge.count}`
                    : `${item.badge.count} pendente${item.badge.count > 1 ? 's' : ''}`
                  }
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const displayName = profile?.full_name || "Utilizador";
  const displayRole = primaryRole || "consulta";

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
      aria-label="Navegação principal"
      data-tour="sidebar"
    >
      {/* Cabeçalho */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Logo collapsed={collapsed} />
        <Button
          variant="sidebar"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("shrink-0", !collapsed && "ml-auto")}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Pesquisa */}
      {!collapsed && (
        <div className="p-3">
          <NavLink 
            to="/search"
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent/40 transition-colors"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Pesquisar...</span>
            <kbd className="ml-auto rounded bg-sidebar-accent/50 px-1.5 py-0.5 text-[10px] text-sidebar-muted/80">⌘K</kbd>
          </NavLink>
        </div>
      )}

      {/* Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegação primária">
        {filteredNavigation.length > 0 && (
          <div className="space-y-0.5">
            {!collapsed && (
              <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
                Principal
              </span>
            )}
            <div className="space-y-0.5 pt-1">
              {filteredNavigation.map((item) => (
                <NavItemComponent key={item.name} item={item} />
              ))}
            </div>
          </div>
        )}

        {filteredManagement.length > 0 && (
          <div className="space-y-0.5 pt-6">
            {!collapsed && (
              <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
                Gestão
              </span>
            )}
            <div className="space-y-0.5 pt-1">
              {filteredManagement.map((item) => (
                <NavItemComponent key={item.name} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Utilizador */}
      <div className="border-t border-sidebar-border p-3">
        {isAuthenticated && profile ? (
          <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-sidebar-foreground">
                {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              {!collapsed && (
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        roleBadgeColors[displayRole]
                      )}
                    >
                      {roleLabels[displayRole]}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs text-sidebar-muted hover:text-sidebar-foreground"
                  asChild
                >
                  <NavLink to="/settings">
                    <UserCircle className="h-3.5 w-3.5 mr-1.5" />
                    Meu Perfil
                  </NavLink>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-sidebar-muted hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {collapsed && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-sidebar-muted hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Terminar Sessão</TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" asChild>
                    <NavLink to="/auth">
                      <UserCircle className="h-5 w-5" />
                    </NavLink>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Iniciar Sessão</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <NavLink to="/auth">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Iniciar Sessão
                </NavLink>
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
