/**
 * Project-Specific Rules - Regras Específicas do Projeto
 * 
 * Este arquivo contém regras customizadas baseadas nos padrões
 * específicos e necessidades do projeto doc-forge-buddy-Cain.
 */

module.exports = {
  // Regras específicas para padrões de código do projeto
  'react/jsx-filename-extension': [
    'error',
    {
      extensions: ['.tsx'],
    },
  ],

  // Regras para naming conventions específicas do projeto
  'camelcase': [
    'error',
    {
      properties: 'never',
      ignoreDestructuring: false,
      ignoreImports: false,
      ignoreGlobals: false,
    },
  ],

  // Regras para estrutura de arquivos específica
  'import/extensions': [
    'error',
    'ignorePackages',
    {
      ts: 'never',
      tsx: 'never',
      js: 'never',
      jsx: 'never',
      json: 'never',
    },
  ],

  // Regras para hooks customizados do projeto
  'react-hooks/exhaustive-deps': [
    'warn',
    {
      enableCustomHooks: [
        'useAsyncValidation',
        'useDebounce', 
        'useFormValidation',
        'useInfiniteScroll',
        'useIntersectionObserver',
        'useLocalStorage',
        'useResizeObserver',
        'useSessionStorage',
        'useThrottle',
        'useVirtualScrolling',
        'useAdvancedMemoization',
        'useAppStore',
        'useAuditLog',
        'useAuth',
        'useBehaviorBasedLoading',
        'useBudgetAnalysis',
        'useCSP',
        'useChatPersistence',
        'useCleanupDuplicates',
        'useCompleteContractData',
        'useContractAnalysis',
        'useContractBills',
        'useContractBillsSync',
        'useContractData',
        'useContractFavorites',
        'useContractTags',
        'useContractsQuery',
        'useContractsQueryNew',
        'useContractsWithPendingBills',
        'useConversationProfiles',
        'useDashboardDesocupacao',
        'useDocumentGeneration',
        'useDualChat',
        'useEditarMotivo',
        'useEvictionReasons',
        'useEvictionReasonsAdmin',
        'useFixDuplicates',
      ],
    },
  ],

  // Regras para padrões de estado específicos do projeto
  'no-magic-numbers': [
    'warn',
    {
      ignore: [
        0, 1, -1,
        100, 200, 300, 400, 500, // Status codes
        404, 401, 403, 422, // HTTP status
        1024, 2048, 4096, // File sizes
        3600, 86400, 604800, // Time in seconds
        7, 30, 365, // Days
        12, 24, // Hours
        60, 3600, // Time units
        -1, 0, 1, // Boolean-like
      ],
      ignoreArrayIndexes: true,
      enforceConst: true,
      detectObjects: false,
    },
  ],

  // Regras para padrões de componentes específicos
  'react/jsx-props-no-spreading': 'off',
  'react/jsx-one-expression-per-line': 'off',
  'react/jsx-wrap-multilines': [
    'error',
    {
      declaration: 'parens-new-line',
      assignment: 'parens-new-line',
      return: 'parens-new-line',
      arrow: 'parens-new-line',
      condition: 'parens-new-line',
      logical: 'parens-new-line',
      prop: 'parens-new-line',
    },
  ],

  // Regras para padrões de query strings e URLs
  'no-useless-escape': 'error',
  'no-template-curly-in-string': 'error',

  // Regras para padrões de Supabase específicos
  'import/no-unresolved': [
    'error',
    {
      ignore: [
        '\\.css$',
        '\\.scss$',
        '\\.sass$',
        '\\.less$',
        '\\.styl$',
        '\\.jpg$',
        '\\.jpeg$',
        '\\.png$',
        '\\.gif$',
        '\\.svg$',
        '\\.webp$',
        '\\.woff$',
        '\\.woff2$',
        '\\.ttf$',
        '\\.eot$',
        '\\.otf$',
        '\\.mp4$',
        '\\.webm$',
        '\\.mp3$',
        '\\.wav$',
        '\\.flac$',
        '\\.aac$',
        '\\.ogg$',
        '\\.oga$',
        '\\.m4a$',
        '\\.wma$',
        '\\.ra$',
        '\\.aiff$',
        '\\.au$',
        '\\.ac3$',
        '\\.3gp$',
        '\\.ts$',
        '\\.mpg$',
        '\\.mpeg$',
        '\\.mov$',
        '\\.wmv$',
        '\\.avi$',
        '\\.mkv$',
        '\\.mp2$',
        '\\.mp3$',
        '\\.mpa$',
        '\\.mp4a$',
        '\\.m4a$',
        '\\.m4p$',
        '\\.m4b$',
        '\\.m4r$',
        '\\.3ga$',
        '\\.oma$',
        '\\.aa3$',
        '\\.at3$',
        '\\.ogg$',
        '\\.ogga$',
        '\\.spx$',
        '\\.opus$',
        '\\.flac$',
        '\\.fla$',
        '\\.ly$',
        '\\.xspf$',
        '\\.json$',
        '\\.xml$',
        '\\.yml$',
        '\\.yaml$',
      ],
    },
  ],

  // Regras para padrões de formatação específicos
  'object-curly-spacing': ['error', 'always'],
  'array-bracket-spacing': ['error', 'never'],
  'comma-dangle': [
    'error',
    {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
    },
  ],

  // Regras para padrões de async/await
  'prefer-async-await': 'error',
  'no-async-promise-executor': 'error',
  'no-await-in-loop': 'error',

  // Regras para padrões de error handling específicos
  'no-throw-literal': 'error',
  'prefer-promise-reject-errors': [
    'error',
    {
      allowEmptyReject: false,
    },
  ],

  // Regras para padrões de validação específicos
  'complexity': ['error', 20],
  'max-depth': ['error', 6],
  'max-lines-per-function': [
    'error',
    {
      max: 150,
      skipBlankLines: true,
      skipComments: true,
    },
  ],
  'max-params': ['error', 5],

  // Regras para padrões de naming específicos do domínio
  'no-useless-constructor': 'error',
  'no-useless-computed-key': 'error',
  'no-useless-rename': 'error',
  'prefer-const': 'error',
  'prefer-destructuring': [
    'error',
    {
      array: true,
      object: true,
      enforceForRenamedProperties: false,
    },
  ],

  // Regras para padrões de performance específicos
  'no-var': 'error',
  'prefer-template': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-template': 'error',
  'object-shorthand': 'error',
  'prefer-template': 'error',

  // Regras para padrões de logging específicos
  'no-console': [
    process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    {
      allow: ['warn', 'error', 'info'],
    },
  ],

  // Regras para padrões de estado management específicos
  'no-param-reassign': [
    'error',
    {
      props: false,
    },
  ],

  // Regras para padrões de component design específicos
  'react/display-name': 'error',
  'react/prop-types': 'off',
  'react/require-render-return': 'error',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // Regras para padrões de testing específicos
  'no-global-assign': 'error',
  'no-implicit-globals': 'error',
  'no-implied-eval': 'error',
  'no-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',

  // Regras para padrões de security específicos
  'no-constant-condition': [
    'error',
    {
      checkLoops: true,
    },
  ],
  'no-duplicate-case': 'error',
  'no-empty-character-class': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-extra-semi': 'error',
  'no-func-assign': 'error',
  'no-inner-declarations': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-obj-calls': 'error',
  'no-prototype-builtins': 'error',
  'no-regex-spaces': 'error',
  'no-sparse-arrays': 'error',
  'no-template-curly-in-string': 'error',
  'no-unreachable': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'use-isnan': 'error',
  'valid-typeof': [
    'error',
    {
      requireStringLiterals: true,
    },
  ],

  // Regras para padrões de imports específicos do projeto
  'import/prefer-default-export': 'off',
  'import/first': 'error',
  'import/no-duplicates': 'error',
  'import/no-self-import': 'error',
  'import/no-cycle': [
    'error',
    {
      maxDepth: 10,
    },
  ],

  // Regras para TypeScript específicas
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
    },
  ],

  // Regras para padrões específicos de hooks de estado
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
        'useContractBills',
        'useContractBillsSync',
        'useContractFavorites',
        'useContractTags',
        'useContractsQueryNew',
        'useContractsWithPendingBills',
        'useConversationProfiles',
        'useDashboardDesocupacao',
        'useEditarMotivo',
        'useEvictionReasons',
        'useEvictionReasonsAdmin',
        'useCleanupDuplicates',
      ],
    },
  ],
};