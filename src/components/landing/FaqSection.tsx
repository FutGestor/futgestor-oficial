import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useInView } from "@/hooks/useInView";

const faqs = [
  {
    q: "Como funciona o pagamento?",
    a: "O pagamento é feito via Pix ou Cartão de Crédito pelo Mercado Pago, com renovação mensal automática. Não há fidelidade — cancele quando quiser, sem multas.",
  },
  {
    q: "O que é o Login de Jogadores do Plano Liga?",
    a: "No Plano Liga, cada atleta recebe um acesso exclusivo ao sistema. Ele pode ver quanto deve de mensalidade, confirmar presença nos jogos e acompanhar suas estatísticas — tirando todo esse trabalho do administrador.",
  },
  {
    q: "Serve para Society e Campo?",
    a: "Sim! O FutGestor suporta formações de 5x5 (Society), 7x7 e 11x11 (Campo). O campo tático se adapta automaticamente à modalidade escolhida.",
  },
  {
    q: "Posso testar antes de assinar?",
    a: "Ao criar sua conta, você pode explorar a interface e configurar seu time. A assinatura é necessária apenas para acessar o painel completo de gestão.",
  },
  {
    q: "Como funciona a Página Pública do Time?",
    a: "Seu time ganha uma URL exclusiva (futgestor.app/time/seu-time) com escudo, resultados recentes e informações públicas. Perfeito para divulgar o time e receber solicitações de jogos de adversários.",
  },
];

export function FaqSection() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-3xl px-4">
        <div ref={ref} className={inView ? "animate-fade-in" : "opacity-0"}>
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
            Perguntas Frequentes
          </h2>
        </div>
        <Card className="rounded-xl shadow-lg border p-2 md:p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold px-2">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground px-2">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </section>
  );
}
