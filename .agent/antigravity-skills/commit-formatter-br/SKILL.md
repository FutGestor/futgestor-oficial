---
name: commit-formatter-br
description: Formats git commit messages following Conventional Commits specification with Portuguese descriptions. Use when committing changes, writing commit messages, or when the user asks to commit code.
---

# Git Commit Formatter (pt-BR)

Formata mensagens de commit seguindo a especificação Conventional Commits, com descrições em português.

## Formato

```
<tipo>[escopo opcional]: <descrição em português>

[corpo opcional]

[rodapé opcional]
```

## Tipos Permitidos

| Tipo       | Uso                                                    |
|------------|--------------------------------------------------------|
| `feat`     | Nova funcionalidade                                    |
| `fix`      | Correção de bug                                        |
| `docs`     | Alterações apenas em documentação                      |
| `style`    | Formatação, ponto-e-vírgula, etc (sem mudança de código) |
| `refactor` | Refatoração que não corrige bug nem adiciona feature   |
| `perf`     | Melhoria de performance                                |
| `test`     | Adição ou correção de testes                           |
| `chore`    | Tarefas de manutenção, configs, dependências           |
| `ci`       | Mudanças em CI/CD                                      |
| `build`    | Mudanças no sistema de build                           |

## Instruções

1. Analise as mudanças para determinar o `tipo` principal
2. Identifique o `escopo` se aplicável (componente, módulo, página)
3. Escreva a `descrição` no imperativo em português: "adiciona filtro" (não "adicionado filtro")
4. Se houver breaking changes, adicione rodapé: `BREAKING CHANGE: descrição`
5. Mantenha a primeira linha com no máximo 72 caracteres

## Exemplos

```
feat(jogadores): adiciona cadastro de jogador com foto
fix(pagamentos): corrige cálculo de mensalidade atrasada
refactor(auth): simplifica fluxo de login com Supabase
docs(readme): atualiza instruções de instalação
chore(deps): atualiza dependências do projeto
perf(dashboard): otimiza queries de estatísticas do time
test(api): adiciona testes para edge function de webhook
```

## Restrições

- NUNCA use descrições vagas como "fix bug", "update", "wip"
- Primeira linha sempre em minúscula (exceto nomes próprios)
- Sem ponto final na descrição
- Um commit por mudança lógica
