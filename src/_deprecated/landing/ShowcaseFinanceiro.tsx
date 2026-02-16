import { useInView } from "@/hooks/useInView";

export function ShowcaseFinanceiro() {
  const { ref, inView } = useInView();

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai"];
  const entradas = [45, 60, 55, 70, 65];
  const saidas = [30, 25, 40, 35, 28];
  const maxVal = 80;

  const transacoes = [
    { desc: "Mensalidade Março", tipo: "entrada", valor: "R$ 450" },
    { desc: "Aluguel Campo", tipo: "saida", valor: "R$ 280" },
    { desc: "Churrasco pós-jogo", tipo: "saida", valor: "R$ 150" },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#0F2440]">
      <div className="container px-4" ref={ref}>
        <div className={`grid md:grid-cols-2 gap-10 items-center ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {/* Mockup */}
          <div className="bg-[#0A1628] border border-white/[0.06] rounded-2xl p-5 shadow-2xl order-2 md:order-1">
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-4">💰 Financeiro</p>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Saldo Atual", value: "R$ 1.370", color: "text-gold" },
                { label: "Total Arrecadado", value: "R$ 2.950", color: "text-green-400" },
                { label: "Total Gasto", value: "R$ 1.580", color: "text-red-400" },
              ].map((c) => (
                <div key={c.label} className="bg-[#0F2440] rounded-lg p-2.5 text-center border border-white/[0.04]">
                  <p className={`font-bold text-sm ${c.color}`}>{c.value}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {/* Bar chart */}
              <div className="col-span-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Entradas vs Saídas</p>
                <div className="flex items-end gap-2 h-24">
                  {months.map((m, i) => (
                    <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex gap-0.5 items-end" style={{ height: "100%" }}>
                        <div className="flex-1 bg-green-500/60 rounded-t" style={{ height: `${(entradas[i] / maxVal) * 100}%` }} />
                        <div className="flex-1 bg-red-400/60 rounded-t" style={{ height: `${(saidas[i] / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-[8px] text-gray-600">{m}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-[9px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-green-500/60" /> Entradas</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-red-400/60" /> Saídas</span>
                </div>
              </div>

              {/* Pie chart mockup */}
              <div className="col-span-2">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Por Categoria</p>
                <div className="relative w-20 h-20 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="40 60" strokeDashoffset="0" opacity="0.6" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f87171" strokeWidth="3" strokeDasharray="30 70" strokeDashoffset="-40" opacity="0.6" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d4a84b" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-70" opacity="0.6" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#60a5fa" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-90" opacity="0.6" />
                  </svg>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center text-[8px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-green-500/60" />Campo</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-red-400/60" />Uniforme</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-gold/60" />Evento</span>
                </div>
              </div>
            </div>

            {/* Transactions mini table */}
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Últimas Transações</p>
            <div className="space-y-1.5">
              {transacoes.map((t) => (
                <div key={t.desc} className="flex items-center justify-between bg-[#0F2440] rounded-lg px-3 py-2 border border-white/[0.04]">
                  <span className="text-[11px] text-gray-300">{t.desc}</span>
                  <span className={`text-[11px] font-bold ${t.tipo === "entrada" ? "text-green-400" : "text-red-400"}`}>
                    {t.tipo === "saida" ? "-" : "+"}{t.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Financeiro</p>
            <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide mb-4">
              TRANSPARÊNCIA TOTAL NAS FINANÇAS DO TIME
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Controle completo de entradas, saídas e saldo. Seu time sabe exatamente pra onde o dinheiro vai.
            </p>
            <ul className="space-y-3">
              {[
                "Saldo atual sempre visível",
                "Entradas e saídas por categoria",
                "Gráficos de evolução mensal",
                "Histórico completo de transações",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
