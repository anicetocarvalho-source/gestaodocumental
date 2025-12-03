import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("Erro 404: Utilizador tentou aceder a rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Página Não Encontrada</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          A página que procura não existe ou foi movida. Por favor verifique o URL ou navegue de volta ao painel.
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

export default NotFound;
