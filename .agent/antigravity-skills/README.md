# 🎯 Antigravity Skills Pack - Cristiano

Coleção de Agent Skills personalizadas para o Google Antigravity, focadas nos seus projetos e workflow de desenvolvimento.

## 📦 Skills Incluídas

### Skills de Projeto

| Skill | Descrição | Recursos |
|-------|-----------|----------|
| **futgestor** | Desenvolvimento do FutGestor (SaaS de gestão de times amadores) | RLS patterns, Mercado Pago guide |
| **titan-trainer** | Desenvolvimento do Titan Trainer (app fitness) | Schema de exercícios e treinos |

### Skills Genéricas

| Skill | Descrição | Recursos |
|-------|-----------|----------|
| **supabase-helper** | Padrões e templates para desenvolvimento com Supabase | Queries, Edge Functions, RLS, Migrations |
| **react-component-scaffold** | Geração de componentes React com TypeScript + shadcn/ui | Pages, Forms, Tables patterns |
| **deploy-lovable** | Deploy e troubleshooting na plataforma Lovable | Checklist, erros comuns |
| **commit-formatter-br** | Commits no padrão Conventional Commits em pt-BR | Exemplos em português |
| **code-review-br** | Code review completo para projetos React/TS/Supabase | Checklist de segurança, performance, UX |

## 🚀 Instalação

### Opção 1: Script automático

```bash
chmod +x install-skills.sh
./install-skills.sh
```

### Opção 2: Manual (por projeto)

```bash
# Copie as skills desejadas para o seu projeto
mkdir -p .agent/skills
cp -r futgestor .agent/skills/
cp -r titan-trainer .agent/skills/
cp -r supabase-helper .agent/skills/
# ... etc
```

### Opção 3: Manual (global)

```bash
# Disponível em todos os projetos
mkdir -p ~/.gemini/antigravity/skills
cp -r supabase-helper ~/.gemini/antigravity/skills/
cp -r react-component-scaffold ~/.gemini/antigravity/skills/
cp -r commit-formatter-br ~/.gemini/antigravity/skills/
cp -r code-review-br ~/.gemini/antigravity/skills/
cp -r deploy-lovable ~/.gemini/antigravity/skills/
```

> 💡 **Dica**: Instale skills de projeto (futgestor, titan-trainer) no escopo do projeto (`.agent/skills/`), e skills genéricas no escopo global (`~/.gemini/antigravity/skills/`).

## 🎮 Como Usar

As skills são ativadas **automaticamente** pelo Antigravity quando o agente detecta que sua pergunta é relevante. Exemplos:

| Você pergunta... | Skill ativada |
|-------------------|---------------|
| "Cria uma tela de cadastro de jogadores" | `futgestor` + `react-component-scaffold` |
| "Adiciona tracking de peso no app de treino" | `titan-trainer` |
| "Cria uma Edge Function para webhook" | `supabase-helper` |
| "Revisa esse código pra mim" | `code-review-br` |
| "Commita essas mudanças" | `commit-formatter-br` |
| "O build no Lovable tá falhando" | `deploy-lovable` |

## 📁 Estrutura de Cada Skill

```
skill-name/
├── SKILL.md            # Instruções (obrigatório)
├── scripts/            # Scripts executáveis (opcional)
├── references/         # Documentação adicional (opcional)
├── examples/           # Exemplos input/output (opcional)
└── assets/             # Templates, ícones (opcional)
```

## ✏️ Personalizando

Cada skill é um arquivo Markdown editável. Para personalizar:

1. Abra o `SKILL.md` da skill desejada
2. Edite as instruções, padrões ou restrições
3. Adicione referências ou scripts conforme necessário
4. O Antigravity carregará as mudanças na próxima ativação

## 📄 Licença

Uso pessoal. Modifique à vontade para seus projetos.
