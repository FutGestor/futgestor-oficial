import { useInView } from "@/hooks/useInView";
import { Check, X, Clock } from "lucide-react";

const jogadores = [
  { name: "Allan", initials: "A", pos: "Zagueiro", status: "confirmado" },
  { name: "Patrick", initials: "P", pos: "Meia", status: "confirmado" },
  { name: "William", initials: "W", pos: "Atacante", status: "nao_vai" },
  { name: "Rafael", initials: "R", pos: "Lateral", status: "confirmado" },
  { name: "Bruno", initials: "B", pos: "Volante", status: "pendente" },
  { name: "Carlos", initials: "C", pos: "Goleiro", status: "confirmado" },
];

const statusConfig = {
  confirmado: { icon: Check, label: "Confirmado", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  nao_vai: { icon: X, label: "Não vai", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  pendente: { icon: Clock, label: "Pendente", color: "text-gray-500", bg: "bg-gray-500/10 border-gray-500/20" },
} as const;

export function ShowcasePresenca() {
  const { ref, inView } = useInView();

  const confirmados = jogadores.filter((j) => j.status === "confirmado").length;
  const ausentes = jogadores.filter((j) => j.status === "nao_vai").length;
  const pendentes = jogadores.filter((j) => j.status === "pendente").length;

  return (
    <section className="py-16 md:py-24 bg-[#0A1628]">
      <div className="container px-4" ref={ref}>
        <div className={`grid md:grid-cols-2 gap-10 items-center ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {/* Text */}
          <div>
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Presença</p>
            <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide mb-4">
              SAIBA QUEM VAI JOGAR ANTES DO JOGO
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Gere um link, mande no WhatsApp, pronto. Simples assim.
            </p>
            <ul className="space-y-3">
              {[
                "Link único por jogo, sem necessidade de login",
                "Jogador confirma em 3 segundos",
                "Resumo de confirmados / ausentes / pendentes",
                "Monte a escalação com antecedência",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup */}
          <div className="bg-[#0F2440] border border-white/[0.06] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gold uppercase tracking-[3px]">⚽ vs Amigos do Gol — 15/03</p>
            </div>

            {/* Summary badges */}
            <div className="flex gap-2 mb-4">
              <span className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                {confirmados} confirmados
              </span>
              <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                {ausentes} ausentes
              </span>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-500/10 border border-gray-500/20 rounded-full px-3 py-1">
                {pendentes} pendentes
              </span>
            </div>

            <div className="space-y-2">
              {jogadores.map((j) => {
                const cfg = statusConfig[j.status as keyof typeof statusConfig];
                const Icon = cfg.icon;
                return (
                  <div key={j.name} className="flex items-center justify-between bg-[#0A1628] rounded-lg px-4 py-3 border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy/60 border border-white/10 flex items-center justify-center text-xs font-bold text-gold">
                        {j.initials}
                      </div>
                      <div>
                        <span className="text-sm text-white font-medium block">{j.name}</span>
                        <span className="text-[10px] text-gray-500">{j.pos}</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-3 w-3" /> {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
