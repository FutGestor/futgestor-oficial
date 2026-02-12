# Deployment Workflow - FutGestorPro

O projeto agora é hospedado oficialmente na **Vercel** e o fluxo de desenvolvimento segue os seguintes passos:

## 1. Desenvolvimento Local
- Execute o servidor de desenvolvimento:
  ```bash
  npm run dev
  ```
- O site estará acessível em: [http://localhost:8082](http://localhost:8082)

## 2. Testes
- Sempre realize testes exaustivos no `localhost:8082` antes de realizar o deploy.

## 3. Deployment (Vercel)
- Após validar as mudanças localmente, envie-as para o repositório GitHub:
  ```bash
  git add .
  git commit -m "Descrição das alterações"
  git push origin main
  ```
- A Vercel detectará automaticamente o push no branch `main` e iniciará o build/deploy.

## 4. Configurações
- **Repositório:** `futgestor-oficial`
- **URL de Produção:** [https://futgestor-oficial.vercel.app](https://futgestor-oficial.vercel.app)
- **Supabase:** Variáveis de ambiente configuradas na Vercel e URLs de redirecionamento atualizadas no painel do Supabase.
