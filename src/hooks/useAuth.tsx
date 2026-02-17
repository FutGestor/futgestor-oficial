import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  jogador_id: string | null;
  aprovado: boolean;
  nome: string | null;
  team_id: string | null;
  created_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;
  isLoading: boolean;
  passwordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearPasswordRecovery: () => void;
  impersonate: (teamId: string) => void;
  stopImpersonating: () => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [impersonatedTeamId, setImpersonatedTeamId] = useState<string | null>(
    sessionStorage.getItem("futgestor_impersonated_team")
  );

  const impersonate = (teamId: string) => {
    sessionStorage.setItem("futgestor_impersonated_team", teamId);
    setImpersonatedTeamId(teamId);
  };

  const stopImpersonating = () => {
    sessionStorage.removeItem("futgestor_impersonated_team");
    setImpersonatedTeamId(null);
  };

  const clearPasswordRecovery = () => setPasswordRecovery(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
          return;
        }
        
        // Defer admin and profile check to avoid Supabase deadlocks
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsApproved(false);
          setProfile(null);
        }
      }
    );

    // Safety Timeout: Force loading to false after 2 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const initializeAuth = async () => {
      // THEN check for existing session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await Promise.all([
            checkAdminRole(session.user.id),
            fetchProfile(session.user.id)
          ]);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, jogador_id, aprovado, nome, team_id, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setIsApproved(false);
        return;
      }

      setProfile(data);
      setIsApproved(data?.aprovado ?? false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile(null);
      setIsApproved(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([
        fetchProfile(user.id),
        checkAdminRole(user.id)
      ]);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
      setIsSuperAdmin(roles.includes("super_admin"));
    } catch (err) {
      console.error("Error checking admin role:", err);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsApproved(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isSuperAdmin,
        isApproved,
        isLoading,
        passwordRecovery,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        clearPasswordRecovery,
        impersonate,
        stopImpersonating,
        isImpersonating: !!impersonatedTeamId,
        profile: profile ? {
          ...profile,
          team_id: impersonatedTeamId || profile.team_id
        } : null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
