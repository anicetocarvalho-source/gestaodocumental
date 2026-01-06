import { Navigate, useLocation } from "react-router-dom";
import { useDemoAuth } from "@/contexts/DemoAuthContext";
import { canAccessRoute } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas verificando se o utilizador tem permissão para aceder.
 * Redireciona para /demo-login se não autenticado, ou /access-denied se não autorizado.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, role } = useDemoAuth();
  const location = useLocation();

  // Se não está autenticado, redireciona para login demo
  if (!isAuthenticated) {
    return <Navigate to="/demo-login" state={{ from: location }} replace />;
  }

  // Verifica se o role tem permissão para a rota actual
  if (!canAccessRoute(role, location.pathname)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
