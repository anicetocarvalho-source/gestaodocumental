import { Bell, HelpCircle, Settings, Search, LogOut, User } from "lucide-react";
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
import { useNavigate, Link } from "react-router-dom";
import { useDemoAuth, roleLabels } from "@/contexts/DemoAuthContext";

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
  const { isAuthenticated, user, logout } = useDemoAuth();

  const handleLogout = () => {
    logout();
    navigate("/demo-login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-6 lg:px-8 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-foreground tracking-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      
      {/* Pesquisa Global */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar documentos, processos..." 
            className="pl-10 bg-muted/50 border-transparent hover:border-border focus:border-primary focus:bg-background"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" asChild>
          <Link to="/notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
          <Link to="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        {/* User Menu */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-2 gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
                  <Badge 
                    variant={roleBadgeVariants[user.role || "consulta"]} 
                    className="text-[10px] py-0 px-1.5 h-4"
                  >
                    {roleLabels[user.role || "consulta"]}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.department}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/demo-login" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Mudar Perfil
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
            <Link to="/demo-login">
              <LogOut className="mr-2 h-4 w-4" />
              Demo Login
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}