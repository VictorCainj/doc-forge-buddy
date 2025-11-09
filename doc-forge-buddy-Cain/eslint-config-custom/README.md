# ESLint Custom Config

Este diretório contém as configurações customizadas de ESLint para o projeto Doc Forge Buddy, projetadas para garantir qualidade de código, performance e segurança.

## Estrutura

```
eslint-config-custom/
├── index.js                    # Configuração principal
├── package.json               # Metadata do package
├── README.md                  # Este arquivo
└── rules/                     # Regras customizadas
    ├── performance.js         # Regras de performance
    ├── security.js           # Regras de segurança
    ├── project-specific.js   # Regras específicas do projeto
    ├── complexity.js         # Regras de controle de complexidade
    └── import-organization.js # Regras de organização de imports
```

## Categorias de Regras

### 🚀 Performance Rules (`rules/performance.js`)
- Prevenção de re-renders desnecessários
- Memoização adequada
- Otimização de cálculos no render
- Performance de listas
- Anti-patterns de performance
- Uso eficiente de React Query
- Prevenção de memory leaks
- Otimização de bundle

### 🔒 Security Rules (`rules/security.js`)
- Prevenção de vulnerabilidades XSS
- Validação de input segura
- Autenticação e autorização
- Criptografia e hash seguro
- API security
- Tratamento seguro de dados
- Headers seguros e CORS
- Validação de Supabase
- Prevenção de vazamento de dados sensíveis

### 🎯 Project-Specific Rules (`rules/project-specific.js`)
- Padrões específicos do domínio (contratos, documentos, vistoria)
- Hooks customizados do projeto
- Padrões de estado management
- Component design patterns
- Testing patterns
- Configuração específica do Supabase
- Performance patterns específicos

### 🧠 Complexity Rules (`rules/complexity.js`)
- Complexidade ciclomática (max: 20)
- Profundidade aninhada (max: 6)
- Linhas por função (max: 150)
- Parâmetros por função (max: 5)
- Redução de complexidade cognitiva
- Simplificação de condicionais
- Otimização de loops

### 📦 Import Organization Rules (`rules/import-organization.js`)
- Ordem específica de imports
- Prevenção de imports não utilizados
- Otimização para tree-shaking
- Dependências externas
- Padrões de re-export
- Performance de imports

## Uso

### Instalação das Dependências

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser \
                       eslint-plugin-react eslint-plugin-react-hooks \
                       eslint-plugin-jsx-a11y eslint-plugin-import \
                       eslint-plugin-security eslint-plugin-sonarjs \
                       eslint-plugin-unused-imports
```

### Configuração no .eslintrc.js

```javascript
const customConfig = require('./eslint-config-custom');

module.exports = {
  // ... outras configurações
  extends: [
    // ... outros extends
    ...customConfig.extends
  ],
  plugins: [
    // ... outros plugins
    ...customConfig.plugins
  ],
  rules: {
    // ... outras regras
    ...customConfig.rules,
  },
};
```

## Regras Específicas do Projeto

### Hooks Customizados Monitorados
- `useAsyncValidation`
- `useDebounce`
- `useFormValidation`
- `useInfiniteScroll`
- `useIntersectionObserver`
- `useLocalStorage`
- `useResizeObserver`
- `useSessionStorage`
- `useThrottle`
- `useVirtualScrolling`
- `useAdvancedMemoization`
- `useAppStore`
- `useAuditLog`
- `useAuth`
- `useBehaviorBasedLoading`
- `useBudgetAnalysis`
- `useCSP`
- `useChatPersistence`
- `useCleanupDuplicates`
- `useCompleteContractData`
- `useContractAnalysis`
- `useContractBills`
- `useContractBillsSync`
- `useContractData`
- `useContractFavorites`
- `useContractTags`
- `useContractsQuery`
- `useContractsQueryNew`
- `useContractsWithPendingBills`
- `useConversationProfiles`
- `useDashboardDesocupacao`
- `useDocumentGeneration`
- `useDualChat`
- `useEditarMotivo`
- `useEvictionReasons`
- `useEvictionReasonsAdmin`
- `useFixDuplicates`

### Configurações de Performance

#### Magic Numbers Permitidos
- Status codes: 100, 200, 300, 400, 500
- HTTP status: 404, 401, 403, 422
- File sizes: 1024, 2048, 4096
- Time in seconds: 3600, 86400, 604800
- Days: 7, 30, 365
- Hours: 12, 24
- Time units: 60, 3600

#### Limites de Complexidade
- Complexidade ciclomática: 20
- Profundidade aninhada: 6
- Linhas por função: 150
- Parâmetros por função: 5
- Statements por função: 50
- Branches por função: 15
- Nested callbacks: 3

## Scripts de Linting

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "lint:staged": "lint-staged"
}
```

## Integração com Husky

O projeto está configurado para usar lint-staged com Husky para linting automático em commits.

## Exceptions e Overrides

### Arquivos de Teste
- Desabilita algumas regras rigorosas em arquivos `.test.*`, `.spec.*`
- Permite `console.log` em testes
- Desabilita algumas regras de segurança

### Arquivos de Configuração
- Permite `require` em scripts
- Desabilita algumas regras de dependências externas

### Storybook Stories
- Desabilita algumas regras React específicas
- Permite props não tipadas

## Contribuindo

Para adicionar novas regras:

1. Identifique a categoria apropriada
2. Adicione a regra no arquivo correspondente
3. Documente o propósito da regra
4. Teste com casos de uso reais
5. Atualize este README

## Suporte

Para dúvidas sobre regras específicas, consulte:
- [Documentação ESLint](https://eslint.org/docs/)
- [Documentação TypeScript ESLint](https://typescript-eslint.io/)
- [Regras React ESLint](https://github.com/jsx-eslint/eslint-plugin-react)
- [Regras de Segurança](https://github.com/eslint-community/eslint-plugin-security)
- [Regras SonarJS](https://github.com/SonarSource/eslint-plugin-sonarjs)

## Changelog

### v1.0.0
- Configuração inicial completa
- Regras de performance, segurança, complexidade e organização
- Integração com hooks customizados do projeto
- Configurações específicas para Supabase e React Query