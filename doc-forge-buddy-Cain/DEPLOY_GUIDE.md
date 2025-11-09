# Guia de Deploy do Doc Forge Buddy

Este documento descreve o fluxo padrão para publicar novas versões em produção. Sempre execute os passos na ordem para evitar inconsistências.

## 1. Preparação local
- Certifique-se de estar na branch `main` atualizada com `git pull`.
- Instale dependências se necessário:
  ```bash
  pnpm install
  ```
- Execute os testes e o build local:
  ```bash
  pnpm run build
  ```
  Se o build falhar, corrija o código antes de prosseguir.

## 2. Commit e push para o GitHub
- Configure o e-mail do autor igual ao e-mail autorizado na Vercel (ex.: `cainbrasil23@gmail.com`).
- Faça commit das mudanças (`git add`, `git commit`).
- Envie para o repositório remoto:
  ```bash
  git push origin main
  ```

## 3. Deploy na Vercel
- Certifique-se de que o diretório está linkado ao projeto (`vercel link --project doc-forge-buddy`).
- Execute:
  ```bash
  vercel --prod --yes
  ```
- Acompanhe o link retornado no terminal para verificar logs e status.

## 4. Variáveis de ambiente
- Gerencie valores sensíveis diretamente no painel da Vercel (`Project Settings > Environment Variables`).
- No ambiente local, use `.env` e `.env.production` somente como referência; evite subir segredos reais para o Git.

## 5. Pós-deploy
- Teste a URL de produção informada pelo Vercel para validar funcionalidade.
- Opcional: Consulte logs com `vercel inspect <deployment-url> --logs` se notar comportamento anormal.

Seguindo estas etapas, garantimos que cada release passe pelo GitHub antes de ir para produção e mantenha consistência entre ambientes.
