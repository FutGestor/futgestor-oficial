import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trophy, Shield, Star } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const allFeatures = [
  "Agenda de Jogos",
  "Escalação Tática (Campo Virtual)",
  "Histórico de Resultados",
  "Página Pública do Time",
  "Ranking de Jogadores",
  "Controle Financeiro (Caixa e Mensalidades)",
  "Avisos Automáticos para o Elenco",
  "Relatórios de Presença",
  "Suporte Prioritário",
  "Login Exclusivo para Jogadores",
  "Jogadores veem suas próprias dívidas",
  "Gestão de Campeonatos",
  "Painel do Atleta Completo",
];

const plans = [
  {
    name: "Básico",
    price: "9,90",
    ideal: "Organização Visual",
    icon: Shield,
    featured: false,
    included: 5,
    note: "Sem gestão financeira",
  },
  {
    name: "Pro",
    price: "19,90",
    ideal: "Gestão Completa",
    icon: Trophy,
    featured: true,
    included: 9,
    note: null,
  },
  {
    name: "Liga",
    price: "39,90",
    ideal: "Ecossistema Profissional",
    icon: Star,
    featured: false,
    included: 13,
    note: null,
    highlight: "Login para Jogadores: INCLUSO",
  },
];

export function PricingSection() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-muted py-16 md:py-24" id="precos">
      <div className="container px-4">
        <div ref={ref} className={inView ? "animate-fade-in" : "opacity-0"}>
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground md:text-3xl">
            Escolha seu Plano
          </h2>
          <p className="mb-12 text-center text-muted-foreground text-sm">
            Sem fidelidade. Cancele quando quiser.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col rounded-xl ${
                plan.featured
                  ? "border-2 border-secondary shadow-xl scale-[1.03] md:scale-105 ring-1 ring-secondary/30"
                  : "border shadow-lg"
              }`}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 text-xs font-bold">
                  MAIS POPULAR
                </Badge>
              )}
              <CardHeader className="items-center text-center pt-8">
                <plan.icon className={`h-8 w-8 mb-2 ${plan.featured ? "text-secondary" : "text-primary"}`} />
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Ideal para: {plan.ideal}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">R$ {plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-2.5">
                  {allFeatures.map((f, i) => {
                    const included = i < plan.included;
                    return (
                      <li key={f} className={`flex items-start gap-2 text-sm ${included ? "text-foreground" : "text-muted-foreground/50"}`}>
                        {included ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30" />
                        )}
                        <span className={!included ? "line-through" : ""}>{f}</span>
                      </li>
                    );
                  })}
                </ul>
                {plan.highlight && (
                  <p className="mb-4 text-xs text-center font-bold text-secondary bg-secondary/10 rounded-lg py-2">
                    🎯 {plan.highlight}
                  </p>
                )}
                {plan.note && (
                  <p className="mb-4 text-xs text-center text-muted-foreground italic">{plan.note}</p>
                )}
                <Link to="/auth?tab=signup&redirect=onboarding" className="mt-auto">
                  <Button
                    className={`w-full font-bold ${
                      plan.featured
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : ""
                    }`}
                    variant={plan.featured ? "default" : "outline"}
                    size="lg"
                  >
                    Assinar Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
