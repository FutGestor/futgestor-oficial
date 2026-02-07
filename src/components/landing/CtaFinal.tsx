import { Link } from "react-router-dom";
import { CalendarCheck, DollarSign, Smartphone } from "lucide-react";

const highlights = [
  { icon: CalendarCheck, text: "Agenda, escalação e resultados organizados" },
  { icon: DollarSign, text: "Financeiro transparente para todo o elenco" },
  { icon: Smartphone, text: "Acesso pelo celular, sem instalar nada" },
];

export function CtaFinal() {
  return (
    <section className="py-16 md:py-24 text-center bg-[#0A1628] relative overflow-hidden">
      {/* Gold radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,168,75,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="container px-4 relative">
        <h2 className="font-display text-3xl md:text-5xl text-white tracking-wide mb-4">
          SEU TIME MERECE<br />ORGANIZAÇÃO DE VERDADE
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          Junte-se a centenas de times que já saíram do caos do WhatsApp
        </p>

        {/* Mini highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
          {highlights.map((h) => (
            <div key={h.text} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white/[0.03] border border-white/10">
              <h.icon className="w-7 h-7 text-gold" />
              <p className="text-sm text-gray-300 leading-relaxed">{h.text}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Planos a partir de R$ 9,90/mês
        </p>

        <Link
          to="/auth?tab=signup&redirect=onboarding"
          className="inline-flex px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] shadow-[0_4px_20px_rgba(212,168,75,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,168,75,0.4)] transition-all"
        >
          Criar meu time agora
        </Link>
      </div>
    </section>
  );
}
