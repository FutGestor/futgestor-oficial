import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TeamSlugLayout } from "@/hooks/useTeamSlug";
import Index from "./pages/Index";
import Agenda from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import Escalacao from "./pages/Escalacao";
import Jogadores from "./pages/Jogadores";
import MeuPerfil from "./pages/MeuPerfil";
import Ranking from "./pages/Ranking";
import Resultados from "./pages/Resultados";
import Avisos from "./pages/Avisos";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import TeamPublicPage from "./pages/TeamPublicPage";
import Termos from "./pages/Termos";
import PresencaPublica from "./pages/PresencaPublica";
import PlayerDashboard from "./pages/PlayerDashboard";
import SuperAdminVendas from "./pages/SuperAdminVendas";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/site" element={<LandingPage />} />
            <Route path="/super-admin/vendas" element={<SuperAdminVendas />} />
            <Route path="/presenca/:codigo" element={<PresencaPublica />} />
            <Route path="/player/dashboard" element={<PlayerDashboard />} />
            <Route path="/time/:slug" element={<TeamSlugLayout />}>
              <Route index element={<TeamPublicPage />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="escalacao" element={<Escalacao />} />
              <Route path="jogadores" element={<Jogadores />} />
              <Route path="meu-perfil" element={<MeuPerfil />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="resultados" element={<Resultados />} />
              <Route path="avisos" element={<Avisos />} />
              <Route path="admin/*" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
