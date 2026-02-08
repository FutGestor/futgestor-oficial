import { useInView } from "@/hooks/useInView";
import { DollarSign, Users, CalendarDays, Zap } from "lucide-react";

export function ShowcaseDashboard() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 md:py-24 bg-[#0A1628]">
      <div className="container px-4" ref={ref}>
        <div className={`grid md:grid-cols-2 gap-10 items-center ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {/* Text */}
          <div>
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Painel Administrativo</p>
            <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide mb-4">
              TUDO SOB CONTROLE EM UM ÚNICO PAINEL
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Dashboard completo com visão geral do seu time. Gerencie tudo de um só lugar.
            </p>
            <ul className="space-y-3">
              {[
                "Saldo financeiro em tempo real",
                "Próximos jogos e confirmações de presença",
                "Escalação visual no campinho interativo",
                "Atalhos rápidos para cada função",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup */}
          <div className="bg-[#0F2440] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: DollarSign, label: "Saldo", value: "R$ 850", color: "text-green-400" },
                { icon: Users, label: "Jogadores", value: "18", color: "text-blue-400" },
                { icon: CalendarDays, label: "Próx. jogos", value: "4", color: "text-gold" },
              ].map((c) => (
                <div key={c.label} className="bg-[#0A1628] rounded-xl p-4 text-center border border-white/[0.04]">
                  <c.icon className={`h-5 w-5 mx-auto mb-1 ${c.color}`} />
                  <p className={`font-bold text-lg ${c.color}`}>{c.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#0A1628] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-gold" /> Escalação — 4-3-3
              </p>
              <div className="space-y-2">
                {["GOL — Lucas", "ZAG — Patrick, Allan", "MEI — William, Carlos, Thiago", "ATA — Rafael, Bruno, João"].map((l) => (
                  <div key={l} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-gold" />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
