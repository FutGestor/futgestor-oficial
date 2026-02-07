import { useInView } from "@/hooks/useInView";

const pains = [
  { emoji: "😤", text: "Grupo do WhatsApp com 50 mensagens por hora e **ninguém confirma presença**" },
  { emoji: "📋", text: "Planilha do Excel que **só você entende** e que ninguém atualiza" },
  { emoji: "💸", text: "Caixinha do time **sem controle** — ninguém sabe quanto tem, quem pagou, quem deve" },
  { emoji: "🤷", text: "Escalação **na hora do jogo** porque ninguém avisou se ia ou não" },
];

export function PainSection() {
  const { ref, inView } = useInView();

  const scrollToPrecos = () => {
    document.getElementById("precos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A1628] to-[#0F2440]">
      <div className="container px-4" ref={ref}>
        <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${inView ? "animate-fade-in" : "opacity-0"}`}>
          {/* Pain list */}
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-[3px] mb-3">O problema</p>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-8 tracking-wide leading-tight">
              TODO GESTOR DE TIME<br />JÁ PASSOU POR ISSO
            </h2>
            <div className="flex flex-col gap-4">
              {pains.map((p, i) => (
                <div key={i} className="flex gap-4 items-start p-4 bg-red-500/[0.06] border-l-[3px] border-red-500 rounded-r-lg">
                  <span className="text-xl flex-shrink-0 mt-0.5">{p.emoji}</span>
                  <p className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div className="bg-gradient-to-br from-gold/[0.08] to-gold/[0.02] border border-gold/15 rounded-2xl p-8 md:p-10 text-center">
            <h3 className="font-display text-2xl md:text-3xl text-gold mb-4 tracking-wide">
              E SE TUDO ISSO TIVESSE<br />EM UM SÓ LUGAR?
            </h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              O FutGestor substitui o grupo bagunçado, a planilha esquecida e o caderninho perdido. Seu time com cara de profissional — sem precisar ser um.
            </p>
            <button
              onClick={scrollToPrecos}
              className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-gold to-[#F0CC6B] text-[#0A1628] shadow-[0_4px_20px_rgba(212,168,75,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,168,75,0.4)] transition-all"
            >
              Quero organizar meu time
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
