import { ReactNode } from "react";
import { Crown, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsProPlan } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Link } from "react-router-dom";

interface RequireProPlanProps {
  children: ReactNode;
  featureName?: string;
}

export function RequireProPlan({ children, featureName = "Este recurso" }: RequireProPlanProps) {
  const { profile } = useAuth();
  const { isPro, isLoading } = useIsProPlan();
  const { basePath } = useTeamSlug();

  if (isLoading) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isPro && profile?.team_id) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Card className="mx-auto max-w-md">
            <CardContent className="py-8">
              <Crown className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
              <p className="text-lg font-medium">Recurso Pro</p>
              <p className="mt-2 text-muted-foreground">
                {featureName} está disponível apenas no plano Pro.
              </p>
              <Link to={`${basePath}/admin/planos`}>
                <Button className="mt-4" variant="default">
                  <Crown className="mr-2 h-4 w-4" />
                  Fazer Upgrade
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
