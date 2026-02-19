import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useTeamAdmin(teamId?: string) {
  const { user, isGodAdmin, isSuperAdmin } = useAuth();
  const [isTeamAdmin, setIsTeamAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setIsTeamAdmin(false);
      setLoading(false);
      return;
    }

    if (isGodAdmin || isSuperAdmin) {
      setIsTeamAdmin(true);
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("team_id", teamId)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();

      setIsTeamAdmin(!!data);
      setLoading(false);
    };

    checkRole();
  }, [user, teamId, isGodAdmin, isSuperAdmin]);

  return { isTeamAdmin, loading };
}
