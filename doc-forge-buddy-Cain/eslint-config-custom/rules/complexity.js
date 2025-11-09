/**
 * Complexity Rules - ESLint Rules para Controle de Complexidade
 * 
 * Este arquivo contém regras para controlar e prevenir código
 * complexo que pode afetar manutenibilidade e performance.
 */

module.exports = {
  // Regras de complexidade ciclomática
  'complexity': ['error', 20],

  // Regras de profundidade aninhada
  'max-depth': [
    'error',
    {
      max: 6,
    },
  ],

  // Regras de linhas por função
  'max-lines-per-function': [
    'error',
    {
      max: 150,
      skipBlankLines: true,
      skipComments: true,
    },
  ],

  // Regras de parâmetros por função
  'max-params': [
    'error',
    {
      max: 5,
    },
  ],

  // Regras de linhas por arquivo
  'max-lines': [
    'error',
    {
      max: 1000,
      skipBlankLines: true,
      skipComments: true,
    },
  ],

  // Regras de statements por função
  'max-statements': [
    'error',
    {
      max: 50,
    },
  ],

  // Regras de branches por função
  'max-branches': [
    'error',
    {
      max: 15,
    },
  ],

  // Regras de nested callbacks
  'max-nested-callbacks': [
    'error',
    {
      max: 3,
    },
  ],

  // Regras de nested IIFEs
  'no-inner-declarations': [
    'error',
    'both',
  ],

  // Regras para funções Arrow nested muito profundas
  'no-arrow-function-in-loop': 'error',

  // Regras para loops complexos
  'sonarjs/no-collapsible-if': 'error',
  'sonarjs/no-duplicate-string': ['error', 3],
  'sonarjs/no-identical-functions': 'error',
  'sonarjs/no-identical-locals': 'error',
  'sonarjs/no-one-iteration-loops': 'error',
  'sonarjs/no-redundant-boolean': 'error',
  'sonarjs/no-redundant-jump': 'error',
  'sonarjs/no-same-line-conditional': 'error',
  'sonarjs/no-small-switch': 'error',
  'sonarjs/no-collection-size-mischeck': 'error',
  'sonarjs/no-unused-collection': 'error',
  'sonarjs/no-inverted-boolean-check': 'error',
  'sonarjs/no-unused-exception-variable': 'error',
  'sonarjs/no-unused-label': 'error',
  'sonarjs/prefer-immediate-return': 'error',
  'sonarjs/prefer-optional': 'error',
  'sonarjs/prefer-single-anchor-return': 'error',

  // Regras para reduzir complexidade cognitiva
  'sonarjs/cognitive-complexity': ['error', 15],

  // Regras para prevenir padrões complexos
  'no-nested-ternary': 'error',
  'no-unneeded-ternary': 'error',
  'no-mixed-operators': 'error',

  // Regras para simplificar condicionais
  'no-else-return': 'error',
  'consistent-return': 'error',

  // Regras para simplificar loops
  'no-for-of-loops': 'error',
  'prefer-const': 'error',

  // Regras para simplificar object access
  'prefer-destructuring': [
    'error',
    {
      array: true,
      object: true,
    },
  ],

  // Regras para simplificar function declarations
  'prefer-arrow-callback': 'error',
  'prefer-template': 'error',
  'object-shorthand': 'error',

  // Regras para simplificar array operations
  'prefer-array-from': 'error',
  'prefer-array-flat-map': 'error',
  'prefer-array-map': 'error',
  'prefer-array-some': 'error',
  'prefer-array-find': 'error',
  'prefer-array-includes': 'error',
  'prefer-at': 'error',
  'prefer-object-has-own': 'error',
  'prefer-string-starts-with': 'error',
  'prefer-string-slice': 'error',
  'prefer-string-replace-all': 'error',

  // Regras para simplificar Promise operations
  'prefer-promise-reject-errors': 'error',
  'prefer-await-to-then': 'error',
  'prefer-dataset': 'error',

  // Regras para simplificar regex
  'prefer-regex-literals': 'error',

  // Regras para simplificar number operations
  'prefer-math-trunc': 'error',
  'prefer-number-properties': 'error',

  // Regras para simplificar string operations
  'prefer-string-trim-start-end': 'error',

  // Regras para simplificar nullish coalescing
  'prefer-nullish-coalescing': 'error',
  'prefer-optional-chain': 'error',

  // Regras para simplificar boolean expressions
  'no-unsafe-optional-chaining': 'error',

  // Regras para simplificar logical operators
  'logical-assignment-operators': 'error',

  // Regras para prevenir refactoring necessário
  'no-useless-computed-key': 'error',
  'no-useless-constructor': 'error',
  'no-useless-escape': 'error',
  'no-useless-rename': 'error',
  'no-useless-return': 'error',

  // Regras para simplificar assignments
  'operator-assignment': 'error',

  // Regras para simplificar comparisons
  'yoda': 'error',

  // Regras para simplificar variable declarations
  'one-var': ['error', 'never'],
  'one-var-declaration-per-line': 'error',
  'init-declarations': 'error',

  // Regras para simplificar expression statements
  'no-unused-expressions': 'error',

  // Regras para simplificar switch statements
  'default-case': 'error',
  'default-case-last': 'error',
  'no-duplicate-case': 'error',
  'no-fallthrough': 'error',
  'no-unreachable': 'error',

  // Regras para simplificar try-catch blocks
  'prefer-exponentiation-operator': 'error',
  'prefer-regex-literals': 'error',

  // Regras para simplificar labeled statements
  'no-label-var': 'error',
  'no-labels': 'error',
  'no-undefined': 'error',

  // Regras para simplificar class methods
  'class-methods-use-this': 'error',
  'lines-between-class-members': 'error',

  // Regras para simplificar object properties
  'object-property-newline': 'error',
  'object-curly-newline': [
    'error',
    {
      consistent: true,
    },
  ],

  // Regras para simplificar array elements
  'array-element-newline': [
    'error',
    'consistent',
  ],

  // Regras para simplificar function calls
  'func-style': ['error', 'expression'],
  'func-names': ['error', 'as-needed'],
  'implicit-arrow-linebreak': 'error',
  'function-paren-newline': 'error',

  // Regras para simplificar template literals
  'template-curly-spacing': 'error',
  'template-tag-spacing': 'error',

  // Regras para simplificar comments
  'multiline-comment-style': ['error', 'starred-block'],
  'spaced-comment': [
    'error',
    'always',
    {
      exceptions: ['-', '+'],
      markers: ['/'],
    },
  ],

  // Regras para simplificar whitespace
  'comma-spacing': 'error',
  'key-spacing': 'error',
  'keyword-spacing': 'error',
  'no-trailing-spaces': 'error',
  'no-multiple-empty-lines': [
    'error',
    {
      max: 2,
      maxEOF: 0,
    },
  ],
  'space-before-blocks': 'error',
  'space-in-parens': 'error',
  'space-infix-ops': 'error',

  // Regras para simplificar imports
  'import/no-useless-path-segments': 'error',

  // Regras para simplificar React specific patterns
  'react/jsx-one-expression-per-line': 'off',
  'react/jsx-wrap-multilines': 'error',
  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-undef': 'error',

  // Regras para simplificar TypeScript specific patterns
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'error',
};