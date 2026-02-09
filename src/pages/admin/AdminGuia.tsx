import { useRef } from "react";
import { FileDown, Globe, ShieldCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

/* ───────────── helpers ───────────── */

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex gap-3 items-start py-1">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
      {n}
    </span>
    <span className="text-sm leading-relaxed">{children}</span>
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
    💡 <strong>Dica:</strong> {children}
  </div>
);

/* ───────────── plan comparison data ───────────── */

const planFeatures = [
  { feature: "Dashboard com resumo do time", basico: true, pro: true, liga: true },
  { feature: "Gestão de Jogos (criar, editar, excluir)", basico: true, pro: true, liga: true },
  { feature: "Escalações táticas", basico: true, pro: true, liga: true },
  { feature: "Portal público do time", basico: true, pro: true, liga: true },
  { feature: "Cadastro de jogadores", basico: true, pro: true, liga: true },
  { feature: "Cadastro de times adversários", basico: true, pro: true, liga: true },
  { feature: "Configurações do time (escudo, banner)", basico: true, pro: true, liga: true },
  { feature: "Ranking de jogadores", basico: false, pro: true, liga: true },
  { feature: "Resultados e estatísticas individuais", basico: false, pro: true, liga: true },
  { feature: "Confirmação de presença com link público", basico: false, pro: true, liga: true },
  { feature: "Controle financeiro (caixinha)", basico: false, pro: true, liga: true },
  { feature: "Avisos e comunicados", basico: false, pro: true, liga: true },
  { feature: "Solicitações de amistosos", basico: false, pro: true, liga: true },
  { feature: "Estatísticas avançadas (cartões, assistências)", basico: false, pro: true, liga: true },
  { feature: "Gestor de Campeonatos (ligas)", basico: false, pro: false, liga: true },
  { feature: "Login individual para jogadores", basico: false, pro: false, liga: true },
];

/* ───────────── component ───────────── */

export default function AdminGuia() {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    // Expand all accordions before printing
    const triggers = document.querySelectorAll<HTMLButtonElement>(
      "[data-guia-accordion] [data-state='closed']"
    );
    triggers.forEach((t) => t.click());

    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <>
      {/* Print‑only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #guia-print-area, #guia-print-area * { visibility: visible; }
          #guia-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          [data-guia-accordion] [data-state="closed"] > div { display: block !important; max-height: none !important; }
          button, a[role="button"], .no-print { display: none !important; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Guia Completo do FutGestor
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manual detalhado de todas as funcionalidades do sistema
            </p>
          </div>
          <Button onClick={handleDownloadPDF} className="no-print gap-2">
            <FileDown className="h-4 w-4" />
            Baixar em PDF
          </Button>
        </div>

        <div id="guia-print-area" ref={printRef} className="space-y-8">
          {/* ═══════════ ÁREA PÚBLICA ═══════════ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Área Pública do Time (Portal do Jogador)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tudo que os jogadores e visitantes veem ao acessar a página do time.
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" data-guia-accordion className="w-full">
                {/* Página Inicial */}
                <AccordionItem value="pub-home">
                  <AccordionTrigger>Página Inicial</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      A página inicial é o cartão de visitas do seu time. Ela reúne as informações mais
                      importantes em um só lugar para que jogadores e visitantes tenham uma visão geral rápida.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">O que aparece na página inicial:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Hero do time:</strong> Banner e escudo do time com o nome em destaque.</li>
                      <li><strong>Agenda com calendário:</strong> Visualização mensal dos jogos agendados. Dias com jogos ficam destacados.</li>
                      <li><strong>Jogos da semana:</strong> Cards com os próximos jogos mostrando adversário, data, hora e local.</li>
                      <li><strong>Último resultado:</strong> Placar da partida mais recente com indicação de vitória, empate ou derrota.</li>
                      <li><strong>Saldo da caixinha:</strong> Valor atual do caixa do time (visível apenas para plano Pro ou superior).</li>
                      <li><strong>Avisos recentes:</strong> Últimos comunicados publicados pelo administrador.</li>
                    </ul>
                    <Tip>
                      Personalize o banner e o escudo nas Configurações do Admin para deixar a página inicial com a cara do seu time.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Agenda */}
                <AccordionItem value="pub-agenda">
                  <AccordionTrigger>Agenda</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      A Agenda mostra todos os jogos do time em formato de calendário e lista.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Como usar:</h4>
                    <Step n={1}>Acesse a aba "Agenda" no menu do site do time.</Step>
                    <Step n={2}>Use o calendário para navegar entre os meses. Dias com jogos aparecem com um indicador.</Step>
                    <Step n={3}>Clique em um dia para ver os detalhes do jogo: adversário, horário, local e observações.</Step>
                    <Step n={4}>Se o link de presença estiver disponível, clique em "Confirmar Presença" para informar se você vai ao jogo.</Step>
                    <Tip>
                      O administrador pode compartilhar um link de presença pública para que qualquer jogador confirme sem precisar de login.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Jogadores */}
                <AccordionItem value="pub-jogadores">
                  <AccordionTrigger>Jogadores</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Lista completa do elenco do time com informações de cada jogador.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Informações exibidas:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Foto:</strong> Foto do jogador (ou avatar padrão).</li>
                      <li><strong>Nome e apelido:</strong> Nome completo e apelido usado no time.</li>
                      <li><strong>Posição:</strong> Goleiro, Zagueiro, Lateral, Volante, Meia ou Atacante.</li>
                      <li><strong>Número:</strong> Número da camisa do jogador.</li>
                    </ul>
                    <Tip>
                      Apenas jogadores marcados como "ativo" pelo admin aparecem nesta lista.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Ranking */}
                <AccordionItem value="pub-ranking">
                  <AccordionTrigger>Ranking <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Classificação dos jogadores por desempenho ao longo da temporada.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Critérios do ranking:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Gols:</strong> Total de gols marcados.</li>
                      <li><strong>Assistências:</strong> Total de assistências realizadas.</li>
                      <li><strong>Presença:</strong> Percentual de jogos em que o jogador participou.</li>
                      <li><strong>Cartões:</strong> Amarelos e vermelhos recebidos.</li>
                      <li><strong>MVP:</strong> Quantidade de vezes eleito destaque da partida.</li>
                    </ul>
                    <Tip>
                      O ranking é atualizado automaticamente quando o admin registra os resultados e estatísticas de cada partida.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Resultados */}
                <AccordionItem value="pub-resultados">
                  <AccordionTrigger>Resultados <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Histórico completo de todas as partidas finalizadas com placar e detalhes.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">O que você encontra:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Placar final de cada partida (gols a favor × gols contra).</li>
                      <li>Indicação visual de vitória (verde), empate (amarelo) ou derrota (vermelho).</li>
                      <li>Data, local e adversário.</li>
                      <li>Estatísticas individuais: quem fez gol, quem deu assistência, cartões.</li>
                      <li>Jogador destaque (MVP) da partida.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Escalação */}
                <AccordionItem value="pub-escalacao">
                  <AccordionTrigger>Escalação</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Visualização tática da formação do time para cada jogo.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Como funciona:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>O campo de futebol é exibido com os jogadores posicionados de acordo com a formação definida pelo admin.</li>
                      <li>Cada jogador aparece com foto, nome e número.</li>
                      <li>A formação (ex: 4-3-3, 4-4-2) é exibida no topo.</li>
                      <li>Apenas escalações publicadas pelo admin ficam visíveis.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Financeiro */}
                <AccordionItem value="pub-financeiro">
                  <AccordionTrigger>Financeiro <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Extrato da caixinha do time, mostrando todas as movimentações financeiras.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">O que é exibido:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Saldo atual:</strong> Valor total disponível na caixinha.</li>
                      <li><strong>Entradas:</strong> Recebimentos como mensalidades, rifas, patrocínios.</li>
                      <li><strong>Saídas:</strong> Gastos como aluguel de campo, uniformes, bola.</li>
                      <li><strong>Histórico:</strong> Lista de todas as transações com data, descrição e valor.</li>
                    </ul>
                    <Tip>
                      Toda transparência: qualquer jogador pode acompanhar para onde está indo o dinheiro do time.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Avisos */}
                <AccordionItem value="pub-avisos">
                  <AccordionTrigger>Avisos <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Comunicados oficiais publicados pelo administrador do time.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Categorias disponíveis:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Geral:</strong> Informações diversas sobre o time.</li>
                      <li><strong>Urgente:</strong> Avisos importantes que precisam de atenção imediata.</li>
                      <li><strong>Financeiro:</strong> Comunicados sobre cobranças, pagamentos, etc.</li>
                      <li><strong>Jogo:</strong> Avisos relacionados a partidas (mudança de horário, local, etc).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Ligas */}
                <AccordionItem value="pub-ligas">
                  <AccordionTrigger>Ligas / Campeonatos <Badge variant="secondary" className="ml-2 text-xs">Liga</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Acompanhamento de campeonatos criados pelo admin com tabela de classificação e resultados por rodada.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">O que é exibido:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Tabela de classificação:</strong> Posição, pontos, jogos, vitórias, empates, derrotas, gols pró, gols contra e saldo.</li>
                      <li><strong>Rodadas:</strong> Confrontos de cada rodada com placar (quando disponível).</li>
                      <li><strong>Escudos:</strong> Logo de cada equipe participante.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Meu Perfil */}
                <AccordionItem value="pub-perfil">
                  <AccordionTrigger>Meu Perfil <Badge variant="secondary" className="ml-2 text-xs">Liga</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Área pessoal do jogador logado, disponível apenas no plano Liga (que permite login individual).
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Informações disponíveis:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Dados pessoais: nome, apelido, posição, número.</li>
                      <li>Estatísticas individuais acumuladas.</li>
                      <li>Histórico de presenças.</li>
                      <li>Extrato financeiro pessoal (valores a pagar/receber).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* ═══════════ ÁREA ADMINISTRATIVA ═══════════ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Área Administrativa (Painel Admin)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Todas as ferramentas de gestão disponíveis para o administrador do time.
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" data-guia-accordion className="w-full">
                {/* Dashboard */}
                <AccordionItem value="adm-dashboard">
                  <AccordionTrigger>Dashboard</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Visão geral do time em cards de resumo rápido.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Cards exibidos:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Saldo da caixinha:</strong> Valor atual do caixa do time.</li>
                      <li><strong>Total de jogadores:</strong> Quantidade de jogadores ativos no elenco.</li>
                      <li><strong>Jogos agendados:</strong> Quantidade de partidas futuras.</li>
                      <li><strong>Resultados finalizados:</strong> Total de partidas com placar registrado.</li>
                    </ul>
                    <Tip>
                      O Dashboard é o ponto de partida ideal para ter uma visão rápida da situação do time.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Planos */}
                <AccordionItem value="adm-planos">
                  <AccordionTrigger>Planos</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Aqui você escolhe e gerencia o plano de assinatura do seu time.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Planos disponíveis:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Básico (Grátis):</strong> Funcionalidades essenciais para começar a organizar seu time.</li>
                      <li><strong>Pro:</strong> Ferramentas avançadas como ranking, financeiro, avisos e estatísticas.</li>
                      <li><strong>Liga:</strong> Tudo do Pro + gestor de campeonatos e login individual para jogadores.</li>
                    </ul>
                    <Step n={1}>Acesse "Planos" no menu lateral.</Step>
                    <Step n={2}>Compare as funcionalidades de cada plano.</Step>
                    <Step n={3}>Clique em "Assinar" no plano desejado.</Step>
                    <Step n={4}>Realize o pagamento via Mercado Pago.</Step>
                    <Tip>
                      Você pode fazer upgrade a qualquer momento. O plano é ativado imediatamente após a confirmação do pagamento.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Jogos */}
                <AccordionItem value="adm-jogos">
                  <AccordionTrigger>Jogos</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Central de gerenciamento de partidas do time. Aqui você cria, edita e controla todos os jogos.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Criar um novo jogo:</h4>
                    <Step n={1}>Clique no botão "Novo Jogo".</Step>
                    <Step n={2}>Preencha: adversário, data/hora, local e observações.</Step>
                    <Step n={3}>Opcionalmente selecione um time cadastrado como adversário (para exibir o escudo).</Step>
                    <Step n={4}>Clique em "Salvar".</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Gerenciar presença:</h4>
                    <Step n={1}>Na lista de jogos, clique no ícone de presença do jogo desejado.</Step>
                    <Step n={2}>Marque manualmente quem confirmou, quem está indisponível e quem está pendente.</Step>
                    <Step n={3}>Ou clique em "Gerar Link de Presença" para criar um link público que os jogadores podem usar para confirmar sozinhos.</Step>
                    <Tip>
                      O link de presença pode ser compartilhado no WhatsApp do grupo. Qualquer jogador do elenco poderá confirmar sem precisar de login.
                    </Tip>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Status do jogo:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Agendado:</strong> Jogo criado, aguardando confirmação.</li>
                      <li><strong>Confirmado:</strong> Jogo confirmado, tudo certo.</li>
                      <li><strong>Em andamento:</strong> A partida está acontecendo.</li>
                      <li><strong>Finalizado:</strong> Partida encerrada (pode registrar resultado).</li>
                      <li><strong>Cancelado:</strong> Jogo foi cancelado.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Solicitações */}
                <AccordionItem value="adm-solicitacoes">
                  <AccordionTrigger>Solicitações de Amistosos <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Receba pedidos de amistosos de outros times diretamente pelo site.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Como funciona:</h4>
                    <Step n={1}>Outros times acessam a página pública do seu time e preenchem o formulário de solicitação.</Step>
                    <Step n={2}>Você recebe a solicitação aqui com: nome do time, data preferida, horário, local sugerido e contato.</Step>
                    <Step n={3}>Analise a solicitação e clique em "Aceitar" ou "Recusar".</Step>
                    <Step n={4}>Se aceitar, crie o jogo manualmente na aba Jogos com os dados combinados.</Step>
                    <Tip>
                      Um badge vermelho aparece no menu quando há solicitações pendentes. Não deixe o adversário esperando!
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Times */}
                <AccordionItem value="adm-times">
                  <AccordionTrigger>Times Adversários</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Cadastre os times que vocês enfrentam regularmente para facilitar a criação de jogos.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Cadastrar um time:</h4>
                    <Step n={1}>Clique em "Novo Time".</Step>
                    <Step n={2}>Preencha: nome, apelido, cidade e cores principais.</Step>
                    <Step n={3}>Faça upload do escudo do time adversário.</Step>
                    <Step n={4}>Salve. O time ficará disponível para seleção ao criar jogos.</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Benefícios:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>O escudo do adversário aparece nos cards de jogos e resultados.</li>
                      <li>Facilita preencher jogos recorrentes contra o mesmo time.</li>
                      <li>Você pode marcar um time como "time da casa" (o seu próprio time).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Jogadores */}
                <AccordionItem value="adm-jogadores">
                  <AccordionTrigger>Jogadores</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Cadastro completo do elenco do time com todas as informações de cada jogador.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Cadastrar um jogador:</h4>
                    <Step n={1}>Clique em "Novo Jogador".</Step>
                    <Step n={2}>Preencha: nome completo, apelido, posição (goleiro, zagueiro, lateral, volante, meia ou atacante), número da camisa.</Step>
                    <Step n={3}>Adicione e-mail e telefone para contato (opcional).</Step>
                    <Step n={4}>Faça upload da foto do jogador.</Step>
                    <Step n={5}>Salve o cadastro.</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Ações disponíveis:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Ativar/Desativar:</strong> Jogadores inativos não aparecem no site público nem nas listas de seleção.</li>
                      <li><strong>Criar acesso de login:</strong> (Plano Liga) Gera um login para o jogador acessar o portal com dados pessoais.</li>
                      <li><strong>Editar:</strong> Altere qualquer informação a qualquer momento.</li>
                      <li><strong>Excluir:</strong> Remove o jogador permanentemente do sistema.</li>
                    </ul>
                    <Tip>
                      Mantenha o elenco atualizado! Jogadores inativos não aparecem na confirmação de presença nem na escalação.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Usuários */}
                <AccordionItem value="adm-usuarios">
                  <AccordionTrigger>Usuários</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Gerencie os usuários vinculados ao time que possuem login no sistema.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">O que você pode fazer:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Ver todos os usuários cadastrados com e-mail e status de aprovação.</li>
                      <li>Aprovar ou reprovar novos usuários que se registram.</li>
                      <li>Vincular um usuário a um jogador do elenco.</li>
                      <li>Remover acesso de um usuário.</li>
                    </ul>
                    <Tip>
                      Quando um jogador recebe um login (via Jogadores → Criar Acesso), ele aparece automaticamente aqui como usuário vinculado.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Transações */}
                <AccordionItem value="adm-transacoes">
                  <AccordionTrigger>Transações Financeiras <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Controle completo da caixinha do time: registre entradas e saídas para manter tudo transparente.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Registrar uma transação:</h4>
                    <Step n={1}>Clique em "Nova Transação".</Step>
                    <Step n={2}>Selecione o tipo: Entrada (dinheiro que entra) ou Saída (dinheiro que sai).</Step>
                    <Step n={3}>Preencha: descrição, valor, data e categoria.</Step>
                    <Step n={4}>Salve. O saldo será atualizado automaticamente.</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Categorias sugeridas:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Entradas:</strong> Mensalidade, rifa, patrocínio, doação, outros.</li>
                      <li><strong>Saídas:</strong> Aluguel de campo, uniforme, bola, premiação, transporte, outros.</li>
                    </ul>
                    <Tip>
                      Todas as transações ficam visíveis no portal público (aba Financeiro), garantindo transparência total com o elenco.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Resultados */}
                <AccordionItem value="adm-resultados">
                  <AccordionTrigger>Resultados e Estatísticas <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Registre o placar de cada partida e as estatísticas individuais dos jogadores.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Registrar um resultado:</h4>
                    <Step n={1}>Na lista de jogos finalizados, clique em "Registrar Resultado".</Step>
                    <Step n={2}>Informe o placar: gols a favor e gols contra.</Step>
                    <Step n={3}>Adicione observações sobre a partida (opcional).</Step>
                    <Step n={4}>Salve o resultado.</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Estatísticas individuais:</h4>
                    <Step n={1}>Após registrar o placar, clique em "Estatísticas" no resultado.</Step>
                    <Step n={2}>Marque quais jogadores participaram da partida.</Step>
                    <Step n={3}>Para cada jogador, registre: gols, assistências, cartão amarelo, cartão vermelho.</Step>
                    <Step n={4}>Selecione o MVP (jogador destaque) da partida.</Step>
                    <Step n={5}>Salve. As estatísticas alimentam automaticamente o Ranking.</Step>
                    <Tip>
                      Quanto mais detalhado o registro, mais rico fica o ranking e as estatísticas dos jogadores ao longo da temporada.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Campeonatos */}
                <AccordionItem value="adm-campeonatos">
                  <AccordionTrigger>Campeonatos <Badge variant="secondary" className="ml-2 text-xs">Liga</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Crie e gerencie campeonatos completos com tabela de classificação automática.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Criar um campeonato:</h4>
                    <Step n={1}>Clique em "Novo Campeonato".</Step>
                    <Step n={2}>Defina o nome do campeonato (ex: "Copa Amigos 2025").</Step>
                    <Step n={3}>Salve e acesse os detalhes do campeonato.</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Adicionar equipes:</h4>
                    <Step n={1}>Dentro do campeonato, clique em "Adicionar Equipe".</Step>
                    <Step n={2}>Informe o nome e faça upload do escudo da equipe.</Step>
                    <Step n={3}>Repita para todas as equipes participantes.</Step>
                    <h4 className="font-semibold text-sm mb-2 mt-4">Gerenciar rodadas:</h4>
                    <Step n={1}>Crie confrontos definindo time da casa e time visitante.</Step>
                    <Step n={2}>Após a partida, registre o placar de cada confronto.</Step>
                    <Step n={3}>A tabela de classificação é atualizada automaticamente (pontos, vitórias, empates, derrotas, gols).</Step>
                    <Tip>
                      Você pode editar o nome e o escudo de qualquer equipe a qualquer momento clicando no ícone de edição.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Escalações */}
                <AccordionItem value="adm-escalacoes">
                  <AccordionTrigger>Escalações</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Monte a formação tática do time para cada jogo usando um campo visual interativo.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Montar uma escalação:</h4>
                    <Step n={1}>Selecione o jogo para o qual deseja montar a escalação.</Step>
                    <Step n={2}>Escolha a formação tática (ex: 4-3-3, 4-4-2, 3-5-2).</Step>
                    <Step n={3}>Arraste os jogadores do elenco para as posições no campo.</Step>
                    <Step n={4}>Ajuste as posições conforme necessário.</Step>
                    <Step n={5}>Marque como "publicada" para que fique visível no portal público.</Step>
                    <Tip>
                      Você pode criar escalações para jogos futuros e publicá-las apenas na hora certa. Enquanto não publicar, só o admin vê.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Avisos */}
                <AccordionItem value="adm-avisos">
                  <AccordionTrigger>Avisos <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge></AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Crie comunicados para o elenco que ficam visíveis no portal público.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">Criar um aviso:</h4>
                    <Step n={1}>Clique em "Novo Aviso".</Step>
                    <Step n={2}>Escreva o título e o conteúdo do comunicado.</Step>
                    <Step n={3}>Selecione a categoria: Geral, Urgente, Financeiro ou Jogo.</Step>
                    <Step n={4}>Marque como "Publicado" para tornar visível no portal.</Step>
                    <Step n={5}>Salve.</Step>
                    <Tip>
                      Avisos marcados como "Urgente" ganham destaque visual no portal público para chamar mais atenção.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>

                {/* Configurações */}
                <AccordionItem value="adm-configuracoes">
                  <AccordionTrigger>Configurações</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm mb-3">
                      Personalize a identidade visual e os dados do seu time.
                    </p>
                    <h4 className="font-semibold text-sm mb-2">O que você pode configurar:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li><strong>Escudo:</strong> Faça upload do escudo do time. Aparece em todo o site.</li>
                      <li><strong>Banner:</strong> Imagem de capa exibida na página inicial do portal público.</li>
                      <li><strong>Nome do time:</strong> Nome oficial exibido em todo o sistema.</li>
                      <li><strong>Redes sociais:</strong> Links para Instagram, Facebook, etc. que aparecem no portal público.</li>
                      <li><strong>Slug do time:</strong> O endereço personalizado do seu time (ex: futgestor.app/meu-time).</li>
                    </ul>
                    <Tip>
                      Capriche no escudo e no banner! São os primeiros elementos que visitantes veem ao acessar a página do time.
                    </Tip>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* ═══════════ COMPARATIVO DE PLANOS ═══════════ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Comparativo de Planos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Veja o que cada plano desbloqueia para o seu time.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Funcionalidade</TableHead>
                    <TableHead className="text-center">Básico</TableHead>
                    <TableHead className="text-center">Pro</TableHead>
                    <TableHead className="text-center">Liga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planFeatures.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className="text-sm">{row.feature}</TableCell>
                      <TableCell className="text-center">
                        {row.basico ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.pro ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.liga ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Bottom PDF button */}
        <div className="flex justify-center no-print">
          <Button onClick={handleDownloadPDF} size="lg" className="gap-2">
            <FileDown className="h-4 w-4" />
            Baixar Guia em PDF
          </Button>
        </div>
      </div>
    </>
  );
}
