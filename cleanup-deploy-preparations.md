# Missão: Faxina Noturna & Preparação para Deploy

Este plano detalha a limpeza de código, auditoria de tema e preparação final para o deploy do FutGestorPro.

## User Review Required

> [!IMPORTANT]
> A detecção de arquivos órfãos será baseada em importações estáticas. Para rotas carregadas dinamicamente ou referências via string, listarei os arquivos para sua confirmação antes de qualquer ação.

## Proposed Changes

### 1. Limpeza de Código
Remoção sistemática de:
- [ ] `console.log`, `console.warn`, `console.error` (fora de catches).
- [ ] Imports não utilizados.
- [ ] Blocos de código comentados.
- [ ] `style={{ backgroundColor: 'transparent' }}` desnecessários.
- **Arquivos Protegidos**: `DynamicBackground.tsx`, `Layout.tsx`, `index.css`.

### 2. Auditoria de Tema Dark
- [ ] Substituir `bg-white`, `bg-gray-*`, `text-black` por variáveis do design system (`bg-card`, `bg-muted`, `text-foreground`).
- [ ] Padronizar Cards para `bg-black/40 backdrop-blur-xl border-white/10`.

### 3. Arquivos Órfãos
- [ ] Mapear arquivos em `src/pages` e `src/components` sem referências externas.

### 4. Verificação Final
- [ ] Executar `npm run build` e garantir sucesso.

## Task Breakdown

### Phase 1: Limpeza & Higiene
- **Task ID**: `cleanup-logs`
- **Agent**: `orchestrator`
- **Action**: Remover logs e debuggers em todo o diretório `src/`.

### Phase 2: Auditoria de Tema
- **Task ID**: `dark-theme-audit`
- **Agent**: `frontend-specialist`
- **Action**: Atualizar classes de cores claros para o sistema de tokens.

### Phase 3: Build & Deploy Readiness
- **Task ID**: `build-validation`
- **Agent**: `orchestrator`
- **Action**: Rodar build final.

## Verification Plan
- `npm run build`
