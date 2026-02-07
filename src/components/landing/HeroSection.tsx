import { useInView } from "@/hooks/useInView";

export function HeroSection() {
  const { ref, inView } = useInView();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Animated glow background */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-hero-glow pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(27,58,92,0.6) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(212,168,75,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Diagonal lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(-45deg, transparent, transparent 80px, rgba(212,168,75,0.02) 80px, rgba(212,168,75,0.02) 81px)",
        }}
      />

      <div ref={ref} className={`relative z-10 max-w-3xl ${inView ? "animate-fade-in" : "opacity-0"}`}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/25 rounded-full text-gold text-sm font-semibold mb-8">
          ⚽ Novo — Gestão esportiva simplificada
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-wide mb-6">
          CHEGA DE BAGUNÇA<br />NO <span className="text-gold">WHATSAPP</span>
        </h1>

        <p className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto mb-8">
          Abandone o caderno e a confusão no WhatsApp. Financeiro, Escalação, Estatísticas e Área do Jogador — tudo em um só lugar.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => scrollTo("precos")}
            className="px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] shadow-[0_4px_20px_rgba(212,168,75,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,168,75,0.4)] transition-all"
          >
            Criar meu time grátis
          </button>
          <button
            onClick={() => scrollTo("funcionalidades")}
            className="px-8 py-4 rounded-xl font-semibold text-base text-white border border-white/20 hover:border-gold hover:text-gold transition-all"
          >
            Ver funcionalidades
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-8 md:gap-12 justify-center flex-wrap">
          {[
            { num: "100%", label: "Gratuito pra começar" },
            { num: "2min", label: "Pra configurar" },
            { num: "24/7", label: "Acesso pelo celular" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl md:text-4xl text-gold">{s.num}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
