# Resumo das Políticas RLS - FutGestorPro

## Estado Atual (21/02/2025)

### Tabelas com Acesso Público (SELECT = true)
- `achievements` - Conquistas globais
- `confirmacoes_presenca` - Confirmações de presença
- `escalacoes` (apenas publicadas) - Escalações publicadas
- `escalacao_jogadores` (apenas de escalações publicadas)
- `estatisticas_partida` - Estatísticas de partidas
- `jogadores` - Lista de jogadores
- `jogos` - Jogos/Partidas
- `leagues` - Ligas/Campeonatos
- `league_teams` - Times em ligas
- `league_matches` - Partidas de ligas
- `ml_escalacao_padroes` - Padrões de escalação ML
- `player_achievements` - Conquistas dos jogadores
- `player_financeiro` (próprio apenas) - Financeiro individual
- `presenca_links` - Links de presença
- `profiles` - Perfis de usuários
- `resultados` - Resultados de jogos
- `subscriptions` - Assinaturas
- `teams` - Times
- `times` - Times (alternativo)
- `transacoes` - Transações financeiras do clube
- `user_roles` (próprio apenas) - Papéis do usuário
- `votacao_craque` - Votação de craque
- `votos_destaque` - Votos de destaque

### Tabelas Restritas (Apenas Admin)
- `avisos` - Avisos/notícias
- `chamados` (próprio + admin) - Suporte/Chamados
- `chamado_mensagens` - Mensagens de chamados
- `chamado_anexos` - Anexos de chamados
- `notificacoes` (próprias + admin) - Notificações
- `notificacoes_push` (próprias) - Notificações push
- `saas_payments` - Pagamentos SaaS
- `solicitacoes_jogo` - Solicitações de jogo
- `solicitacoes_ingresso` - Solicitações de ingresso
- `team_sensitive_data` - Dados sensíveis do time
- `presencas` - Presenças (via link)
- `conquistas` - Conquistas (com lógica de desbloqueio)
- `gols` - Gols (com verificação de perfil)
- `ml_jogador_posicoes` - Posições de jogadores ML

### Funcionalidades por Tipo de Usuário

#### Jogador Comum Pode:
1. ✅ Ver dashboard com jogos e resultados
2. ✅ Confirmar/não confirmar presença
3. ✅ Ver escalações publicadas
4. ✅ Ver finanças do clube (somente leitura)
5. ✅ Ver estatísticas de partidas
6. ✅ Votar em craque do jogo
7. ✅ Ver conquistas
8. ✅ Editar próprio perfil
9. ✅ Ver próprias notificações
10. ✅ Criar chamados de suporte
11. ✅ Ver próprio financeiro individual

#### Admin Pode:
1. ✅ Tudo que o jogador pode
2. ✅ Gerenciar jogadores (CRUD)
3. ✅ Gerenciar jogos (CRUD)
4. ✅ Gerenciar escalações (CRUD)
5. ✅ Gerenciar finanças (CRUD)
6. ✅ Gerenciar avisos
7. ✅ Gerenciar chamados de todos
8. ✅ Gerenciar notificações
9. ✅ Gerenciar configurações do time
10. ✅ Gerenciar assinaturas

### Políticas Principais Corrigidas
1. ✅ `confirmacoes_presenca` - Jogadores podem confirmar própria presença
2. ✅ `transacoes` - Todos podem ver, apenas admins modificam
3. ✅ `profiles` - Acesso público para leitura, próprio para edição
4. ✅ `jogadores` - Acesso público para leitura
5. ✅ `chamados` - Próprio + admin
6. ✅ `notificacoes` - Próprio + admin

### Notas
- RLS está ativo em todas as tabelas
- Permissões GRANT aplicadas para anon e authenticated
- Políticas duplicadas removidas
