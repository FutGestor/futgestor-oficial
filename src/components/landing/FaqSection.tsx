import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInView } from "@/hooks/useInView";

const faqs = [
  {
    q: "Preciso instalar algum app?",
    a: "Não! O FutGestor funciona direto no navegador do celular ou computador. É só acessar o link do seu time. Sem download, sem ocupar espaço no celular.",
  },
  {
    q: "Funciona pra pelada, society e campo?",
    a: "Sim! O FutGestor funciona pra qualquer modalidade: society 5x5, 6x6, 7x7, campo 11x11, futsal, pelada. Você configura a modalidade e formação do seu time.",
  },
  {
    q: "Meus jogadores precisam criar conta?",
    a: "Para ver agenda, escalação e resultados, não precisa. Qualquer pessoa com o link do time acessa essas informações. Para ver finanças e avisos, aí sim precisam criar conta e ser aprovados pelo admin.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "O pagamento é feito via Pix ou Cartão de Crédito pelo Mercado Pago, com renovação mensal automática. Não há fidelidade — cancele quando quiser, sem multas.",
  },
  {
    q: "O que é o Login de Jogadores do Plano Liga?",
    a: "No Plano Liga, o administrador pode gerar um login individual para cada atleta. Com esse login, o jogador acessa sua área pessoal, onde pode acompanhar as finanças do time, ver avisos e confirmar presença nos jogos. Ele não tem acesso à área administrativa — apenas o dono/admin gerencia tudo.",
  },
  {
    q: "Posso testar antes de assinar?",
    a: "Ao criar sua conta, você pode explorar a interface e configurar seu time. A assinatura é necessária apenas para acessar o painel completo de gestão.",
  },
  {
    q: "Como funciona a Página Pública do Time?",
    a: "Seu time ganha uma URL exclusiva (futgestor.app/time/seu-time) com escudo, resultados recentes e informações públicas. Perfeito para divulgar o time e receber solicitações de jogos de adversários.",
  },
  {
    q: "E se eu quiser cancelar?",
    a: "Sem multa, sem burocracia. Você cancela direto no painel a qualquer momento. Seus dados ficam salvos por 30 dias caso queira voltar.",
  },
];

export function FaqSection() {
  const { ref, inView } = useInView();

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#0F2440]">
      <div className="container max-w-3xl px-4" ref={ref}>
        <div className={`text-center mb-12 ${inView ? "animate-fade-in" : "opacity-0"}`}>
          <p className="text-xs font-semibold text-gold uppercase tracking-[3px] mb-3">Dúvidas frequentes</p>
          <h2 className="font-display text-3xl md:text-4xl text-white tracking-wide">PERGUNTAS E RESPOSTAS</h2>
        </div>

        <div className={inView ? "animate-fade-in" : "opacity-0"}>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-white/[0.06] rounded-xl bg-[rgba(15,36,64,0.4)] px-1 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-sm font-semibold text-white hover:text-gold px-4 py-4 [&[data-state=open]>svg]:text-gold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 text-sm leading-relaxed px-4 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
