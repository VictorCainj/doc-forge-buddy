# Sistema de Pre-commit Hooks - Qualidade de Código

## 🎯 Visão Geral

Este projeto implementa um sistema robusto de pre-commit hooks que garante a qualidade do código através de validações automáticas.

## 🔧 Comandos Essenciais

```bash
# Setup completo do sistema
npm run setup:complete

# Verificar status dos hooks
npm run husky:check

# Validar qualidade manualmente
npm run quality:validate

# Validar mensagem de commit
npm run commit:validate
```

## 🚀 Fluxo de Trabajo

### 1. Pre-commit
```bash
git add .
git commit -m "feat: nova funcionalidade"
# → ESLint + Prettier + TypeScript + Testes são executados automaticamente
```

### 2. Validação de Commit
```bash
git commit -m "feat: add user authentication"
# → Validação de conventional commits
```

### 3. Pre-push
```bash
git push origin feature/nova-funcionalidade
# → Build + Testes E2E + Validações completas
```

## 📊 Validações por Hook

| Hook | ESLint | Prettier | TypeScript | Testes | Build |
|------|--------|----------|------------|---------|-------|
| **Pre-commit** | ✅ | ✅ | ✅ | ✅ (modificados) | ❌ |
| **Pre-push** | ✅ | ✅ | ✅ | ✅ (todos) | ✅ |

## 🎨 Configuração Personalizada

### Modificar lint-staged
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "tsc --noEmit"
    ]
  }
}
```

### Adicionar novo hook
```bash
# Criar hook
echo '#!/bin/sh' > .husky/meu-novo-hook
chmod +x .husky/meu-novo-hook

# Adicionar ao Git
npx husky add .husky/meu-novo-hook
```

## 🔍 Troubleshooting

### Hook não executa
```bash
# Verificar status
npx husky status

# Reinstalar hooks
npm run prepare
```

### Testes falham
```bash
# Executar testes manualmente
npm test

# Ver cobertura
npm run test:coverage
```

### Conventional commit rejeitado
```bash
# Verificar formato
npm run commit:validate

# Exemplos corretos:
# feat: add new feature
# fix(auth): resolve login bug
# docs: update documentation
```

## 📈 Métricas e Relatórios

O sistema gera automaticamente:

- **Cobertura de testes** (threshold: 80%)
- **Relatórios de lint** (ESLint)
- **Build validation**
- **Performance budgets**

## 🛡️ Segurança

- **No console.log em produção** (ESLint rule)
- **No debugger statements** (automático)
- **Validação de dependências** (npm audit)
- **Type safety** (TypeScript strict mode)

## 📚 Recursos

- [📖 Guia Completo](docs/SETUP_GUIDE.md)
- [🔧 Scripts de Validação](scripts/)
- [⚙️ Configurações](.eslintrc.js, .prettierrc)

---

**Sistema implementado com ❤️ para garantir qualidade de código**