import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { ArrowLeft } from "lucide-react";

export default function Termos() {
  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-transparent py-4">
        <div className="container flex items-center gap-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <FutGestorLogo className="h-8 w-8" showText textClassName="text-base font-bold text-foreground" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl flex-1 px-4 py-12 bg-black/40 backdrop-blur-md border-x border-white/5 shadow-2xl">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="mb-2 text-sm text-muted-foreground">Última atualização: 7 de fevereiro de 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma FutGestor ("Serviço"), você concorda com estes Termos de Uso. Caso não concorde, não utilize o Serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>O FutGestor é uma plataforma SaaS (Software as a Service) destinada à gestão de times de futebol amador e society, oferecendo funcionalidades como agenda de jogos, escalação tática, controle financeiro, ranking de jogadores e área do atleta.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Cadastro e Conta</h2>
            <p>Para utilizar o Serviço, é necessário criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável pela segurança de sua conta, incluindo a senha de acesso. Notifique-nos imediatamente caso suspeite de uso não autorizado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Planos e Pagamento</h2>
            <p>O FutGestor oferece planos de assinatura mensal com diferentes níveis de funcionalidade. O pagamento é processado via meios de pagamento disponíveis na plataforma (Pix, cartão de crédito). Não há fidelidade — o cancelamento pode ser feito a qualquer momento, sem multa, com efeito ao final do período vigente.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Uso Aceitável</h2>
            <p>Você concorda em utilizar o Serviço apenas para fins lícitos e de acordo com estes Termos. É proibido: (a) violar leis aplicáveis; (b) transmitir conteúdo ofensivo, ilegal ou que viole direitos de terceiros; (c) tentar acessar áreas restritas do sistema sem autorização; (d) utilizar o Serviço para enviar spam ou mensagens não solicitadas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p>Todo o conteúdo do FutGestor, incluindo marca, logo, design, código-fonte e documentação, é de propriedade exclusiva do FutGestor e protegido por leis de propriedade intelectual. Os dados inseridos por você no sistema permanecem de sua propriedade.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Privacidade e Dados</h2>
            <p>Coletamos e tratamos dados pessoais conforme necessário para a prestação do Serviço, em conformidade com a Lei Geral de Proteção de Dados (LGPD). Seus dados não serão vendidos a terceiros. Para mais informações, consulte nossa Política de Privacidade.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>O FutGestor é fornecido "como está". Não garantimos disponibilidade ininterrupta ou ausência de erros. Em nenhuma hipótese seremos responsáveis por danos indiretos, incidentais ou consequenciais decorrentes do uso do Serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Alterações nos Termos</h2>
            <p>Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma. O uso continuado do Serviço após as alterações constitui aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Foro</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do FutGestor para dirimir quaisquer controvérsias.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2026 FutGestor. Todos os direitos reservados.
        </div>
      </footer>
      </div>
    </Layout>
  );
}
