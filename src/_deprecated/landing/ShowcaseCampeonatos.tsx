import { useInView } from "@/hooks/useInView";

const teams = [
  { pos: 1, name: "Galácticos FC", pts: 15, j: 5, v: 5, e: 0, d: 0, gp: 18, gc: 4, sg: 14 },
  { pos: 2, name: "União Bola", pts: 10, j: 5, v: 3, e: 1, d: 1, gp: 12, gc: 8, sg: 4 },
  { pos: 3, name: "Amigos do Gol", pts: 7, j: 5, v: 2, e: 1, d: 2, gp: 9, gc: 10, sg: -1 },
  { pos: 4, name: "Veteranos SC", pts: 4, j: 5, v: 1, e: 1, d: 3, gp: 6, gc: 13, sg: -7 },
];

const rodadaJogos = [
  { home: "Galácticos FC", away: "Veteranos SC", scoreH: 3, scoreA: 0 },
  { home: "União Bola", away: "Amigos do Gol", scoreH: 2, scoreA: 2 },
];

export function ShowcaseCampeonatos() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 md:py-24 bg-[#0F2440]">
      <div className="container px-4" ref={ref}>
        <div className={`grid md:grid-cols-2 gap-10 items-center ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {/* Mockup */}
          <div className="bg-[#0A1628] border border-white/[0.06] rounded-2xl p-5 shadow-2xl order-2 md:order-1">
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-4">🏆 Copa dos Amigos 2025</p>

            {/* Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-500 border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-1">#</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-center py-2 font-bold text-gold">PTS</th>
                    <th className="text-center py-2">J</th>
                    <th className="text-center py-2">V</th>
                    <th className="text-center py-2">E</th>
                    <th className="text-center py-2">D</th>
                    <th className="text-center py-2">GP</th>
                    <th className="text-center py-2">GC</th>
                    <th className="text-center py-2">SG</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.pos} className={`border-b border-white/[0.03] ${t.pos === 1 ? "text-gold" : "text-gray-300"}`}>
                      <td className="py-2 pr-1 font-bold">{t.pos}</td>
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="text-center py-2 font-bold text-gold">{t.pts}</td>
                      <td className="text-center py-2">{t.j}</td>
                      <td className="text-center py-2">{t.v}</td>
                      <td className="text-center py-2">{t.e}</td>
                      <td className="text-center py-2">{t.d}</td>
                      <td className="text-center py-2">{t.gp}</td>
                      <td className="text-center py-2">{t.gc}</td>
                      <td className="text-center py-2">{t.sg > 0 ? `+${t.sg}` : t.sg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodada games */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Jogos da Rodada 5</p>
                <span className="text-[9px] text-gray-600 bg-[#0F2440] px-2 py-0.5 rounded border border-white/[0.06]">Rodada 5 ▾</span>
              </div>
              <div className="space-y-1.5">
                {rodadaJogos.map((g) => (
                  <div key={g.home + g.away} className="flex items-center justify-between bg-[#0F2440] rounded-lg px-3 py-2 border border-white/[0.04]">
                    <span className="text-[11px] text-gray-300 flex-1 text-right">{g.home}</span>
                    <span className="text-xs font-bold text-white mx-3 bg-[#0A1628] px-2 py-0.5 rounded">
                      {g.scoreH} × {g.scoreA}
                    </span>
                    <span className="text-[11px] text-gray-300 flex-1">{g.away}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Campeonatos</p>
            <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide mb-4">
              CRIE CAMPEONATOS E LIGAS COMPLETAS
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Tabela de classificação automática, rodadas organizadas, resultados em tempo real.
            </p>
            <ul className="space-y-3">
              {[
                "Classificação calculada automaticamente",
                "Rodadas com confrontos e placares",
                "Tabela pública no portal do time",
                "Gestão completa de torneios",
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
