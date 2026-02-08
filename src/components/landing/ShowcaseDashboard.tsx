import { useInView } from "@/hooks/useInView";
import { DollarSign, Users, CalendarDays, CheckCircle2, Gamepad2, UserCog, BarChart3, FileText } from "lucide-react";

const statsCards = [
  { icon: DollarSign, label: "Saldo Atual", value: "R$ 1.370", color: "text-green-400" },
  { icon: Users, label: "Jogadores Ativos", value: "18", color: "text-blue-400" },
  { icon: CalendarDays, label: "Próximos Jogos", value: "3", color: "text-gold" },
  { icon: CheckCircle2, label: "Jogos Finalizados", value: "12", color: "text-purple-400" },
];

const shortcuts = [
  { icon: Gamepad2, label: "Gerenciar Jogos" },
  { icon: UserCog, label: "Gerenciar Jogadores" },
  { icon: BarChart3, label: "Ver Resultados" },
  { icon: FileText, label: "Ver Financeiro" },
];

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
          <div className="bg-[#0F2440] border border-white/[0.06] rounded-2xl p-5 shadow-2xl">
            {/* 4 stats cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {statsCards.map((c) => (
                <div key={c.label} className="bg-[#0A1628] rounded-xl p-3.5 border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-1">
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</p>
                  </div>
                  <p className={`font-bold text-lg ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Quick shortcuts */}
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Atalhos Rápidos</p>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-[#0A1628] rounded-lg px-3 py-2.5 border border-white/[0.04] cursor-pointer hover:border-gold/30 transition-colors">
                  <s.icon className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs text-gray-300">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
