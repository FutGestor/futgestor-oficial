import { DollarSign, Users, Smartphone } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import screenshotFinanceiro from "@/assets/screenshots/financeiro.png";
import screenshotEscalacao from "@/assets/screenshots/escalacao.png";
import screenshotRanking from "@/assets/screenshots/ranking.png";

const features = [
  {
    icon: DollarSign,
    title: "O Fim do Calote",
    description:
      "Controle quem pagou a mensalidade, quem está devendo e acompanhe o caixa do time em tempo real. Gere cobranças individuais e mantenha as finanças organizadas sem planilha nenhuma.",
    image: screenshotFinanceiro,
    imageAlt: "Dashboard Financeiro do FutGestor",
  },
  {
    icon: Users,
    title: "Escalação Profissional",
    description:
      "Monte a formação no campo tático interativo — suporta 5x5, 7x7 e 11x11. Arraste os jogadores, escolha a formação e compartilhe a imagem direto no grupo do WhatsApp.",
    image: screenshotEscalacao,
    imageAlt: "Campo Tático do FutGestor",
  },
  {
    icon: Smartphone,
    title: "Cada Atleta com seu Acesso",
    description:
      "No Plano Liga, cada jogador recebe login próprio. Ele vê quanto deve, confirma presença nos jogos e acompanha suas estatísticas — tirando todo esse trabalho do organizador.",
    image: screenshotRanking,
    imageAlt: "Área do Jogador no FutGestor",
  },
];

function FeatureBlock({
  feature,
  reversed,
}: {
  feature: (typeof features)[0];
  reversed: boolean;
}) {
  const { ref, inView } = useInView();
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-8 items-center ${
        reversed ? "md:flex-row-reverse" : "md:flex-row"
      } ${inView ? "animate-fade-in" : "opacity-0"}`}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
            <Icon className="h-6 w-6 text-secondary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground md:text-3xl">{feature.title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
          {feature.description}
        </p>
      </div>
      <div className="flex-1 w-full">
        <img
          src={feature.image}
          alt={feature.imageAlt}
          className="w-full rounded-xl shadow-lg border border-border"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export function ZigZagFeatures() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-muted py-16 md:py-24">
      <div className="container px-4">
        <div ref={ref} className={inView ? "animate-fade-in" : "opacity-0"}>
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground md:text-3xl">
            Por que escolher o FutGestor?
          </h2>
          <p className="mb-16 text-center text-muted-foreground max-w-2xl mx-auto">
            Tudo que seu time precisa para sair do amadorismo — sem complicação.
          </p>
        </div>
        <div className="space-y-16 md:space-y-24 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <FeatureBlock key={f.title} feature={f} reversed={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
