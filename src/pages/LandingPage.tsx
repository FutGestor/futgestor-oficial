import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { DollarSign, Users, Smartphone, Check, Trophy, Shield, Star, ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-futgestor.png";

import screenshotAgenda from "@/assets/screenshots/agenda.png";
import screenshotResultados from "@/assets/screenshots/resultados.png";
import screenshotRanking from "@/assets/screenshots/ranking.png";
import screenshotFinanceiro from "@/assets/screenshots/financeiro.png";
import screenshotEscalacao from "@/assets/screenshots/escalacao.png";
import screenshotAvisos from "@/assets/screenshots/avisos.png";

const screenshots = [
  { src: screenshotAgenda, label: "Agenda de Jogos" },
  { src: screenshotResultados, label: "Resultados" },
  { src: screenshotRanking, label: "Ranking & Artilharia" },
  { src: screenshotFinanceiro, label: "Financeiro" },
  { src: screenshotEscalacao, label: "Escalação Tática" },
  { src: screenshotAvisos, label: "Avisos" },
];

const problems = [
  {
    icon: DollarSign,
    title: "Chega de Calote",
    description: "Painel Financeiro automático. Saiba exatamente quem pagou a mensalidade e quem está devendo.",
  },
  {
    icon: Users,
    title: "Escalação Sem Briga",
    description: "Monte o time no campo tático virtual e compartilhe a escalação diretamente no grupo.",
  },
  {
    icon: Smartphone,
    title: "Área do Jogador",
    description: "Cada atleta tem seu próprio acesso para confirmar presença, ver débitos e acompanhar estatísticas.",
  },
];

const plans = [
  {
    name: "Básico",
    price: "9,90",
    ideal: "Organização Visual",
    icon: Shield,
    featured: false,
    features: [
      "Agenda de Jogos",
      "Escalação Tática (Campo Virtual)",
      "Histórico de Resultados",
      "Página Pública do Time",
      "Ranking de Jogadores",
    ],
    note: "Sem gestão financeira",
  },
  {
    name: "Pro",
    price: "19,90",
    ideal: "Gestão Completa",
    icon: Trophy,
    featured: true,
    features: [
      "Tudo do Básico",
      "Controle Financeiro (Caixa e Mensalidades)",
      "Avisos Automáticos para o Elenco",
      "Relatórios de Presença",
      "Suporte Prioritário",
    ],
    note: null,
  },
  {
    name: "Liga",
    price: "39,90",
    ideal: "Ecossistema Profissional",
    icon: Star,
    featured: false,
    features: [
      "Tudo do Pro",
      "Login Exclusivo para Jogadores",
      "Jogadores veem suas próprias dívidas",
      "Gestão de Campeonatos",
      "Painel do Atleta Completo",
    ],
    note: null,
  },
];

const faqs = [
  {
    q: "Como funciona o pagamento?",
    a: "O pagamento é feito via Pix ou Cartão de Crédito, com renovação mensal automática. Não há fidelidade — cancele quando quiser, sem multas.",
  },
  {
    q: "O que é o Login de Jogadores do Plano Liga?",
    a: "No Plano Liga, cada atleta recebe um acesso exclusivo ao sistema. Ele pode ver quanto deve de mensalidade, confirmar presença nos jogos e acompanhar suas estatísticas — tirando todo esse trabalho do administrador.",
  },
  {
    q: "Serve para Society e Campo?",
    a: "Sim! O FutGestor suporta formações de 5x5 (Society), 7x7 e 11x11 (Campo). O campo tático se adapta automaticamente à modalidade escolhida.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="container relative z-10 flex min-h-[600px] md:min-h-[700px] flex-col items-center justify-center px-4 text-center">
          <FutGestorLogo className="h-20 w-20 mb-6" />
          <h1 className="mb-4 max-w-3xl text-3xl font-extrabold text-primary-foreground md:text-5xl lg:text-6xl leading-tight">
            A Gestão Profissional que seu Time de Futebol Merece
          </h1>
          <p className="mb-8 max-w-2xl text-base text-primary-foreground/80 md:text-lg">
            Abandone o caderno e a confusão no WhatsApp. Financeiro, Escalação e Estatísticas em um só lugar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth?tab=signup&redirect=onboarding">
              <Button
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-base px-8 py-6 animate-pulse-gold"
              >
                Começar Agora <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PROBLEMA vs SOLUÇÃO ===== */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
            Por que escolher o FutGestor?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {problems.map((p) => (
              <Card key={p.title} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="items-center text-center pb-2">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20">
                    <p.icon className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  {p.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEMONSTRAÇÃO ===== */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container px-4">
          <h2 className="mb-4 text-center text-2xl font-bold text-primary-foreground md:text-3xl">
            Veja o FutGestor em Ação
          </h2>
          <p className="mb-12 text-center text-primary-foreground/70 text-sm md:text-base">
            Telas reais do sistema — do agendamento ao financeiro.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            {screenshots.map((s) => (
              <div key={s.label} className="group overflow-hidden rounded-lg border border-primary-foreground/10 bg-primary-foreground/5">
                <img
                  src={s.src}
                  alt={s.label}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <p className="py-2 text-center text-xs font-medium text-primary-foreground/80">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="bg-muted py-16 md:py-24" id="planos">
        <div className="container px-4">
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground md:text-3xl">
            Escolha seu Plano
          </h2>
          <p className="mb-12 text-center text-muted-foreground text-sm">
            Sem fidelidade. Cancele quando quiser.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.featured
                    ? "border-2 border-secondary shadow-xl scale-[1.03] md:scale-105"
                    : "border shadow-md"
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
                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                        {f}
                      </li>
                    ))}
                  </ul>
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

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-primary py-8">
        <div className="container flex flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <FutGestorLogo className="h-8 w-8" />
            <span className="text-sm text-primary-foreground/70">© 2026 FutGestor. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/auth" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Login
            </Link>
            <Link to="/auth?tab=signup&redirect=onboarding" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Cadastro
            </Link>
            <Link to="/termos" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
