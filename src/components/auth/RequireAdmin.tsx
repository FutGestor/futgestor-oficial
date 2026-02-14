import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { Loader2 } from "lucide-react";

export function RequireAdmin() {
  const { isAdmin, isLoading, user } = useAuth();
  const teamSlug = useOptionalTeamSlug();
  const basePath = teamSlug?.basePath || "/";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to={basePath} replace />;
  }

  return <Outlet />;
}
