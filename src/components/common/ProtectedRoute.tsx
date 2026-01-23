import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoAuth } from "@/contexts/DemoAuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas verificando se o utilizador está autenticado.
 * Aceita autenticação Supabase ou modo demo.
 * Redireciona para /auth se não autenticado.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated: isSupabaseAuthenticated, isLoading } = useAuth();
  const { isAuthenticated: isDemoAuthenticated } = useDemoAuth();
  const location = useLocation();

  // Considera autenticado se estiver em modo demo OU autenticado via Supabase
  const isAuthenticated = isSupabaseAuthenticated || isDemoAuthenticated;

  // Mostra loading enquanto verifica autenticação (apenas para Supabase)
  if (isLoading && !isDemoAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A verificar autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
