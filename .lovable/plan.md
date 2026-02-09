

## Corrigir senha exibida no dialog de Gerar Acesso

### Problema
Na linha 516 de `AdminJogadores.tsx`, o texto do dialog exibe a senha "123456" hardcoded. Precisa ser atualizado para a senha correta `2508futgestor5515@`.

### Alteracao

**Arquivo: `src/pages/admin/AdminJogadores.tsx` (linha 516)**
- Trocar `<strong>123456</strong>` por `<strong>2508futgestor5515@</strong>`

### Resultado
Todos os admins (incluindo novos times) verao a senha correta no dialog antes de gerar o acesso.

