import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/LoadingScreen";

// Wrapper de transição para evitar flash branco
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div 
      className={`transition-opacity duration-300 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ minHeight: "100vh", backgroundColor: "#040810" }}
    >
      {children}
    </div>
  );
}

/**
 * AuthGuard - Monitora o estado de autenticação do usuário
 * 
 * Redireciona para /auth quando:
 * - Usuário faz logout manual
 * - Token é explicitamente inválido (não por erro de rede)
 * - Usuário é deletado (detectado via evento ou verificação)
 * 
 * NÃO desloga por:
 * - Inatividade
 * - Erros de rede temporários
 * - Sessão expirada (deixa o Supabase renovar automaticamente)
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // Não está autenticado
          setIsAuthenticated(false);
          
          // Se não estiver na página de auth, termos ou convite, redireciona
          if (location.pathname !== "/auth" && location.pathname !== "/termos" && !location.pathname.startsWith("/convite/")) {
            navigate("/auth", { replace: true });
          }
        } else {
          // Está autenticado
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("AuthGuard error:", err);
        // Em caso de erro de rede, mantém o estado atual (não desloga)
        setIsAuthenticated(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        
        switch (event) {
          case "SIGNED_OUT":
            // Apenas desloga se for logout explícito
            setIsAuthenticated(false);
            if (location.pathname !== "/auth" && location.pathname !== "/termos" && !location.pathname.startsWith("/convite/")) {
              navigate("/auth", { replace: true });
            }
            break;
            
          case "USER_DELETED":
            // Usuário foi deletado
            setIsAuthenticated(false);
            toast({
              title: "Conta removida",
              description: "Sua conta foi excluída.",
              variant: "destructive",
            });
            navigate("/auth", { replace: true });
            break;
            
          case "TOKEN_REFRESHED":
          case "SIGNED_IN":
            // Sessão renovada ou login - mantém autenticado
            setIsAuthenticated(true);
            break;
            
          default:
            // Outros eventos: não faz nada, deixa o Supabase gerenciar
            if (session) {
              setIsAuthenticated(true);
            }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, toast]);

  // Verificação periódica MENOS AGRESSIVA - a cada 5 minutos e só em foreground
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastCheck = Date.now();
    
    const checkUserExists = async () => {
      // Só verifica se a aba está visível e passou 5 minutos
      if (document.hidden) return;
      
      const now = Date.now();
      if (now - lastCheck < 5 * 60 * 1000) return; // 5 minutos
      
      lastCheck = now;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        // Verificar se o usuário ainda existe no banco
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          // Erro de rede - não desloga, apenas loga
          console.log("Network error checking user, keeping session");
          return;
        }

        if (!profile) {
          // Usuário foi realmente deletado
          await supabase.auth.signOut();
          
          toast({
            title: "Conta removida",
            description: "Sua conta foi excluída por um administrador.",
            variant: "destructive",
          });
          
          navigate("/auth", { replace: true });
        }
      } catch (err) {
        // Erro de rede ou outro problema - não desloga
        console.log("Error checking user existence (keeping session):", err);
      }
    };

    // Verificar a cada 5 minutos
    const interval = setInterval(checkUserExists, 5 * 60 * 1000);
    
    // Também verificar quando a aba volta a ficar visível (mas não imediatamente)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Espera 2 segundos após voltar para verificar
        setTimeout(checkUserExists, 2000);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, navigate, toast]);

  // Se estiver na página de auth, termos ou convite, não precisa de proteção (verificar primeiro!)
  if (location.pathname === "/auth" || location.pathname === "/termos" || location.pathname.startsWith("/convite/")) {
    return (
      <FadeIn delay={50}>
        {children}
      </FadeIn>
    );
  }

  if (isChecking) {
    return <LoadingScreen />;
  }

  // Se não estiver autenticado, não renderiza nada (já vai redirecionar)
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <FadeIn delay={50}>
      {children}
    </FadeIn>
  );
}

/**
 * Hook para verificar se o usuário ainda existe no banco
 * Versão manual - pode ser usada em páginas específicas
 */
export function useUserExists() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Não faz verificação automática frequente
    // Apenas escuta eventos de deleção
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "USER_DELETED") {
          toast({
            title: "Conta removida",
            description: "Sua conta foi excluída.",
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);
}
