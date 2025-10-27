import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Sentry plugin apenas em produção
    mode === 'production' &&
      sentryVitePlugin({
        org: process.env.VITE_SENTRY_ORG,
        project: process.env.VITE_SENTRY_PROJECT,
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './dist/**',
        },
      }),
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk para React e React DOM
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'vendor';
          }

          // UI components (Radix UI)
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui';
          }

          // PDF e documentação - chunks separados mais granulares
          if (id.includes('html2pdf')) {
            return 'html2pdf';
          }

          if (id.includes('html2canvas')) {
            return 'html2canvas';
          }

          if (id.includes('jspdf')) {
            return 'jspdf';
          }

          if (id.includes('docx')) {
            return 'docx';
          }

          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }

          // OpenAI
          if (id.includes('openai')) {
            return 'openai';
          }

          // Forms
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform') ||
            id.includes('zod')
          ) {
            return 'forms';
          }

          // Markdown
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype')
          ) {
            return 'markdown';
          }

          // Utils
          if (
            id.includes('date-fns') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge')
          ) {
            return 'utils';
          }

          // Charts
          if (id.includes('chart.js') || id.includes('chartjs')) {
            return 'charts';
          }

          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'framer';
          }
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
  },
  server: {
    // @ts-expect-error - Vite types don't include allowedHosts but it's supported
    allowedHosts: process.env.TEMPO === 'true' ? true : undefined,
    ...(mode === 'development'
      ? {
          host: '::',
          port: 8080,
        }
      : {}),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },
}));
