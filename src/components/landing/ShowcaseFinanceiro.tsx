import { useInView } from "@/hooks/useInView";

export function ShowcaseFinanceiro() {
  const { ref, inView } = useInView();

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai"];
  const entradas = [45, 60, 55, 70, 65];
  const saidas = [30, 25, 40, 35, 28];
  const maxVal = 80;

  return (
    <section className="py-16 md:py-24 bg-[#0F2440]">
      <div className="container px-4" ref={ref}>
        <div className={`grid md:grid-cols-2 gap-10 items-center ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {/* Mockup */}
          <div className="bg-[#0A1628] border border-white/[0.06] rounded-2xl p-5 shadow-2xl order-2 md:order-1">
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-5">💰 Financeiro</p>

            {/* Bar chart mockup */}
            <div className="flex items-end gap-3 h-32 mb-2">
              {months.map((m, i) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "100%" }}>
                    <div
                      className="flex-1 bg-green-500/60 rounded-t"
                      style={{ height: `${(entradas[i] / maxVal) * 100}%` }}
                    />
                    <div
                      className="flex-1 bg-red-400/60 rounded-t"
                      style={{ height: `${(saidas[i] / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mb-5">
              {months.map((m) => (
                <div key={m} className="flex-1 text-center text-[10px] text-gray-500">{m}</div>
              ))}
            </div>
            <div className="flex gap-4 text-[11px] text-gray-500 mb-5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/60" /> Entradas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400/60" /> Saídas</span>
            </div>

            {/* Saldo */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Entradas", value: "R$ 2.950", color: "text-green-400" },
                { label: "Saídas", value: "R$ 1.580", color: "text-red-400" },
                { label: "Saldo", value: "R$ 1.370", color: "text-gold" },
              ].map((c) => (
                <div key={c.label} className="bg-[#0F2440] rounded-lg p-3 text-center border border-white/[0.04]">
                  <p className={`font-bold text-sm ${c.color}`}>{c.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{c.label}</p>
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
