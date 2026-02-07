import { useInView } from "@/hooks/useInView";

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Cadastro rápido com email. Sem cartão de crédito." },
  { num: "02", title: "Cadastre seu time", desc: "Nome, escudo e pronto. Seu time tem um portal próprio." },
  { num: "03", title: "Adicione jogadores", desc: "Cadastre o elenco. Eles acessam pelo celular com o link do time." },
  { num: "04", title: "Gerencie tudo", desc: "Jogos, escalação, finanças, resultados. Tudo no mesmo lugar." },
];

export function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-[#0A1628]">
      <div className="container px-4" ref={ref}>
        <div className={`text-center mb-12 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Como funciona</p>
          <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">PRONTO EM 4 PASSOS</h2>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {steps.map((s, i) => (
            <div key={s.num} className="text-center relative">
              <span className="font-display text-6xl text-gold/30 leading-none">{s.num}</span>
              <h3 className="text-base font-bold text-white mt-3 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              {/* Arrow between steps (desktop only) */}
              {i < steps.length - 1 && (
                <span className="hidden lg:block absolute -right-5 top-8 text-gold/30 text-2xl">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
