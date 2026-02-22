import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

// Flags para preparar o código para React Router v7
const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};
import { AuthProvider } from "@/hooks/useAuth";
import { TeamSlugLayout } from "@/hooks/useTeamSlug";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Agenda from "./pages/Agenda";
import Chat from "./pages/Chat";
import Financeiro from "./pages/Financeiro";
import Escalacao from "./pages/Escalacao";
import Jogadores from "./pages/Jogadores";
import MeuPerfil from "./pages/MeuPerfil";
import Ranking from "./pages/Ranking";
import Resultados from "./pages/Resultados";
import Avisos from "./pages/Avisos";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import Onboarding from "./pages/Onboarding";
import PostSignupChoice from "./pages/PostSignupChoice";
import NotFound from "./pages/NotFound";
import TeamPublicPage from "./pages/TeamPublicPage";
import PublicMatchmaking from "./pages/PublicMatchmaking";
import Termos from "./pages/Termos";
import PresencaPublica from "./pages/PresencaPublica";
import PlayerDashboard from "./pages/PlayerDashboard";
import SuperAdminVendas from "./pages/SuperAdminVendas";
import SuperAdminAvisos from "./pages/SuperAdminAvisos";
import SuperAdminHealth from "./pages/SuperAdminHealth";
import { RequireApproval } from "./components/auth/RequireApproval";
import { RequireAdmin } from "./components/auth/RequireAdmin";
import { RequireSuperAdmin } from "./components/auth/RequireSuperAdmin";
import Ligas from "./pages/Ligas";
import Suporte from "./pages/Suporte";
import SuperAdminSuporte from "./pages/SuperAdminSuporte";
import SuperAdminStatus from "./pages/SuperAdminStatus";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminUsuarios from "./pages/SuperAdminUsuarios";
import AdminGuia from "./pages/admin/AdminGuia";

import AdminJogadores from "./pages/admin/AdminJogadores";
import AdminTimes from "./pages/admin/AdminTimes";
import Discovery from "./pages/admin/Discovery";
import PublicDiscovery from "./pages/Discovery";
import TeamProfile from "./pages/TeamProfile";
import PlayerProfile from "./pages/PlayerProfile";
import AdminTransacoes from "./pages/admin/AdminTransacoes";
import AdminAvisos from "./pages/admin/AdminAvisos";
import AdminEscalacoes from "./pages/admin/AdminEscalacoes";

import AdminSolicitacoes from "./pages/admin/AdminSolicitacoes";
import AdminCampeonatos from "./pages/admin/AdminCampeonatos";
import AdminCampeonatoDetalhe from "./pages/admin/AdminCampeonatoDetalhe";
import GameDetails from "./pages/GameDetails";
import Convite from "./pages/Convite";
import ConviteDetalhe from "./pages/ConviteDetalhe";
import TransferenciaDetalhe from "./pages/TransferenciaDetalhe";
import TransferenciaSaida from "./pages/TransferenciaSaida";
import Conquistas from "./pages/Conquistas";
import Notificacoes from "./pages/Notificacoes";
import Banners from "./pages/Banners";

const queryClient = new QueryClient();

// Wrapper de transição de página para evitar flash branco
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 30);
    return () => {
      clearTimeout(timer);
      setIsVisible(false);
    };
  }, [location.pathname]);

  return (
    <div className={`transition-all duration-200 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={routerFutureFlags}>
          <AuthGuard>
            <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/escolha" element={<PostSignupChoice />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/termos" element={<Termos />} />
            
            {/* Rotas SuperAdmin - Protegidas por RequireSuperAdmin */}
            <Route element={<RequireSuperAdmin />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/vendas" element={<SuperAdminVendas />} />
              <Route path="/super-admin/suporte" element={<SuperAdminSuporte />} />
              <Route path="/super-admin/status" element={<SuperAdminStatus />} />
              <Route path="/super-admin/usuarios" element={<SuperAdminUsuarios />} />
              <Route path="/super-admin/avisos" element={<SuperAdminAvisos />} />
              <Route path="/super-admin/health" element={<SuperAdminHealth />} />
            </Route>
            
            <Route path="/presenca/:codigo" element={<PresencaPublica />} />
            <Route path="/convite/:code" element={<Convite />} />
            <Route path="/convite/:id" element={<RequireApproval />}>
              <Route index element={<ConviteDetalhe />} />
            </Route>
            <Route path="/transferencia" element={<RequireApproval />}>
              <Route index element={<TransferenciaDetalhe />} />
            </Route>
            <Route path="/transferencia-saida" element={<RequireApproval />}>
              <Route index element={<TransferenciaSaida />} />
            </Route>
            <Route path="/explorar" element={<PublicDiscovery />} />
            <Route path="/explorar/time/:slug" element={<TeamProfile />} />
            <Route path="/explorar/jogador/:id" element={<PlayerProfile />} />
            <Route path="/player/dashboard" element={<RequireApproval />}>
              <Route index element={<MeuPerfil />} />
            </Route>

            <Route path="/time/:slug" element={<TeamSlugLayout />}>
              <Route index element={<TeamPublicPage />} />
              <Route path="desafio" element={<PublicMatchmaking />} />

              <Route element={<RequireApproval />}>
                <Route path="agenda" element={<Agenda />} />
                <Route path="chat" element={<Chat />} />                
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="financeiro/gerenciar" element={<RequireAdmin />}>
                  <Route index element={<AdminTransacoes />} />
                </Route>

                <Route path="escalacao" element={<Escalacao />} />
                <Route path="escalacao/gerenciar" element={<RequireAdmin />}>
                  <Route index element={<AdminEscalacoes />} />
                </Route>

                <Route path="jogadores" element={<Jogadores />} />
                <Route path="jogadores/gerenciar" element={<RequireAdmin />}>
                  <Route index element={<AdminJogadores />} />
                </Route>

                <Route path="meu-perfil" element={<MeuPerfil />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="resultados" element={<Resultados />} />
                <Route path="ligas" element={<Ligas />} />
                <Route path="ligas/gerenciar" element={<RequireAdmin />}>
                  <Route index element={<AdminCampeonatos />} />
                  <Route path=":leagueId" element={<AdminCampeonatoDetalhe />} />
                </Route>
                <Route path="avisos" element={<Avisos />} />
                 <Route path="suporte" element={<Suporte />} />
                <Route path="guia" element={<AdminGuia />} />
                <Route path="conquistas" element={<Conquistas />} />
                <Route path="notificacoes" element={<Notificacoes />} />
                <Route path="banners" element={<Banners />} />
                <Route path="jogo/:id" element={<GameDetails />} />

                {/* Rotas de Gestão (Admin Only) */}
                <Route element={<RequireAdmin />}>
                  <Route path="gestao" element={<AdminDashboard />} />

                  <Route path="solicitacoes" element={<AdminSolicitacoes />} />
                  <Route path="descobrir" element={<Discovery />} />
                  <Route path="times" element={<AdminTimes />} />
                  <Route path="usuarios" element={<AdminUsuarios />} />
                  <Route path="avisos/gerenciar" element={<AdminAvisos />} />
                </Route>

              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
