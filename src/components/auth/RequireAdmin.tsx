import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function RequireAdmin() {
  const { isAdmin, isLoading, user, isGodAdmin, isSuperAdmin } = useAuth();
  const teamContext = useOptionalTeamSlug();
  const basePath = teamContext?.basePath || "/";
  const navigate = useNavigate();
  const [hasTeamAccess, setHasTeamAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    // Super/God admins have global access
    if (isGodAdmin || isSuperAdmin) {
      setHasTeamAccess(true);
      return;
    }

    // If context is missing, block (should be inside team route)
    if (!teamContext) {
      setHasTeamAccess(false);
      return;
    }

    const checkTeamRole = async () => {
      // Check if user has admin/owner/super_admin role SPECIFIC to this team
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("team_id", teamContext.team.id)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();

      if (data) {
        setHasTeamAccess(true);
      } else {
        setHasTeamAccess(false);
      }
    };

    checkTeamRole();
  }, [user, teamContext, isGodAdmin, isSuperAdmin, isLoading]);

  if (isLoading || hasTeamAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasTeamAccess) {
    return <Navigate to={basePath} replace />;
  }

  return <Outlet />;
}
