import { useState } from "react";
import { Crown, Check, Loader2, ExternalLink, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentPlan, useCreateMpPreference, PlanType } from "@/hooks/useSubscription";

interface PlanCard {
  id: PlanType;
  name: string;
  price: number;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanCard[] = [
  {
    id: "basico",
    name: "Básico",
    price: 9.9,
    features: [
      "Dashboard do time",
      "Gerenciamento de Jogos",
      "Escalações",
      "Resultados e Estatísticas",
      "Ranking de jogadores",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.9,
    highlight: true,
    features: [
      "Tudo do Básico",
      "Dashboard Financeiro completo",
      "Gestão de Avisos",
      "Receber Solicitações de Jogo",
      "Relatórios avançados",
    ],
  },
  {
    id: "liga",
    name: "Liga",
    price: 39.9,
    features: [
      "Tudo do Pro",
      "Login para Jogadores",
      "Convidar Jogadores (acesso externo)",
      "Módulo de Campeonatos",
      "Suporte prioritário",
    ],
  },
];

export default function AdminPlanos() {
  const { profile } = useAuth();
  const { plan, isLoading, isActive } = useCurrentPlan();
  const createPreference = useCreateMpPreference();
  const { toast } = useToast();
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plano: string) => {
    if (!profile?.team_id) return;

    setRedirectingPlan(plano);
    try {
      const cleanUrl = window.location.origin + window.location.pathname;
      const result = await createPreference.mutateAsync({
        plano,
        team_id: profile.team_id,
        success_url: cleanUrl,
        failure_url: cleanUrl,
      });
      window.location.href = result.init_point;
    } catch (error: any) {
      console.error("Error creating preference:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o pagamento.",
        variant: "destructive",
      });
      setRedirectingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const PLAN_HIERARCHY: Record<string, number> = { free: 0, basico: 1, pro: 2, liga: 3 };
  const currentLevel = PLAN_HIERARCHY[plan] ?? 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
        <p className="mt-2 text-muted-foreground">
          {isActive
            ? `Seu plano atual: ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
            : "Selecione um plano para liberar o acesso ao painel"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrentPlan = isActive && plan === p.id;
          const isUpgrade = PLAN_HIERARCHY[p.id] > currentLevel;
          const isDowngrade = PLAN_HIERARCHY[p.id] < currentLevel;

          return (
            <Card
              key={p.id}
              className={`relative flex flex-col ${
                p.highlight
                  ? "border-2 border-yellow-500 shadow-lg"
                  : ""
              } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-white">Mais popular</Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-600 text-white">Plano atual</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  {p.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      <Check className="mr-2 h-4 w-4" />
                      Plano ativo
                    </Button>
                  ) : isDowngrade ? (
                    <Button disabled className="w-full" variant="ghost">
                      Incluído no seu plano
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(p.id)}
                      disabled={!!redirectingPlan}
                      className={`w-full ${
                        p.highlight ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""
                      }`}
                    >
                      {redirectingPlan === p.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecionando...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {isActive ? "Fazer Upgrade" : "Assinar"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
