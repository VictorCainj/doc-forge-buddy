import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './src/test/setup.ts'
    ],
    css: false,

    exclude: [
      'node_modules/',
      'dist/',
      '.vercel/',
      'coverage/',
      '**/*.d.ts',
      '**/*.config.ts',
      '**/*.config.js',
      'src/stories/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/components/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/utils/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      exclude: [
        'node_modules/',
        'dist/',
        '.vercel/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js',
        'src/test/**',
        'src/stories/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
