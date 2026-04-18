import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Faz scroll para o topo da página em cada mudança de rota.
 * Coloca dentro do <BrowserRouter> mas não renderiza nada.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
