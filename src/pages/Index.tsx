import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import LandingPage from "./LandingPage";

const Index = () => {
  const { user, profile, isLoading } = useAuth();
  const { team, isLoading: teamLoading } = useTeamConfig();

  if (!isLoading && !teamLoading && user && profile?.team_id && team.slug) {
    return <Navigate to={`/time/${team.slug}`} replace />;
  }

  return <LandingPage />;
};

export default Index;
