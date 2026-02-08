import { useInView } from "@/hooks/useInView";

const features = [
  { emoji: "📅", title: "Agenda de Jogos", desc: "Marque jogos com data, horário e local. Seus jogadores veem tudo pelo celular.", plan: "Básico" },
  { emoji: "⚽", title: "Escalação Visual", desc: "Monte a escalação no campinho interativo. Escolha formação e posição de cada jogador.", plan: "Básico" },
  { emoji: "👥", title: "Elenco Completo", desc: "Perfil de cada jogador com foto, posição e apelido. Ranking atualizado automaticamente.", plan: "Básico" },
  { emoji: "📊", title: "Resultados e Estatísticas", desc: "Registre placares e veja o histórico de vitórias, derrotas e empates por temporada.", plan: "Básico" },
  { emoji: "✅", title: "Confirmação de Presença", desc: "Gere um link único por jogo. Jogadores confirmam presença sem precisar de login.", plan: "Básico" },
  { emoji: "🌐", title: "Portal Exclusivo do Time", desc: "Site próprio com link compartilhável, escudo, cores e informações do time.", plan: "Básico" },
  { emoji: "💰", title: "Controle Financeiro", desc: "Registre mensalidades, despesas e receitas. Saldo sempre visível com transparência total.", plan: "Pro" },
  { emoji: "📢", title: "Avisos e Comunicados", desc: "Publique avisos importantes que ficam fixos no portal. Sem se perder em 200 mensagens.", plan: "Pro" },
  { emoji: "🤝", title: "Solicitações de Amistosos", desc: "Outros times pedem partidas diretamente pelo portal público do seu time.", plan: "Pro" },
  { emoji: "🏆", title: "Campeonatos e Ligas", desc: "Crie torneios com tabela de classificação automática, rodadas e resultados em tempo real.", plan: "Liga" },
  { emoji: "⭐", title: "Votação de Destaque", desc: "Após cada partida, jogadores votam no craque do jogo. MVP escolhido pelo time.", plan: "Liga" },
  { emoji: "🥇", title: "Ranking com Pódio", desc: "Artilharia, assistências, participações e destaques com visualização em pódio.", plan: "Liga" },
];

const planColors: Record<string, string> = {
  "Básico": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Pro": "bg-gold/20 text-gold border-gold/30",
  "Liga": "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

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
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-[#F0CC6B] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{f.emoji}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${planColors[f.plan]}`}>
                  {f.plan}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
