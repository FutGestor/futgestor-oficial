import { useInView } from "@/hooks/useInView";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Agenda organizada", fg: true, wpp: false, excel: false },
  { feature: "Escalação visual", fg: true, wpp: false, excel: false },
  { feature: "Confirmação de presença", fg: true, wpp: false, excel: false },
  { feature: "Controle financeiro", fg: true, wpp: false, excel: true },
  { feature: "Campeonatos e ligas", fg: true, wpp: false, excel: false },
  { feature: "Portal do time", fg: true, wpp: false, excel: false },
  { feature: "Ranking de jogadores", fg: true, wpp: false, excel: false },
  { feature: "Votação de destaque", fg: true, wpp: false, excel: false },
];

function Ico({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="h-4 w-4 text-green-400 mx-auto" />
  ) : (
    <X className="h-4 w-4 text-red-400/50 mx-auto" />
  );
}

export function ComparisonTable() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 md:py-24 bg-[#0A1628]">
      <div className="container px-4 max-w-3xl" ref={ref}>
        <div className={`text-center mb-10 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Comparativo</p>
          <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">POR QUE TROCAR?</h2>
        </div>

        <div className={`overflow-x-auto ${inView ? "animate-fade-in" : "opacity-0"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-gray-400 font-normal">Funcionalidade</th>
                <th className="text-center py-3 text-gold font-bold">FutGestor</th>
                <th className="text-center py-3 text-gray-400 font-normal">WhatsApp</th>
                <th className="text-center py-3 text-gray-400 font-normal">Excel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature} className="border-b border-white/[0.04]">
                  <td className="py-3 text-gray-300">{r.feature}</td>
                  <td className="py-3"><Ico ok={r.fg} /></td>
                  <td className="py-3"><Ico ok={r.wpp} /></td>
                  <td className="py-3"><Ico ok={r.excel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
