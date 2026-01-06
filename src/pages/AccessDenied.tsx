import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

const AccessDenied = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="mb-2 text-6xl font-bold text-foreground">403</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Acesso Negado</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Não tem permissão para aceder a esta página. Se acredita que isto é um erro, contacte o administrador do sistema.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir para o Painel
            </a>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
