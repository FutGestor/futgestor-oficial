import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-futgestor.png";

export function HeroSection() {
  const scrollToPrecos = () => {
    document.getElementById("precos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 blur-[2px]"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
      <div className="container relative z-10 flex min-h-[600px] md:min-h-[700px] flex-col items-center justify-center px-4 text-center">
        <FutGestorLogo className="h-20 w-20 mb-6 animate-fade-in" />
        <h1 className="mb-4 max-w-3xl text-3xl font-extrabold text-primary-foreground md:text-5xl lg:text-6xl leading-tight animate-fade-in">
          A Gestão Profissional que seu Time de Futebol Merece
        </h1>
        <p className="mb-8 max-w-2xl text-base text-primary-foreground/80 md:text-lg animate-fade-in">
          Abandone o caderno e a confusão no WhatsApp. Financeiro, Escalação, Estatísticas e Área do Jogador — tudo em um só lugar.
        </p>
        <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
          <Button
            size="lg"
            onClick={scrollToPrecos}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-base px-8 py-6 animate-pulse-gold"
          >
            Ver Planos <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
          <Link to="/auth">
            <Button size="lg" variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6">
              Entrar
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
