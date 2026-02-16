import { useInView } from "@/hooks/useInView";

const testimonials = [
  {
    text: "Acabou a bagunça do grupo. Agora todo mundo sabe o horário do jogo, quem vai e quem não vai. Organizou demais.",
    author: "Ricardo M.",
    role: "Gestor do Armação FC — Society",
  },
  {
    text: "A caixinha do time era uma zona. Agora tá tudo registrado, todo mundo vê o saldo. Zero discussão sobre dinheiro.",
    author: "Thiago S.",
    role: "Gestor do Cachaça FC — Pelada",
  },
  {
    text: "Montar a escalação no campinho e mandar pro grupo é sensacional. Os caras adoram. Time com cara de profissional.",
    author: "Felipe L.",
    role: "Gestor do Resenha FC — Society",
  },
];

export function TestimonialsSection() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 md:py-20 bg-[#0A1628]">
      <div className="container px-4" ref={ref}>
        <div className={`text-center mb-12 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Depoimentos</p>
          <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">QUEM USA, RECOMENDA</h2>
        </div>

        <div className={`grid md:grid-cols-3 gap-5 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {testimonials.map((t) => (
            <div key={t.author} className="bg-[rgba(15,36,64,0.4)] border border-white/5 rounded-xl p-6">
              <p className="text-gold text-sm tracking-widest mb-4">★★★★★</p>
              <p className="text-sm text-gray-300 leading-relaxed italic mb-5">"{t.text}"</p>
              <p className="text-sm font-semibold text-white">{t.author}</p>
              <p className="text-xs text-gray-500">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
