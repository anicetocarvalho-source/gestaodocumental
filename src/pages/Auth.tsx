import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, ShieldCheck, Users, FileText, Eye, ChevronDown, FlaskConical } from "lucide-react";
import { z } from "zod";
import { useDemoAuth, DemoRole, roleLabels, roleDescriptions } from "@/contexts/DemoAuthContext";
import { Logo } from "@/components/layout/Logo";

const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres");

type AuthView = "login" | "forgot-password" | "reset-sent";

const testUsers: { role: Exclude<DemoRole, null>; icon: React.ReactNode; color: string }[] = [
  { role: "admin", icon: <ShieldCheck className="h-4 w-4" />, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  { role: "gestor", icon: <Users className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { role: "tecnico", icon: <FileText className="h-4 w-4" />, color: "bg-green-500/10 text-green-600 border-green-500/20" },
  { role: "consulta", icon: <Eye className="h-4 w-4" />, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { login: demoLogin } = useDemoAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<AuthView>("login");
  const [testLoginOpen, setTestLoginOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciais inválidas. Verifique o e-mail e a palavra-passe.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Sessão iniciada com sucesso!");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/auth?type=recovery`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setView("reset-sent");
    }
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "recovery") {
      toast.info("Pode agora definir uma nova palavra-passe nas definições.");
    }
  }, []);

  if (view === "reset-sent") {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <Logo collapsed={false} variant="light" />
            <h1 className="text-4xl font-bold mt-8 leading-tight">
              Sistema de Gestão<br />Documental e Processual
            </h1>
            <p className="text-lg text-white/80 mt-4 max-w-md">
              Plataforma integrada para a gestão eficiente de documentos, processos e fluxos de trabalho institucionais.
            </p>
          </div>
        </div>

        {/* Right Panel - Reset Sent */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl">Verifique o seu e-mail</CardTitle>
              <CardDescription className="text-base mt-2">
                Enviámos instruções para recuperar a sua palavra-passe para <strong className="text-foreground">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground text-center">
                Se não receber o e-mail em alguns minutos, verifique a pasta de spam.
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setView("login");
                  setEmail("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <Logo collapsed={false} variant="light" />
            <h1 className="text-4xl font-bold mt-8 leading-tight">
              Sistema de Gestão<br />Documental e Processual
            </h1>
            <p className="text-lg text-white/80 mt-4 max-w-md">
              Plataforma integrada para a gestão eficiente de documentos, processos e fluxos de trabalho institucionais.
            </p>
          </div>
        </div>

        {/* Right Panel - Forgot Password */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Recuperar Palavra-passe</CardTitle>
              <CardDescription className="text-base mt-2">
                Introduza o seu e-mail institucional para receber instruções de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-mail Institucional</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="nome@minagrif.gov.ao"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Instruções
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setView("login")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Logo collapsed={false} variant="light" />
          <h1 className="text-4xl font-bold mt-8 leading-tight">
            Sistema de Gestão<br />Documental e Processual
          </h1>
          <p className="text-lg text-white/80 mt-4 max-w-md">
            Plataforma integrada para a gestão eficiente de documentos, processos e fluxos de trabalho institucionais.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Acesso Seguro</p>
                <p className="text-sm text-white/70">Autenticação institucional protegida</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo collapsed={false} />
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Bem-vindo</CardTitle>
              <CardDescription className="text-base mt-2">
                Aceda com as suas credenciais institucionais
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail Institucional</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nome@minagrif.gov.ao"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Palavra-passe</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setView("forgot-password")}
                    >
                      Esqueceu a palavra-passe?
                    </Button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Sessão
                </Button>
              </form>

              {/* Test Users Section */}
              <div className="mt-6 pt-6 border-t border-border">
                <Collapsible open={testLoginOpen} onOpenChange={setTestLoginOpen}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-muted-foreground hover:text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        <span className="text-sm">Acesso de Teste (Demo)</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${testLoginOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Selecione um perfil para explorar o sistema
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {testUsers.map(({ role, icon, color }) => (
                        <Button
                          key={role}
                          variant="outline"
                          size="sm"
                          className={`h-auto py-2 px-3 flex-col items-start gap-1 ${color} border hover:opacity-80`}
                          onClick={() => {
                            demoLogin(role);
                            toast.success(`Sessão demo iniciada como ${roleLabels[role]}`);
                            navigate("/");
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            {icon}
                            <span className="font-medium text-xs">{roleLabels[role]}</span>
                          </div>
                          <span className="text-[10px] opacity-70 text-left line-clamp-1">
                            {roleDescriptions[role].split(",")[0]}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <FlaskConical className="h-3 w-3" />
                        Ambiente de Demonstração
                      </Badge>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <Separator className="my-4" />
              
              <p className="text-xs text-center text-muted-foreground">
                Não tem conta? Contacte o administrador do sistema para obter acesso.
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground mt-6">
            © 2026 MINAGRIF - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
