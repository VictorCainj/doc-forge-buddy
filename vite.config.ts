import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // PWA Plugin com Workbox
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'placeholder.svg'],
      manifest: {
        name: 'Doc Forge Buddy',
        short_name: 'DocForge',
        description: 'Sistema de gerenciamento de contratos e documentos imobiliários com IA',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Novo Contrato',
            short_name: 'Contrato',
            description: 'Criar novo contrato de locação',
            url: '/cadastrar-contrato',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Contratos',
            short_name: 'Contratos',
            description: 'Ver todos os contratos',
            url: '/contratos',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Gerar Documento',
            short_name: 'Documento',
            description: 'Gerar documento personalizado',
            url: '/gerar-documento',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 10 // 10 minutos
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openai-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 dias
              }
            }
          },
          {
            urlPattern: /\.(?:woff2?|eot|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false // Desabilitar em desenvolvimento
      }
    }),
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
  ].filter(Boolean),
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
    // Reduzir tamanho de bundles
    reportCompressedSize: false,
    // Otimizar para produção
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
        // Remover código não utilizado
        side_effects: false,
      },
      format: {
        comments: false,
        // Manter compatibilidade com ES2020
        ecma: 2020,
      },
      mangle: {
        // Melhor minificação
        safari10: true,
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
          // Vendor chunk para React e React DOM (crítico, carregado primeiro)
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'vendor-react';
          }

          // UI components (Radix UI) - usado em toda aplicação
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }

          // PDF e documentação - chunks separados e lazy loaded apenas quando necessário
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

          // Excel - usado apenas em algumas páginas
          if (id.includes('exceljs')) {
            return 'vendor-excel';
          }

          // Supabase - usado em toda aplicação
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          // OpenAI - usado apenas em algumas páginas
          if (id.includes('openai')) {
            return 'vendor-openai';
          }

          // Forms - usado em formulários
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform') ||
            id.includes('zod')
          ) {
            return 'vendor-forms';
          }

          // Markdown - usado apenas em algumas páginas
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype')
          ) {
            return 'vendor-markdown';
          }

          // Utils - pequeno, pode ficar junto
          if (
            id.includes('date-fns') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge')
          ) {
            return 'vendor-utils';
          }

          // Charts - usado apenas em dashboards
          if (id.includes('chart.js') || id.includes('chartjs')) {
            return 'vendor-charts';
          }

          // Framer Motion - usado para animações
          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }

          // TanStack Query - usado em toda aplicação
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }

          // Router - usado em toda aplicação
          if (id.includes('react-router')) {
            return 'vendor-router';
          }

          // Lucide icons - usado em toda aplicação
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          // Sentry - usado apenas em produção
          if (id.includes('@sentry')) {
            return 'vendor-sentry';
          }

          // Sonner (toast notifications) - pequeno mas usado em toda aplicação
          if (id.includes('sonner')) {
            return 'vendor-sonner';
          }

          // DOMPurify - usado para sanitização HTML
          if (id.includes('dompurify')) {
            return 'vendor-dompurify';
          }

          // Outros node_modules pequenos - deixar Rollup decidir automaticamente
          // Não forçar agrupamento em vendor-misc para evitar dependências circulares
          return null;
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
    // Otimizar para reduzir polyfills desnecessários
    esbuildOptions: {
      target: 'es2020', // Navegadores modernos
    },
  },
  // Configurações para reduzir JavaScript não utilizado
  esbuild: {
    target: 'es2020',
    legalComments: 'none',
    treeShaking: true,
  },
}));
