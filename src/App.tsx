import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TeamSlugLayout } from "@/hooks/useTeamSlug";
import Agenda from "./pages/Agenda";
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
import Ligas from "./pages/Ligas";
import Suporte from "./pages/Suporte";
import SuperAdminSuporte from "./pages/SuperAdminSuporte";
import SuperAdminStatus from "./pages/SuperAdminStatus";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminUsuarios from "./pages/SuperAdminUsuarios";
import AdminGuia from "./pages/admin/AdminGuia";
import AdminJogos from "./pages/admin/AdminJogos";
import AdminJogadores from "./pages/admin/AdminJogadores";
import AdminTimes from "./pages/admin/AdminTimes";
import Discovery from "./pages/admin/Discovery";
import AdminTransacoes from "./pages/admin/AdminTransacoes";
import AdminAvisos from "./pages/admin/AdminAvisos";
import AdminEscalacoes from "./pages/admin/AdminEscalacoes";

import AdminSolicitacoes from "./pages/admin/AdminSolicitacoes";
import AdminCampeonatos from "./pages/admin/AdminCampeonatos";
import AdminCampeonatoDetalhe from "./pages/admin/AdminCampeonatoDetalhe";
import GameDetails from "./pages/GameDetails";
import Convite from "./pages/Convite";
import Conquistas from "./pages/Conquistas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/vendas" element={<SuperAdminVendas />} />
            <Route path="/super-admin/suporte" element={<SuperAdminSuporte />} />
            <Route path="/super-admin/status" element={<SuperAdminStatus />} />
            <Route path="/super-admin/usuarios" element={<SuperAdminUsuarios />} />
            <Route path="/super-admin/avisos" element={<SuperAdminAvisos />} />
            <Route path="/super-admin/health" element={<SuperAdminHealth />} />
            <Route path="/presenca/:codigo" element={<PresencaPublica />} />
            <Route path="/convite/:code" element={<Convite />} />
            <Route path="/player/dashboard" element={<RequireApproval />}>
              <Route index element={<MeuPerfil />} />
            </Route>

            <Route path="/time/:slug" element={<TeamSlugLayout />}>
              <Route index element={<TeamPublicPage />} />
              <Route path="desafio" element={<PublicMatchmaking />} />

              <Route element={<RequireApproval />}>
                <Route path="agenda" element={<Agenda />} />
                <Route path="agenda/gerenciar" element={<RequireAdmin />}>
                  <Route index element={<AdminJogos />} />
                </Route>
                
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
                <Route path="avisos" element={<Avisos />} />
                 <Route path="suporte" element={<Suporte />} />
                <Route path="guia" element={<AdminGuia />} />
                <Route path="conquistas" element={<Conquistas />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
