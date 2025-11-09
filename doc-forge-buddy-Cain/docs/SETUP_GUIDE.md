# Guia de Setup - Sistema de Qualidade com Pre-commit Hooks

## 📋 Visão Geral

Este projeto implementa um sistema completo de pre-commit hooks para garantir a qualidade do código. O sistema inclui:

- ✅ **ESLint** - Linting e correção automática
- ✅ **Prettier** - Formatação automática
- ✅ **TypeScript** - Verificação de tipos
- ✅ **Testes Unitários** - Execução automática (Vitest)
- ✅ **Conventional Commits** - Validação com commitlint
- ✅ **Validações de Push** - Build e testes E2E completos

## 🚀 Instalação e Configuração

### Script de Instalação Automática

#### Para Desenvolvedores - Setup Completo

Execute o script de instalação automática:

```bash
# Instalar dependências e configurar hooks
npm run setup:complete
```

Este comando executa automaticamente:
1. `npm install` - Instala todas as dependências
2. `npm run husky:setup` - Configura todos os hooks do Husky

#### Para Desenvolvedores - Instalação Manual

Se preferir instalar manualmente:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Husky (já configurado)
npx husky install

# 3. Instalar hooks do Husky
npx husky add .husky/pre-commit
npx husky add .husky/commit-msg
npx husky add .husky/pre-push

# 4. Verificar configuração
npm run husky:check
```

### Dependências Instaladas

O sistema utiliza as seguintes dependências:

```json
{
  "husky": "^9.1.7",
  "lint-staged": "^16.2.6",
  "@commitlint/cli": "^20.1.0",
  "@commitlint/config-conventional": "^20.0.0"
}
```

### Verificar Configuração

Para verificar se os hooks estão funcionando:

```bash
# Verificar status do Husky
npm run husky:check

# Executar uma validação manual
npm run quality:precommit
```

## 🔧 Como Funciona

### Pre-commit Hook

**Trigger:** Antes de cada commit  
**Validações:**

1. **ESLint** - Verifica e corrige problemas de código
2. **Prettier** - Formata arquivos automaticamente
3. **TypeScript** - Verificação de tipos
4. **Testes** - Executa testes dos arquivos modificados

```bash
# Exemplo de output do pre-commit:
🔍 Executando pre-commit hooks para qualidade de código...
🔧 Executando lint-staged...
✅ Pre-commit hooks executados com sucesso!
```

### Commit Message Validation

**Trigger:** Ao fazer commit  
**Validações:** Conventional Commits

**Formato:** `<tipo>[escopo opcional]: <descrição>`

**Tipos válidos:**
- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `style` - Formatação
- `refactor` - Refatoração
- `test` - Testes
- `chore` - Build/dependências
- `ci` - CI/CD
- `perf` - Performance
- `build` - Build
- `revert` - Reverter

**Exemplos válidos:**
```bash
feat: add user authentication
fix(auth): resolve login issue
docs: update API documentation
refactor(api): simplify user service
test(auth): add login integration tests
```

### Pre-push Hook

**Trigger:** Antes de fazer push  
**Validações por branch:**

**Branch de feature/hotfix:**
- TypeScript type check
- ESLint
- Testes unitários
- Testes de integração
- Validação de cobertura
- Build de teste
- Testes E2E

**Outras branches:**
- TypeScript type check
- ESLint

## 📁 Estrutura de Arquivos

```
.husky/
├── pre-commit          # Hook de pre-commit
├── commit-msg          # Validação de conventional commits
├── pre-push           # Validações de push
└── post-merge         # Instala dependências automaticamente

scripts/
├── validate-quality.js     # Script de validação
└── validate-commit-msg.js  # Validador de commits

package.json           # Configurações lint-staged
.eslintrc.js          # Configurações ESLint
.prettierrc           # Configurações Prettier
```

## 🛠️ Comandos Úteis

### Scripts de Setup Automático

```bash
# Setup completo (instala dependências e configura hooks)
npm run setup:complete

# Configurar hooks Husky apenas
npm run husky:setup

# Verificar configuração dos hooks
npm run husky:check

# Validar qualidade antes de commit
npm run quality:precommit
```

### Scripts de Qualidade

```bash
# Formatar código manualmente
npm run lint:fix

# Verificar TypeScript
npm run type-check

# Executar testes
npm run test
npm run test:unit
npm run test:integration
npm run test:e2e

# Verificar cobertura
npm run test:coverage

# Build de teste
npm run build

# Validações de qualidade
npm run quality-gates
npm run validate:quality-gates
npm run ci:full
```

### Scripts de Setup no Package.json

O sistema inclui os seguintes scripts automáticos:

```json
{
  "prepare": "husky",
  "postinstall": "husky install",
  "husky:setup": "node scripts/setup-husky.js",
  "husky:check": "node scripts/setup-husky.js --check",
  "setup:complete": "npm install && npm run husky:setup"
}
```

Estes scripts são executados automaticamente:
- `prepare`: Quando `npm install` é executado
- `postinstall`: Após instalação de dependências
- `husky:setup`: Para configurar hooks do Husky
- `setup:complete`: Para setup inicial completo

## 🚨 Solução de Problemas

### Hook não executa

```bash
# Reinstalar hooks
npm run prepare
npx husky install

# Verificar status
npx husky status
```

### ESLint/Prettier falham

```bash
# Instalar dependências
npm install

# Formatar manualmente
npm run lint:fix

# Verificar configuração
npx eslint --print-config src/App.tsx
```

### Conventional Commit rejeitado

```bash
# Verificar formato
node scripts/validate-commit-msg.js .git/COMMIT_EDITMSG

# Exemplos de commits válidos:
git commit -m "feat: add new feature"
git commit -m "fix: resolve login issue"
git commit -m "docs: update readme"
```

### Testes falham

```bash
# Executar testes individualmente
npm run test -- --run src/components/App.test.tsx

# Executar em modo watch
npm run test:watch

# Verificar cobertura
npm run test:coverage
```

## 🎯 Boas Práticas

### Commits

1. **Use conventional commits**
2. **Seja descritivo mas conciso** (máx 50 caracteres)
3. **Use imperativo** ("add", "fix", "update")
4. **Adicione escopo** para especificar área afetada

### Código

1. **Siga as convenções** ESLint e Prettier
2. **Escreva testes** para novas funcionalidades
3. **Mantenha cobertura alta** (> 80%)
4. **Type safety** - evite `any` quando possível

### Branching

1. **Branches de feature:** `feature/nome-da-funcionalidade`
2. **Hotfixes:** `hotfix/descricao-do-problema`
3. **Bugfixes:** `bugfix/descricao-do-bug`
4. **Releases:** `release/v1.0.0`

## 📊 Métricas e Relatórios

O sistema gera relatórios automáticos:

```bash
# Relatório de cobertura
npm run coverage:report

# Relatório de qualidade
npm run security:report

# Relatório de performance
npm run report:performance
```

## 🔄 CI/CD Integration

Os hooks são executados automaticamente no CI/CD:

```yaml
# .github/workflows/quality-gates.yml
- name: Install dependencies
  run: npm ci

- name: Run quality gates
  run: npm run quality-gates

- name: Run E2E tests
  run: npm run test:e2e
```

## 📚 Recursos Adicionais

- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs** do hook que falhou
2. **Execute comandos manualmente** para debug
3. **Consulte a documentação** específica da ferramenta
4. **Entre em contato** com a equipe de desenvolvimento

---

## 📝 Changelog

### v1.0.0 - Sistema de Qualidade Implementado

- ✅ Pre-commit hooks configurados
- ✅ Conventional commits implementados
- ✅ Validações de push configuradas
- ✅ Scripts de validação personalizados
- ✅ Documentação completa criada