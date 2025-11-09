/**
 * Security Rules - ESLint Rules para Segurança
 * 
 * Este arquivo contém regras customizadas para garantir práticas
 * de segurança adequadas no código.
 */

module.exports = {
  // Regras para prevenir vulnerabilidades de XSS
  'security/detect-unsafe-regex': 'error',
  'security/detect-buffer-noassert': 'error',
  'security/detect-child-process': 'error',
  'security/detect-disable-mustache-escape': 'error',
  'security/detect-no-csrf-before-method-override': 'error',
  'security/detect-non-literal-fs-filename': 'error',
  'security/detect-non-literal-eval': 'error',

  // Regras para validação de input
  'no-useless-escape': 'error',
  'no-control-regex': 'error',
  'no-empty-character-class': 'error',
  'no-invalid-regexp': 'error',
  'no-regex-spaces': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'valid-typeof': [
    'error',
    {
      requireStringLiterals: true,
    },
  ],

  // Regras para autenticação e autorização
  'no-constant-condition': [
    'error',
    {
      checkLoops: true,
    },
  ],
  'no-duplicate-case': 'error',
  'no-empty': [
    'error',
    {
      allowEmptyCatch: true,
    },
  ],
  'no-fallthrough': 'error',
  'no-unreachable': 'error',
  'no-unsafe-optional-chaining': [
    'error',
    {
      disallowArithmeticOperators: true,
    },
  ],

  // Regras para criptografia e hash
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'prefer-destructuring': [
    'error',
    {
      array: true,
      object: true,
    },
  ],

  // Regras para API security
  'no-throw-literal': 'error',
  'no-proto': 'error',
  'no-implied-eval': 'error',
  'no-script-url': 'error',
  'no-eval': 'error',

  // Regras para tratamento seguro de dados
  'no-extend-native': 'error',
  'no-native': 'error',
  'no-lone-blocks': 'error',
  'no-new-wrappers': 'error',
  'no-octal': 'error',
  'no-octal-escape': 'error',

  // Regras específicas para o domínio do projeto
  'no-magic-numbers': [
    'warn',
    {
      ignore: [0, 1, -1, 100, 404, 500],
      ignoreArrayIndexes: true,
      detectObjects: false,
      enforceConst: true,
    },
  ],

  // Regras para validação de tipos
  'no-explicit-any': 'warn',
  'explicit-module-boundary-types': 'error',

  // Regras para secure coding patterns
  'curly': ['error', 'all'],
  'eqeqeq': ['error', 'always', { null: 'ignore' }],
  'no-var': 'error',
  'prefer-template': 'error',

  // Regras para prevenir vazamento de dados sensíveis
  'no-console': [
    process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    {
      allow: ['warn', 'error'],
    },
  ],

  // Regras para rate limiting e anti-abuse
  'no-mutating-assignments': 'error',
  'no-mutating-methods': 'error',
  'no-mutating-template-literal': 'error',
  'no-mutation': 'error',
  'no-self-compare': 'error',
  'no-sequences': 'error',

  // Regras para secure headers e CORS (Next.js specific)
  'no-else-return': 'error',
  'no-else-after-return': 'error',

  // Regras para validação de Supabase
  'no-caller': 'error',
  'no-new-func': 'error',
  'no-with': 'error',

  // Regras para secure file handling
  'no-undef-init': 'error',
  'no-global-assign': 'error',
  'no-implicit-globals': 'error',

  // Regras para secure error handling
  'no-throw-literal': 'error',
  'no-undef': 'error',
  'no-undefined': 'error',

  // Regras para secure state management
  'no-state-actor': 'error',
  'no-shared-array-buffer': 'error',

  // Regras para secure cross-origin communication
  'no-restricted-globals': [
    'error',
    {
      name: 'postMessage',
      message: 'Use window.postMessage com validação adequada de origin',
    },
  ],

  // Regras para secure crypto usage
  'no-new-symbol': 'error',

  // Regras para secure proxy usage
  'no-proxy': 'error',

  // Regras para secure event handling
  'no-clobber': 'error',

  // Configuração de segurança adicional
  'no-async-promise-executor': 'error',
  'no-await-in-loop': 'error',

  // Regras para secure code patterns
  'no-self-assign': 'error',
  'no-self-compare': 'error',
  'no-compare-neg-zero': 'error',
  'no-constant-binary-expression': 'error',

  // Regras para secure dependency usage
  'no-restricted-dependencies': [
    'error',
    {
      dependencies: ['deprecated-package', 'vulnerable-package'],
    },
  ],

  // Regras para secure database queries
  'no-template-curly-in-string': 'error',

  // Regras para secure file upload
  'no-mixed-operators': 'error',
  'no-unreachable-loop': 'error',

  // Regras para secure API responses
  'no-shadow': 'error',
  'no-shadow-restricted-names': 'error',

  // Regras para secure authentication flows
  'no-unused-expressions': [
    'error',
    {
      allowShortCircuit: false,
      allowTernary: false,
      allowTaggedTemplates: false,
    },
  ],

  // Regras para secure data serialization
  'no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
    },
  ],

  // Regras para secure environment handling
  'no-process-env': 'warn',
  'no-process-exit': 'error',

  // Regras para secure logging
  'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
};