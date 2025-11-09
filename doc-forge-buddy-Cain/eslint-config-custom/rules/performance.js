/**
 * Performance Rules - ESLint Rules para Otimização de Performance
 * 
 * Este arquivo contém regras customizadas para garantir que o código
 * siga as melhores práticas de performance em React e TypeScript.
 */

module.exports = {
  // Regras para prevenir re-renders desnecessários
  'react/jsx-no-constructed-context-values': 'error',
  'react/jsx-no-bind': [
    'error',
    {
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false,
      allowInline: false,
    },
  ],
  
  // Regras para memoização adequada
  'react/require-optimization': 'warn',
  'react/jsx-no-lambda': [
    'error',
    {
      allowArrowFunctions: false,
      allowNamedFunctions: false,
      allowBind: false,
      allowInlineFunctions: false,
    },
  ],

  // Regras para evitar cálculos pesados no render
  'react/jsx-no-complex-data-binding': [
    'error',
    {
      maxDepth: 2,
    },
  ],

  // Regras para performance de listas
  'react/jsx-no-array-index-key': 'warn',

  // Regras para evitar anti-patterns de performance
  'no-await-in-loop': 'error',
  'no-loop-func': 'error',
  'no-extend-native': 'error',
  'no-implicit-coercion': [
    'error',
    {
      boolean: false,
      number: true,
      string: true,
      allow: ['!!', '!!+', '!!-'],
    },
  ],

  // Regras para uso eficiente de React Query
  '@tanstack-query/stable-query-client': 'error',
  '@tanstack-query/exhaustive-deps': 'warn',

  // Regras para evitar memory leaks
  'no-new': 'error',
  'no-constant-condition': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',

  // Regras para uso eficiente de State Management
  'react-hooks/exhaustive-deps': [
    'warn',
    {
      enableCustomHooks: [
        'useContractsQuery',
        'useAuth',
        'useAppStore',
        'useContractData',
        'useDocumentGeneration',
        'useDualChat',
        'useFixDuplicates',
        'useContractAnalysis',
      ],
    },
  ],

  // Regras para otimização de bundle
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'lodash',
          message: 'Use lodash-es para tree-shaking ou funções específicas para melhor performance',
          importNames: ['default'],
        },
        {
          name: 'moment',
          message: 'Use date-fns ou dayjs para bundle menor',
        },
        {
          name: 'react-dom/server',
          message: 'Import apenas o necessário: import { renderToString } from "react-dom/server"',
        },
      ],
    },
  ],

  // Regras para prevenição de I/O blocking
  'no-synchronous-xhr': 'error',
  'no-async-generator-functions': 'error',

  // Regras para performance de hooks customizados
  'react-hooks/rules-of-hooks': 'error',

  // Regras para otimização de componentes
  'react/jsx-filename-extension': [
    'error',
    {
      extensions: ['.tsx'],
    },
  ],

  // Regras para evitar código lento
  'prefer-const': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-template': 'error',

  // Regras para otimização de CSS (se aplicável)
  'no-important': 'error',
  'no-duplicate-selectors': 'error',
};