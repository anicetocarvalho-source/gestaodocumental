import { useState, useCallback, FormEvent } from "react";
import { Bell, Settings, Search, LogOut, User, ClipboardCheck, Keyboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, roleLabels } from "@/hooks/useUserRole";
import { useUnreadCount } from "@/hooks/useNotifications";
import { usePendingApprovalsCount } from "@/hooks/usePendingApprovalsCount";
import { HelpMenu } from "@/components/help/HelpMenu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { RecentItemsDropdown } from "@/components/common/RecentItemsDropdown";
import { FavoritesDropdown } from "@/components/common/FavoritesDropdown";
import { useSidebar } from "@/contexts/SidebarContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const roleBadgeVariants: Record<string, "error" | "info" | "success" | "warning"> = {
  admin: "error",
  gestor: "info",
  tecnico: "success",
  consulta: "warning",
};

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated, profile, signOut } = useAuth();
  const { primaryRole } = useUserRole();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { total: pendingApprovalsCount, urgent, hasUrgent } = usePendingApprovalsCount();
  const { toggle, isMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSearch = useCallback((e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery("");
    }
  }, [searchQuery, navigate]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const displayName = profile?.full_name || "Utilizador";
  const displayEmail = profile?.email || "";
  const displayRole = primaryRole || "consulta";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 md:px-6 lg:px-8 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Pesquisa Global - Funcional */}
      <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8" data-tour="global-search">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar documentos, processos..." 
            className="pl-10 pr-16 bg-muted/50 border-transparent hover:border-border focus:border-primary focus:bg-background global-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background border rounded text-[10px] font-mono text-muted-foreground">
            <span className="text-[9px]">⌘</span>K
          </kbd>
        </div>
      </form>
      
      <div className="flex items-center gap-0.5 md:gap-1">
        <div className="hidden sm:flex items-center gap-0.5">
          <RecentItemsDropdown />
          <FavoritesDropdown />
        </div>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-muted-foreground hover:text-foreground hidden sm:inline-flex" 
              asChild
              data-tour="pending-approvals-btn"
            >
              <Link to="/pending-approvals">
                <ClipboardCheck className="h-5 w-5" />
                {pendingApprovalsCount > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${hasUrgent ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}`}>
                    {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
                  </span>
                )}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {pendingApprovalsCount === 0 
                ? "Sem aprovações pendentes" 
                : `${pendingApprovalsCount} aprovações pendentes${hasUrgent ? ` (${urgent} urgente${urgent > 1 ? 's' : ''})` : ''}`
              }
            </p>
          </TooltipContent>
        </Tooltip>
        <span className="hidden md:inline-flex">
          <HelpMenu />
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-muted-foreground hover:text-foreground" 
          asChild
          data-tour="notifications-btn"
        >
          <Link to="/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex" asChild>
          <Link to="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        {/* User Menu */}
        {isAuthenticated && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-2 gap-2 px-2" data-tour="user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium">{displayName.split(" ")[0]}</span>
                  <Badge 
                    variant={roleBadgeVariants[displayRole]} 
                    className="text-[10px] py-0 px-1.5 h-4"
                  >
                    {roleLabels[displayRole]}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{displayEmail}</span>
                  <span className="text-xs font-normal text-muted-foreground">{profile.position || "Sem cargo"}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-error focus:text-error cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="ml-2" asChild>
            <Link to="/auth">
              <LogOut className="mr-2 h-4 w-4" />
              Iniciar Sessão
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
