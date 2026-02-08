import { Link } from "react-router-dom";
import { Check, Trophy, Shield, Star } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const plans = [
  {
    name: "Básico",
    price: "9,90",
    ideal: "Organização Visual",
    icon: Shield,
    featured: false,
    features: [
      "Dashboard do time",
      "Gerenciamento de Jogos",
      "Escalação Tática (Campo Virtual)",
      "Portal Público do Time",
    ],
  },
  {
    name: "Pro",
    price: "19,90",
    ideal: "Gestão Completa",
    icon: Trophy,
    featured: true,
    features: [
      "Tudo do Básico +",
      "Ranking de Jogadores",
      "Resultados e Estatísticas",
      "Confirmação de Presença",
      "Controle Financeiro completo",
      "Avisos e Comunicados",
      "Solicitações de Amistosos",
      "Estatísticas Avançadas por Jogador",
    ],
  },
  {
    name: "Liga",
    price: "39,90",
    ideal: "Ecossistema Profissional",
    icon: Star,
    featured: false,
    features: [
      "Tudo do Pro +",
      "Campeonatos e Torneios",
      "Login para Jogadores",
      "Convidar Jogadores (acesso externo)",
      "Suporte Prioritário",
    ],
  },
];

export function PricingSection() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 md:py-24 bg-[#0F2440]" id="precos">
      <div className="container px-4">
        <div ref={ref} className={inView ? "animate-fade-in" : "opacity-0"}>
          <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3 text-center">Planos</p>
          <h2 className="mb-4 text-center font-display text-3xl md:text-4xl text-white tracking-wide">
            ESCOLHA SEU PLANO
          </h2>
          <p className="mb-12 text-center text-gray-500 text-sm">
            Sem fidelidade. Cancele quando quiser.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl bg-[#0A1628] border ${
                plan.featured
                  ? "border-gold/40 shadow-[0_0_40px_rgba(212,168,75,0.1)] scale-[1.02] md:scale-105"
                  : "border-white/[0.06]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] px-4 py-1 rounded-full text-xs font-bold">
                    MAIS POPULAR
                  </span>
                </div>
              )}
              <div className="items-center text-center pt-8 px-6 pb-4">
                <plan.icon className={`h-8 w-8 mx-auto mb-2 ${plan.featured ? "text-gold" : "text-gray-400"}`} />
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Ideal para: {plan.ideal}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-white">R$ {plan.price}</span>
                  <span className="text-sm text-gray-500">/mês</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col px-6 pb-6">
                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth?tab=signup&redirect=onboarding" className="mt-auto">
                  <button
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.featured
                        ? "bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] shadow-[0_4px_20px_rgba(212,168,75,0.3)] hover:shadow-[0_8px_30px_rgba(212,168,75,0.4)]"
                        : "border border-white/20 text-white hover:border-gold hover:text-gold"
                    }`}
                  >
                    Assinar Agora
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
