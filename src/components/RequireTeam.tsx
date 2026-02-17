import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FutGestorLogo } from "@/components/FutGestorLogo";

export function RequireTeam({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || !profile?.team_id) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Card className="mx-auto max-w-md">
            <CardContent className="py-8">
              <LogIn className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Acesso restrito</p>
              <p className="mt-2 text-muted-foreground">
                Faça login para acessar o conteúdo do seu time.
              </p>
              <Link to="/auth" className="mt-4 inline-block">
                <Button>Entrar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
