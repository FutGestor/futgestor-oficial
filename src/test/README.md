# 🧪 Testes - FutGestorPro

## Estrutura de Testes

```
src/
├── test/
│   ├── setup.ts              # Configuração global de testes
│   ├── mocks/
│   │   └── supabase.ts       # Mock do cliente Supabase
│   ├── TEMPLATE.test.ts      # Template para novos testes
│   └── README.md             # Este arquivo
├── hooks/__tests__/          # Testes de hooks
├── lib/__tests__/            # Testes de utilitários
└── integrations/supabase/__tests__/  # Testes de RLS
```

## Executando Testes

```bash
# Rodar todos os testes
npm run test

# Rodar em modo watch (desenvolvimento)
npm run test:watch

# Rodar testes específicos
npm run test -- useDeleteTeam

# Ignorar testes que precisam de credenciais
npm run test -- --exclude "**/rls.test.ts"
```

## Tipos de Testes

### 1. Testes de Hooks (`src/hooks/__tests__/`)
Testam a lógica dos hooks customizados.

**Exemplo:** `useDeleteTeam.test.ts`
- Verifica chamada correta à RPC
- Testa fluxo de sucesso e erro
- Valida limpeza de cache

### 2. Testes de Utilitários (`src/lib/__tests__/`)
Testam funções puras e helpers.

**Exemplo:** `colors.test.ts`, `utils.test.ts`
- Conversão de cores
- Merge de classes Tailwind
- Funções de data/hora

### 3. Testes de RLS (`src/integrations/supabase/__tests__/`)
Testam as políticas de segurança do banco.

**Requer:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

## Criando Novos Testes

1. Copie o template:
   ```bash
   cp src/test/TEMPLATE.test.ts src/hooks/__tests__/useNovoHook.test.ts
   ```

2. Siga o padrão AAA:
   - **Arrange**: Preparar dados
   - **Act**: Executar ação
   - **Assert**: Verificar resultado

3. Use nomes descritivos:
   ```typescript
   it("deve retornar erro quando usuário não é admin", () => {
     // ...
   });
   ```

## Cobertura Atual

| Módulo | Testes | Status |
|--------|--------|--------|
| useDeleteTeam | ✅ | Completo |
| RLS Policies | ✅ | Validação de lógica |
| Utils (cn) | ✅ | Completo |
| Colors | ✅ | Completo |

## Quando NÃO Testar

❌ **Não teste (ainda):**
- Componentes React (mudam muito)
- Fluxos E2E completos
- Estilos CSS
- Animasões

✅ **Teste:**
- Hooks de lógica pura
- Funções utilitárias
- Políticas de segurança
- Contratos de API

## Dúvidas?

Consulte o `TEMPLATE.test.ts` para exemplos de cada tipo de teste.
