import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useInView } from "@/hooks/useInView";

import screenshotAgenda from "@/assets/screenshots/agenda.png";
import screenshotResultados from "@/assets/screenshots/resultados.png";
import screenshotRanking from "@/assets/screenshots/ranking.png";
import screenshotFinanceiro from "@/assets/screenshots/financeiro.png";
import screenshotEscalacao from "@/assets/screenshots/escalacao.png";
import screenshotAvisos from "@/assets/screenshots/avisos.png";

const screenshots = [
  { src: screenshotAgenda, label: "Agenda de Jogos" },
  { src: screenshotResultados, label: "Resultados" },
  { src: screenshotRanking, label: "Ranking & Artilharia" },
  { src: screenshotFinanceiro, label: "Financeiro" },
  { src: screenshotEscalacao, label: "Escalação Tática" },
  { src: screenshotAvisos, label: "Avisos" },
];

export function GallerySection() {
  const [selected, setSelected] = useState<(typeof screenshots)[0] | null>(null);
  const { ref, inView } = useInView();

  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="container px-4">
        <div ref={ref} className={inView ? "animate-fade-in" : "opacity-0"}>
          <h2 className="mb-4 text-center text-2xl font-bold text-primary-foreground md:text-3xl">
            Por Dentro do App
          </h2>
          <p className="mb-12 text-center text-primary-foreground/70 text-sm md:text-base">
            Clique em qualquer tela para ver em tamanho real.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {screenshots.map((s) => (
            <button
              key={s.label}
              onClick={() => setSelected(s)}
              className="group relative overflow-hidden rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <img
                src={s.src}
                alt={s.label}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-primary/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Eye className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="py-2 text-center text-xs font-medium text-primary-foreground/80">
                {s.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl p-2 bg-primary border-primary-foreground/20">
          {selected && (
            <div>
              <img
                src={selected.src}
                alt={selected.label}
                className="w-full rounded-lg"
              />
              <p className="mt-2 text-center text-sm font-medium text-primary-foreground">
                {selected.label}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
