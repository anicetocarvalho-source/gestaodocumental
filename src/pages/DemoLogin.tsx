import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useDemoAuth, 
  DemoRole, 
  roleLabels, 
  roleDescriptions, 
  rolePermissions 
} from "@/contexts/DemoAuthContext";
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Eye,
  Check,
  Building2,
  LogIn,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/layout/Logo";

const roleIcons: Record<Exclude<DemoRole, null>, React.ReactNode> = {
  admin: <ShieldCheck className="h-6 w-6" />,
  gestor: <Users className="h-6 w-6" />,
  tecnico: <FileText className="h-6 w-6" />,
  consulta: <Eye className="h-6 w-6" />,
};

const roleColors: Record<Exclude<DemoRole, null>, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-500/20",
  gestor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  tecnico: "bg-green-500/10 text-green-600 border-green-500/20",
  consulta: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const roleBadgeColors: Record<Exclude<DemoRole, null>, "error" | "info" | "success" | "warning"> = {
  admin: "error",
  gestor: "info",
  tecnico: "success",
  consulta: "warning",
};

const DemoLogin = () => {
  const navigate = useNavigate();
  const { login } = useDemoAuth();

  const handleLogin = (role: Exclude<DemoRole, null>) => {
    login(role);
    toast.success(`Sessão iniciada como ${roleLabels[role]}`, {
      description: "A redirecionar para o dashboard...",
    });
    navigate("/");
  };

  const roles: Exclude<DemoRole, null>[] = ["admin", "gestor", "tecnico", "consulta"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Ambiente de Demonstração
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Selecionar Perfil de Acesso
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Escolha um perfil para explorar o sistema com diferentes níveis de permissão.
              Cada perfil tem acesso a funcionalidades específicas.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card 
                key={role} 
                className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl border ${roleColors[role]}`}>
                      {roleIcons[role]}
                    </div>
                    <Badge variant={roleBadgeColors[role]}>
                      {roleLabels[role]}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-4">{roleLabels[role]}</CardTitle>
                  <CardDescription>{roleDescriptions[role]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Permissões
                    </p>
                    <ul className="space-y-2">
                      {rolePermissions[role].map((permission, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => handleLogin(role)}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar como {roleLabels[role]}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-10 p-6 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Sobre o Modo Demonstração</h3>
                <p className="text-sm text-muted-foreground">
                  Este é um ambiente de demonstração para testar as funcionalidades do sistema MINAGRIF.
                  Os dados apresentados são fictícios e as ações não afetam dados reais. 
                  Pode alternar entre perfis a qualquer momento para explorar diferentes perspectivas do sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoLogin;