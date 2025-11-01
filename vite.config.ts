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
  ].filter(Boolean) as ReturnType<typeof sentryVitePlugin>[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    target: 'es2020', // Navegadores modernos - remove necessidade de polyfills legacy
    cssCodeSplit: true,
    sourcemap: mode === 'development', // Source maps apenas em desenvolvimento
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs:
          mode === 'production'
            ? ['console.log', 'console.info', 'console.debug', 'console.warn']
            : [],
        passes: 3, // Mais passes para melhor otimização
        unsafe: true, // Otimizações mais agressivas
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        dead_code: true,
        unused: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: 'no-external', // Tree-shaking mais agressivo
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        manualChunks: (id) => {
          // Vendor chunk para React e React DOM
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'vendor-react';
          }

          // UI components (Radix UI)
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }

          // PDF e documentação - chunks separados mais granulares
          if (id.includes('html2pdf')) {
            return 'vendor-html2pdf';
          }

          if (id.includes('html2canvas')) {
            return 'vendor-html2canvas';
          }

          if (id.includes('jspdf')) {
            return 'vendor-jspdf';
          }

          if (id.includes('docx')) {
            return 'vendor-docx';
          }

          // Supabase
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          // OpenAI
          if (id.includes('openai')) {
            return 'vendor-openai';
          }

          // Forms
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform') ||
            id.includes('zod')
          ) {
            return 'vendor-forms';
          }

          // Markdown
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype')
          ) {
            return 'vendor-markdown';
          }

          // Utils
          if (
            id.includes('date-fns') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge')
          ) {
            return 'vendor-utils';
          }

          // Charts
          if (id.includes('chart.js') || id.includes('chartjs')) {
            return 'vendor-charts';
          }

          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }

          // TanStack Query
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }

          // Router
          if (id.includes('react-router')) {
            return 'vendor-router';
          }

          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        },
        // Otimizar nomes de chunks
        chunkFileNames:
          mode === 'production'
            ? 'assets/[name]-[hash].js'
            : 'assets/[name].js',
        entryFileNames:
          mode === 'production'
            ? 'assets/[name]-[hash].js'
            : 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
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
      'exceljs',
    ],
    exclude: ['html2pdf.js', 'html2canvas', 'jspdf'], // Excluir libs pesadas de otimização inicial
  },
}));
