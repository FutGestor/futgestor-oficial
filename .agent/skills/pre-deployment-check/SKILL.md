---
name: pre-deployment-check
description: Validações de segurança e configuração antes do deploy. Verificação de porta 8082, limpeza de artefatos (.lovable) e sincronia com git.
---

# Pre-Deployment Check

Esta skill realiza uma série de verificações automáticas para garantir que o projeto está pronto para deploy na Vercel.

## Verificações Realizadas

1.  **Leitura do DEPLOYMENT.md**: Garante que o guia de deploy existe.
2.  **Validação de Porta**: Verifica se `vite.config.ts` está configurado explicitamente para a porta `8082`.
3.  **Limpeza de Artefatos**: Garante que a pasta `.lovable` (ambiente de desenvolvimento antigo) não existe.
4.  **Sincronia Git**: Verifica se o repositório local está sincronizado com o remoto `futgestor-oficial`.

## Como Usar

Para executar a verificação completa, rode o script python incluído nesta skill:

```bash
python .agent/skills/pre-deployment-check/scripts/check.py
```

Se todas as verificações passarem, o script retornará uma mensagem de sucesso autorizando o deploy. Caso contrário, ele indicará exatamente qual verificação falhou.
