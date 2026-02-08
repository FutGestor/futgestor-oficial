import { useInView } from "@/hooks/useInView";

const teams = [
  { pos: 1, name: "Galácticos FC", pts: 15, w: 5, d: 0, l: 0, gf: 18, ga: 4 },
  { pos: 2, name: "União Bola", pts: 10, w: 3, d: 1, l: 1, gf: 12, ga: 8 },
  { pos: 3, name: "Amigos do Gol", pts: 7, w: 2, d: 1, l: 2, gf: 9, ga: 10 },
  { pos: 4, name: "Veteranos SC", pts: 4, w: 1, d: 1, l: 3, gf: 6, ga: 13 },
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
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-2">#</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-center py-2">P</th>
                    <th className="text-center py-2">V</th>
                    <th className="text-center py-2">E</th>
                    <th className="text-center py-2">D</th>
                    <th className="text-center py-2">GP</th>
                    <th className="text-center py-2">GC</th>
                    <th className="text-center py-2 font-bold text-gold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.pos} className={`border-b border-white/[0.03] ${t.pos === 1 ? "text-gold" : "text-gray-300"}`}>
                      <td className="py-2.5 pr-2 font-bold">{t.pos}</td>
                      <td className="py-2.5 font-medium">{t.name}</td>
                      <td className="text-center py-2.5">{t.w + t.d + t.l}</td>
                      <td className="text-center py-2.5">{t.w}</td>
                      <td className="text-center py-2.5">{t.d}</td>
                      <td className="text-center py-2.5">{t.l}</td>
                      <td className="text-center py-2.5">{t.gf}</td>
                      <td className="text-center py-2.5">{t.ga}</td>
                      <td className="text-center py-2.5 font-bold text-gold">{t.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
