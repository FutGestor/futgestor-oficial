import { useState } from "react";
import { Crown, Check, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsProPlan, useCreateMpPreference } from "@/hooks/useSubscription";

export function MeuPlanoSection() {
  const { profile, isAdmin } = useAuth();
  const { isPro, subscription, isLoading } = useIsProPlan();
  const createPreference = useCreateMpPreference();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleUpgrade = async () => {
    if (!profile?.team_id) return;

    setIsRedirecting(true);
    try {
      const result = await createPreference.mutateAsync({
        plano: "pro",
        team_id: profile.team_id,
        success_url: window.location.href,
        failure_url: window.location.href,
      });

      // Redirect to Mercado Pago checkout
      window.location.href = result.init_point;
    } catch (error: any) {
      console.error("Error creating preference:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o pagamento.",
        variant: "destructive",
      });
      setIsRedirecting(false);
    }
  };

  const proFeatures = [
    "Dashboard Financeiro completo",
    "Gestão de Avisos",
    "Receber Solicitações de Jogo",
    "Relatórios avançados",
  ];

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
      <CardContent className="space-y-6">
        {/* Current plan */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Plano atual:</span>
          {isPro ? (
            <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
              <Crown className="mr-1 h-3 w-3" />
              Pro
            </Badge>
          ) : (
            <Badge variant="secondary">Básico (Gratuito)</Badge>
          )}
        </div>

        {isPro && subscription?.expires_at && (
          <p className="text-sm text-muted-foreground">
            Válido até: {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
          </p>
        )}

        {/* Pro features */}
        {!isPro && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/30">
            <p className="mb-3 text-sm font-semibold">
              Desbloqueie com o plano Pro:
            </p>
            <ul className="space-y-2">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="mb-3 text-2xl font-bold">
                R$ 29,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              {isAdmin && (
                <Button
                  onClick={handleUpgrade}
                  disabled={isRedirecting || createPreference.isPending}
                  className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  {isRedirecting || createPreference.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Assinar Plano Pro
                    </>
                  )}
                </Button>
              )}
              {!isAdmin && (
                <p className="text-sm text-muted-foreground">
                  Apenas administradores podem assinar planos.
                </p>
              )}
            </div>
          </div>
        )}

        {isPro && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <Check className="h-4 w-4" />
              Seu time tem acesso a todos os recursos Pro!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
