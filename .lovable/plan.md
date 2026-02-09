
# Guia Completo do FutGestor - Pagina de Documentacao no Admin

## Objetivo
Criar uma nova pagina "Guia" dentro do painel administrativo que funciona como um manual completo e explicativo de todas as funcionalidades do FutGestor, tanto da area publica do time quanto da area administrativa. No final, uma tabela comparativa dos planos e um botao para baixar o guia em PDF.

---

## O que sera criado

### 1. Nova pagina `src/pages/admin/AdminGuia.tsx`
Uma pagina longa e organizada com secoes colapsaveis (accordion) cobrindo:

**Area Publica do Time (Portal do Jogador)**
- Pagina Inicial: hero do time, agenda com calendario, jogos da semana, ultimo resultado, saldo, avisos
- Agenda: como visualizar jogos futuros, calendario mensal, confirmar presenca
- Jogadores: lista do elenco com foto, posicao e numero
- Ranking: classificacao por desempenho (gols, assistencias, presenca)
- Resultados: historico de partidas e placares
- Escalacao: formacao tatica visual do time
- Financeiro: extrato da caixinha do time
- Avisos: comunicados publicados pelo admin
- Ligas: campeonatos e tabela de classificacao
- Meu Perfil: dados pessoais do jogador logado

**Area Administrativa (Painel Admin)**
- Dashboard: visao geral com cards de resumo (saldo, jogadores, jogos, resultados finalizados)
- Planos: escolha e assinatura de planos (Basico, Pro, Liga)
- Jogos: criar, editar, excluir partidas; gerenciar presenca; link de confirmacao publica
- Solicitacoes: receber e responder pedidos de amistosos
- Times: cadastrar e gerenciar times adversarios com escudo
- Jogadores: cadastrar elenco, foto, posicao, numero, ativar/desativar, criar acesso de login
- Usuarios: gerenciar usuarios vinculados ao time
- Transacoes: registrar receitas e despesas da caixinha
- Resultados: registrar placares e estatisticas individuais (gols, assistencias, cartoes)
- Campeonatos: criar ligas, adicionar equipes, gerenciar rodadas e resultados
- Escalacoes: montar formacao tatica arrastando jogadores no campo
- Avisos: criar e publicar comunicados com categorias (info, urgente, etc)
- Configuracoes: escudo, banner, redes sociais, dados do time

**Secao Final: Comparativo de Planos**
- Tabela mostrando o que cada plano (Basico, Pro, Liga) desbloqueia

**Botao Baixar PDF**
- Usa a API nativa `window.print()` com CSS de impressao para gerar PDF limpo

### 2. Registro da rota e sidebar
- Adicionar item "Guia" na sidebar do Admin (`src/pages/Admin.tsx`) com icone `BookOpen`
- Adicionar rota `/guia` nas Routes do Admin

---

## Detalhes Tecnicos

### Estrutura do componente `AdminGuia.tsx`
- Utiliza `Accordion` do shadcn/ui para organizar cada secao
- Cada item do accordion contem descricao detalhada, passo-a-passo e dicas
- Secao de planos usa cards com listas de features
- Botao "Baixar em PDF" no topo e no final da pagina

### Funcao de download PDF
```text
Usa window.print() com media query @media print para:
- Expandir todos os accordions antes de imprimir
- Esconder sidebar, header e botoes de acao
- Formatar para papel A4 com margens adequadas
```

### Alteracoes em `Admin.tsx`
- Import de `BookOpen` do lucide-react
- Novo item na array `sidebarItems` (sem trava de plano - disponivel para todos)
- Nova `<Route path="/guia">` apontando para `AdminGuia`

### Arquivos modificados
| Arquivo | Alteracao |
|---|---|
| `src/pages/admin/AdminGuia.tsx` | Novo arquivo - pagina completa do guia |
| `src/pages/Admin.tsx` | Adicionar rota + item no sidebar |

### Nenhuma dependencia nova necessaria
- Accordion ja existe em `@radix-ui/react-accordion`
- Todos os componentes UI ja estao disponiveis (Card, Badge, Button, Table)
- PDF via `window.print()` nao requer biblioteca externa
