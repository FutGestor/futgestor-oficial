---
name: code-review-br
description: Performs code review following best practices for React, TypeScript, and Supabase projects. Use when the user asks to review code, check for bugs, improve code quality, or validate security practices. Also triggers on requests to audit code, find vulnerabilities, or suggest improvements.
---

# Code Review (pt-BR)

Realiza revisão de código focada em qualidade, segurança e manutenibilidade para projetos React + TypeScript + Supabase.

## Checklist de Revisão

### 1. Segurança 🔒
- [ ] Supabase `service_role` key não está exposta no frontend
- [ ] RLS habilitado em todas as tabelas
- [ ] Inputs validados com Zod antes de enviar ao backend
- [ ] Sem dados sensíveis em logs ou console.log
- [ ] CORS configurado corretamente em Edge Functions
- [ ] Sem SQL injection (Supabase client já protege, mas verificar queries raw)

### 2. TypeScript 📘
- [ ] Sem uso de `any` (usar `unknown` se necessário)
- [ ] Interfaces/types definidos para props de componentes
- [ ] Tipos gerados do Supabase atualizados (`supabase gen types`)
- [ ] Sem type assertions desnecessárias (`as`)
- [ ] Enums ou union types para valores fixos

### 3. React Patterns ⚛️
- [ ] Sem re-renders desnecessários (memoização quando apropriado)
- [ ] useEffect com dependências corretas
- [ ] Cleanup em useEffect quando necessário (subscriptions, timers)
- [ ] Sem lógica de negócio dentro de componentes UI
- [ ] Loading e error states implementados
- [ ] Keys únicas em listas (não usar index como key)

### 4. Supabase 🗄️
- [ ] Error handling em todas as queries
- [ ] `.select()` especificando colunas (não `select("*")` em produção)
- [ ] Realtime subscriptions com cleanup
- [ ] Migrations com rollback (`down`)
- [ ] Índices para colunas usadas em WHERE/ORDER BY frequentes

### 5. UX/Acessibilidade ♿
- [ ] Textos em pt-BR
- [ ] Formulários com mensagens de erro claras
- [ ] Botões com estados de loading
- [ ] Responsivo (mobile-first)
- [ ] Contraste adequado (WCAG AA)
- [ ] Labels em todos os inputs

### 6. Performance 🚀
- [ ] Imagens otimizadas (WebP, lazy loading)
- [ ] Componentes com lazy loading para rotas
- [ ] Queries com paginação (não carregar tudo de uma vez)
- [ ] Bundle size verificado (sem imports desnecessários)

## Instruções

1. **Receba o código** para revisão (arquivo, PR, ou trecho colado)
2. **Execute o script** `scripts/review.py` se disponível, ou analise manualmente
3. **Aplique o checklist** acima, categorizado por severidade:
   - 🔴 **Crítico**: Segurança, data loss, crashes
   - 🟡 **Importante**: Bugs potenciais, performance, manutenibilidade
   - 🟢 **Sugestão**: Melhorias de estilo, legibilidade
4. **Apresente os resultados** organizados por severidade
5. **Sugira correções** com exemplos de código quando possível

## Formato de Saída

```
## Revisão de Código - {arquivo/feature}

### 🔴 Crítico
- **[Segurança]** Descrição do problema
  - Linha X: código problemático
  - Sugestão: código corrigido

### 🟡 Importante
- **[Performance]** Descrição do problema
  - Sugestão: como melhorar

### 🟢 Sugestões
- **[Legibilidade]** Descrição da sugestão

### ✅ Pontos Positivos
- O que está bem feito no código
```

## Restrições

- Sempre apresentar pelo menos um ponto positivo
- Nunca sugerir mudanças que quebrem funcionalidade sem justificativa
- Priorizar segurança acima de tudo
- Feedback construtivo e educativo, nunca destrutivo
