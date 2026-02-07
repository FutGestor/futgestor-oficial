import { useInView } from "@/hooks/useInView";

const features = [
  { emoji: "📅", title: "Agenda de Jogos", desc: "Marque jogos com data, horário e local. Seus jogadores veem tudo pelo celular. Chega de \"que horas é o jogo?\"" },
  { emoji: "⚽", title: "Escalação Visual", desc: "Monte a escalação no campinho interativo. Escolha formação, posição de cada jogador e publique pro time ver." },
  { emoji: "👥", title: "Elenco Completo", desc: "Perfil de cada jogador com foto, posição e apelido. Ranking de gols e participações atualizado automaticamente." },
  { emoji: "💰", title: "Controle Financeiro", desc: "Registre mensalidades, despesas com campo e uniforme. Saldo sempre visível. Transparência total pro time." },
  { emoji: "📊", title: "Resultados e Estatísticas", desc: "Registre placares e veja o histórico de vitórias, derrotas e empates. Estatísticas por jogador e por temporada." },
  { emoji: "📢", title: "Avisos e Comunicados", desc: "Publique avisos importantes que ficam fixos no portal do time. Sem se perder no meio de 200 mensagens." },
];

export function FeaturesGrid() {
  const { ref, inView } = useInView();

  return (
    <section id="funcionalidades" className="py-16 md:py-24 bg-[#0F2440]">
      <div className="container px-4" ref={ref}>
        <div className={`text-center mb-12 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Funcionalidades</p>
          <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">TUDO QUE SEU TIME PRECISA</h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">Cada funcionalidade foi pensada para facilitar a vida de quem gerencia time amador</p>
        </div>

        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative bg-[rgba(15,36,64,0.6)] border border-white/[0.06] rounded-xl p-6 transition-all duration-400 hover:-translate-y-1 hover:border-gold/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              {/* Gold bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-[#F0CC6B] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <span className="text-3xl mb-3 block">{f.emoji}</span>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
