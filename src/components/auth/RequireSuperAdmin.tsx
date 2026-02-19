import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Componente de proteção de rotas Super Admin.
 * Apenas a conta God (futgestor@gmail.com) tem acesso às rotas protegidas.
 */
export function RequireSuperAdmin() {
  const { isGodAdmin, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Apenas God Admin (futgestor@gmail.com) pode acessar
  if (!user || !isGodAdmin) {
    // Redireciona para a home se não for God Admin
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
