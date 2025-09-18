# Script de Limpeza de Imports Não Utilizados

## Problemas Identificados pelo ESLint

### 1. Imports Não Utilizados que Precisam ser Removidos:

**src/pages/Index.tsx:**

- `CardDescription` (já comentado)
- `Button` (já comentado)

**src/pages/Contratos.tsx:**

- Múltiplos imports não utilizados (CardDescription, CardHeader, CardTitle, etc.)

**src/components/DocumentFormWizard.tsx:**

- Imports não utilizados já removidos

**src/components/QuickActionsDropdown.tsx:**

- `onNavigateToTerm` não utilizado

### 2. Variáveis Não Utilizadas:

**src/pages/Index.tsx:**

- `inicioDate` (já comentado)

**src/pages/TermoLocador.tsx:**

- `useEffect` não utilizado
- `FileCheck` não utilizado
- `isMultipleProprietarios` não utilizado

**src/pages/TermoLocatario.tsx:**

- `useEffect` não utilizado
- `FileCheck` não utilizado
- `isMultipleLocatarios` não utilizado
- `isMultipleProprietarios` não utilizado

### 3. Console Statements:

Múltiplos arquivos ainda têm `console.log/console.error` que precisam ser substituídos pelo sistema de logging.

## Solução Recomendada

1. **Remover imports não utilizados** - comentar ou remover completamente
2. **Substituir console statements** - usar o sistema de logging implementado
3. **Prefixar variáveis não utilizadas com `_`** - para indicar que são intencionalmente não utilizadas
4. **Usar `eslint-disable`** - para casos específicos onde é necessário manter o código

## Comando para Verificar Progresso

```bash
npm run lint
```

## Comando para Verificar TypeScript

```bash
npx tsc --noEmit
```
