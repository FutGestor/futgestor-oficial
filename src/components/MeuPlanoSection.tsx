import { Crown, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentPlan } from "@/hooks/useSubscription";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Link } from "react-router-dom";

export function MeuPlanoSection() {
  const { plan, subscription, isLoading, isActive } = useCurrentPlan();
  const { basePath } = useTeamSlug();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const planLabel = plan === "free" ? "Sem plano" : plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Meu Plano
        </CardTitle>
        <CardDescription>
          Gerencie a assinatura do seu time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Plano atual:</span>
          {isActive ? (
            <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
              <Crown className="mr-1 h-3 w-3" />
              {planLabel}
            </Badge>
          ) : (
            <Badge variant="secondary">Sem plano ativo</Badge>
          )}
        </div>

        {isActive && subscription?.expires_at && (
          <p className="text-sm text-muted-foreground">
            Válido até: {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
          </p>
        )}

        {isActive && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <Check className="h-4 w-4" />
              Seu plano está ativo!
            </p>
          </div>
        )}

        <Link to={`${basePath}/admin/planos`}>
          <Button className="w-full" variant={isActive ? "outline" : "default"}>
            <Crown className="mr-2 h-4 w-4" />
            {isActive ? "Alterar Plano" : "Escolher Plano"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
