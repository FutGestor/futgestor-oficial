import { useInView } from "@/hooks/useInView";
import { Check, X, Clock } from "lucide-react";

const jogadores = [
  { name: "Allan", status: "confirmado" },
  { name: "Patrick", status: "confirmado" },
  { name: "William", status: "nao_vai" },
  { name: "Rafael", status: "confirmado" },
  { name: "Bruno", status: "pendente" },
  { name: "Carlos", status: "confirmado" },
];

export function ShowcasePresenca() {
  const { ref, inView } = useInView();

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
            <div className="space-y-2">
              {jogadores.map((j) => (
                <div key={j.name} className="flex items-center justify-between bg-[#0A1628] rounded-lg px-4 py-3 border border-white/[0.04]">
                  <span className="text-sm text-white font-medium">{j.name}</span>
                  {j.status === "confirmado" && (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                      <Check className="h-3.5 w-3.5" /> Confirmado
                    </span>
                  )}
                  {j.status === "nao_vai" && (
                    <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                      <X className="h-3.5 w-3.5" /> Não vai
                    </span>
                  )}
                  {j.status === "pendente" && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                      <Clock className="h-3.5 w-3.5" /> Pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4 text-[11px] text-gray-500">
              <span className="text-green-400 font-bold">4 confirmados</span>
              <span>•</span>
              <span className="text-red-400 font-bold">1 ausente</span>
              <span>•</span>
              <span>1 pendente</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
