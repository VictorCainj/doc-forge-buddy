/**
 * Import Organization Rules - ESLint Rules para Organização de Imports
 * 
 * Este arquivo contém regras para manter imports organizados
 * e otimizar o bundling através de tree-shaking.
 */

module.exports = {
  // Regras de ordem de imports
  'import/order': [
    'error',
    {
      'groups': [
        'builtin',
        'external',
        'internal',
        ['sibling', 'parent'],
        'index',
        'object',
        'type',
      ],
      'newlines-between': 'always',
      'alphabetize': {
        order: 'asc',
        caseInsensitive: true,
      },
      'warnOnUnassignedImports': true,
    },
  ],

  // Regras para imports não utilizados
  'import/no-unresolved': 'error',
  'import/named': 'error',
  'import/default': 'error',
  'import/namespace': 'error',

  // Regras para imports absolutos
  'import/no-absolute-path': 'error',
  'import/no-relative-parent-imports': 'warn',

  // Regras para imports dinâmicos
  'import/no-dynamic-require': 'error',
  'import/no-webpack-loader-syntax': 'error',
  'import/no-self-import': 'error',

  // Regras para ciclos de dependência
  'import/no-cycle': [
    'error',
    {
      maxDepth: 10,
      allowUnsafeDynamicCyclicDependencies: false,
    },
  ],

  // Regras para path segments desnecessários
  'import/no-useless-path-segments': 'error',

  // Regras para exports
  'import/export': 'error',
  'import/no-named-as-default': 'error',
  'import/no-named-as-default-member': 'error',
  'import/no-deprecated': 'warn',
  'import/no-empty-named-blocks': 'error',

  // Regras para dependências externas
  'import/no-extraneous-dependencies': [
    'error',
    {
      devDependencies: {
        '**/*.test.{ts,tsx}': true,
        '**/*.spec.{ts,tsx}': true,
        '**/__tests__/**/*': true,
        '**/e2e/**/*': true,
        '**/scripts/**/*': true,
        '**/config/**/*': true,
        '**/mocks/**/*': true,
      },
      optionalDependencies: false,
      peerDependencies: false,
      bundleDependencies: false,
    },
  ],

  // Regras para exports mutáveis
  'import/no-mutable-exports': 'error',

  // Regras para prefer default export
  'import/prefer-default-export': 'off',

  // Regras para CommonJS patterns
  'import/no-commonjs': 'error',
  'import/no-nodejs-modules': 'off',

  // Regras para TypeScript specific imports
  'import/no-relative-packages': 'error',
  'import/no-internal-modules': 'off',

  // Regras para optimize tree-shaking
  'import/no-anonymous-default-export': 'warn',
  'import/no-unused-modules': [
    'error',
    {
      ignoreExports: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      missingExports: true,
      unusedExports: true,
    },
  ],

  // Regras para imports de tipos TypeScript
  'import/typescript': 'error',
  'import/group-exports': 'error',
  'import/exports-last': 'error',

  // Regras para imports específicos do projeto
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

  // Regras para imports de assets
  'import/no-absolute-path': [
    'error',
    {
      commonjs: true,
      amd: true,
    },
  ],

  // Regras para imports de node_modules
  'import/no-extraneous-dependencies': [
    'error',
    {
      packageDir: ['./', './src/'],
      devDependencies: {
        '**/*.test.{ts,tsx}': true,
        '**/*.spec.{ts,tsx}': true,
        '**/__tests__/**/*': true,
        '**/e2e/**/*': true,
        '**/scripts/**/*': true,
        '**/config/**/*': true,
      },
      optionalDependencies: {
        // Permitir algumas dependências opcionais importantes
        'sharp': true,
        '@supabase/supabase-js': true,
      },
    },
  ],

  // Regras para imports de Supabase (específico do projeto)
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        {
          target: './src/components',
          from: './src/services',
          message: 'Services não devem ser importados diretamente nos componentes. Use hooks ou providers.',
        },
        {
          target: './src/hooks',
          from: './src/components',
          message: 'Componentes não devem ser importados nos hooks.',
        },
        {
          target: './src/stores',
          from: './src/components',
          message: 'Stores não devem ser importados diretamente nos componentes. Use hooks.',
        },
      ],
    },
  ],

  // Regras para import statement style
  'import/prefer-dynamic-import': 'off',
  'import/dynamic-import-chunkname': 'off',

  // Regras para re-export patterns
  'import/no-ambiguousiguous-paths': 'error',
  'import/no-namespace': 'error',
  'import/no-side-effects': 'error',

  // Regras para imports de bibliotecas grandes
  'import/no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'lodash',
          message: 'Use lodash-es para tree-shaking ou importe funções específicas',
        },
        {
          name: 'moment',
          message: 'Use date-fns para melhor performance e tree-shaking',
        },
        {
          name: 'react-dom/server',
          message: 'Import apenas o necessário: import { renderToString } from "react-dom/server"',
        },
        {
          name: 'react-dom',
          message: 'Use import específico: import { useState } from "react"',
        },
      ],
    },
  ],

  // Regras para imports duplicados
  'import/no-duplicates': 'error',

  // Regras para imports não resolvidos (sólidos)
  'import/unambiguous': 'error',

  // Regras para tree-shaking optimizations
  'import/default': 'error',
  'import/namespace': 'error',
  'import/no-named-default': 'error',
  'import/no-named-export': 'off',
  'import/no-anonymous-default-export': 'warn',

  // Reformas para imports de assets específicos
  'import/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
      json: 'never',
      css: 'never',
      scss: 'never',
      sass: 'never',
      less: 'never',
    },
  ],

  // Regras para imports de node built-ins
  'import/no-nodejs-modules': 'off',

  // Regras para performance de imports
  'import/no-webpack-loader-syntax': 'error',
  'import/no-self-import': 'error',
  'import/no-cycle': [
    'error',
    {
      maxDepth: 10,
      ignoreExternal: false,
    },
  ],

  // Regras para modules patterns
  'import/newline-after-import': 'error',
  'import/no-default-export': 'off',
  'import/prefer-named-export': 'off',

  // Regras para dependencies organization
  'import/exports-last': 'error',
  'import/group-exports': 'error',

  // Regras para imports de tipos
  'import/typescript': 'error',
  'import/no-duplicates': 'error',

  // Regras para imports de assets
  'import/no-absolute-path': 'error',

  // Regras para exports organization
  'import/first': 'error',

  // Configurações específicas do projeto para imports
  'import/internal-regex': '^@/(.*)$|^../(.*)$|^./(.*)$',

  // Regras para imports de Supabase
  'import/no-restricted-dependencies': [
    'error',
    {
      dependencies: [
        {
          name: '@supabase/supabase-js',
          message: 'Use imports específicos: import { createClient } from "@supabase/supabase-js"',
        },
      ],
    },
  ],

  // Regras para imports de performance
  'import/no-extraneous-dependencies': [
    'error',
    {
      packageDir: './',
      devDependencies: {
        '**/*.test.{ts,tsx}': true,
        '**/*.spec.{ts,tsx}': true,
        '**/__tests__/**/*': true,
        '**/e2e/**/*': true,
        '**/scripts/**/*': true,
        '**/config/**/*': true,
        '**/mocks/**/*': true,
      },
      peerDependencies: true,
      optionalDependencies: true,
    },
  ],

  // Regras para imports complexos
  'import/no-require': 'error',

  // Regras para import resolution
  'import/imports-first': 'error',

  // Regras para import file extensions
  'import/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
      json: 'never',
    },
  ],
};