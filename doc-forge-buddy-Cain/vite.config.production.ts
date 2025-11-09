import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import fs from 'fs';

// Plugin para validação de performance budgets
function performanceBudget() {
  return {
    name: 'performance-budget',
    writeBundle() {
      
      const distPath = path.join(__dirname, 'dist');
      if (!fs.existsSync(distPath)) return;
      
      const getFileSize = (filePath) => {
        const stats = fs.statSync(filePath);
        return stats.size;
      };
      
      const analyzeAssets = (dir) => {
        const files = fs.readdirSync(dir);
        let totalSize = 0;
        const chunks = [];
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile() && file.endsWith('.js')) {
            const size = stats.size;
            totalSize += size;
            chunks.push({ name: file, size });
          }
        });
        
        return { totalSize, chunks };
      };
      
      const { totalSize, chunks } = analyzeAssets(path.join(distPath, 'assets'));
      const mainBundle = chunks.find(c => c.name.includes('index')) || chunks[0];
      const cssFiles = fs.readdirSync(path.join(distPath, 'assets'))
        .filter(f => f.endsWith('.css'))
        .map(f => getFileSize(path.join(distPath, 'assets', f)))
        .reduce((a, b) => a + b, 0);
      
      // Performance budgets (em bytes)
      const BUDGETS = {
        mainBundle: 1 * 1024 * 1024, // 1MB
        chunk: 200 * 1024, // 200KB
        cssTotal: 100 * 1024, // 100KB
        totalInitial: 2 * 1024 * 1024 // 2MB
      };
      
      let hasViolations = false;
      
      // Verificar bundle principal
      if (mainBundle && mainBundle.size > BUDGETS.mainBundle) {
        console.warn(`⚠️ Performance Budget: Main bundle (${(mainBundle.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (1MB)`);
        hasViolations = true;
      }
      
      // Verificar chunks individuais
      chunks.forEach(chunk => {
        if (chunk.size > BUDGETS.chunk) {
          console.warn(`⚠️ Performance Budget: Chunk ${chunk.name} (${(chunk.size / 1024).toFixed(2)}KB) exceeds limit (200KB)`);
          hasViolations = true;
        }
      });
      
      // Verificar CSS total
      if (cssFiles > BUDGETS.cssTotal) {
        console.warn(`⚠️ Performance Budget: CSS total (${(cssFiles / 1024).toFixed(2)}KB) exceeds limit (100KB)`);
        hasViolations = true;
      }
      
      // Verificar total inicial
      if (totalSize > BUDGETS.totalInitial) {
        console.warn(`⚠️ Performance Budget: Total initial load (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds limit (2MB)`);
        hasViolations = true;
      }
      
      if (!hasViolations) {
        console.log('✅ All performance budgets met!');
      }
      
      // Salvar relatório de performance
      const report = {
        timestamp: new Date().toISOString(),
        budgets: BUDGETS,
        actual: {
          mainBundle: mainBundle?.size || 0,
          chunks: chunks,
          cssTotal: cssFiles,
          totalInitial: totalSize
        },
        violations: hasViolations
      };
      
      fs.writeFileSync(
        path.join(distPath, 'performance-report.json'),
        JSON.stringify(report, null, 2)
      );
    }
  };
}

// Plugin para bundle analyzer
function bundleAnalyzer() {
  return {
    name: 'bundle-analyzer',
    generateBundle() {
      console.log('📊 Bundle analysis completed. Check dist/bundle-analysis.html');
    }
  };
}

// Plugin para resource hints (preload, prefetch)
function resourceHints() {
  return {
    name: 'resource-hints',
    writeBundle() {
      const fs = require('fs');
      const path = require('path');
      
      const distPath = path.join(__dirname, 'dist');
      const indexPath = path.join(distPath, 'index.html');
      
      if (!fs.existsSync(indexPath)) return;
      
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Detectar chunks para preload
      const assetsPath = path.join(distPath, 'assets');
      if (fs.existsSync(assetsPath)) {
        const chunks = fs.readdirSync(assetsPath)
          .filter(f => f.endsWith('.js'))
          .map(f => {
            const stats = fs.statSync(path.join(assetsPath, f));
            return { name: f, size: stats.size };
          })
          .sort((a, b) => b.size - a.size);
        
        // Adicionar preload para chunks críticos
        const criticalChunks = chunks.filter(c => 
          c.name.includes('vendor-react') || 
          c.name.includes('vendor-core') || 
          c.name.includes('vendor-ui')
        );
        
        criticalChunks.forEach(chunk => {
          const preloadLink = `<link rel="preload" href="/assets/${chunk.name}" as="script" crossorigin>`;
          if (!indexContent.includes(preloadLink)) {
            indexContent = indexContent.replace('</head>', `  ${preloadLink}\n</head>`);
          }
        });
        
        // Adicionar prefetch para chunks menos críticos
        const prefetchChunks = chunks.filter(c => 
          !criticalChunks.includes(c) && 
          (c.name.includes('vendor-') || c.name.includes('chunk-'))
        );
        
        prefetchChunks.forEach(chunk => {
          const prefetchLink = `<link rel="prefetch" href="/assets/${chunk.name}" as="script">`;
          if (!indexContent.includes(prefetchLink)) {
            indexContent = indexContent.replace('</head>', `  ${prefetchLink}\n</head>`);
          }
        });
      }
      
      fs.writeFileSync(indexPath, indexContent);
    }
  };
}

// Plugin para security headers no build
function securityHeaders() {
  return {
    name: 'security-headers',
    writeBundle() {
      const fs = require('fs');
      const path = require('path');
      
      const distPath = path.join(__dirname, 'dist');
      const indexPath = path.join(distPath, 'index.html');
      
      if (!fs.existsSync(indexPath)) return;
      
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Adicionar security headers ao HTML em produção
      const securityMetaTags = `
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://agzutoonsruttqbjnclo.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://agzutoonsruttqbjnclo.supabase.co wss://agzutoonsruttqbjnclo.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()">`;
      
      if (!indexContent.includes('Content-Security-Policy')) {
        indexContent = indexContent.replace('</head>', `${securityMetaTags}\n</head>`);
      }
      
      fs.writeFileSync(indexPath, indexContent);
      console.log('🛡️ Security headers added to HTML');
    }
  };
}

// Configuração principal do Vite
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isAnalyze = mode === 'analyze';
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      react(),
      // Bundle analyzer - apenas em análise
      isAnalyze && bundleAnalyzer(),
      
      // Rollup visualizer - para análise detalhada
      isAnalyze && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        exclude: ['node_modules'],
      }),
      
      // Performance budget validator - apenas em produção
      isProduction && performanceBudget(),
      
      // Resource hints - apenas em produção
      isProduction && resourceHints(),
      
      // Security headers - apenas em produção
      isProduction && securityHeaders(),
      
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
            { src: '/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any maskable' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
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
          // Estratégias de cache otimizadas
          runtimeCaching: [
            // NETWORK FIRST - APIs dinâmicas (Supabase)
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 60 * 10
                },
                cacheableResponse: { statuses: [0, 200] },
                backgroundSync: {
                  name: 'supabase-sync',
                  options: { maxRetentionTime: 24 * 60 }
                }
              }
            },
            // CACHE FIRST - Imagens estáticas
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            // CACHE FIRST - Fontes (longa duração)
            {
              urlPattern: /\.(?:woff2?|eot|ttf|otf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            // STALE WHILE REVALIDATE - CSS e JS da aplicação
            {
              urlPattern: /\.(?:css|js)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'app-assets-cache',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 14
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        },
        devOptions: { enabled: false, type: 'module' },
      }),
      
      // Sentry plugin apenas em produção
      isProduction && sentryVitePlugin({
        org: process.env.VITE_SENTRY_ORG,
        project: process.env.VITE_SENTRY_PROJECT,
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        sourcemaps: { assets: './dist/**' },
      }),
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 1. CONFIGURAÇÕES DE BUILD OTIMIZADAS
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true,
      sourcemap: false, // produção
      reportCompressedSize: false,
      chunkSizeWarningLimit: 250,
      
      rollupOptions: {
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
        },
        
        output: {
          // 2. CHUNKS ESPECÍFICOS OTIMIZADOS
          manualChunks: (id) => {
            // VENDOR REACT: React + ReactDOM (chunk crítico, carregado primeiro)
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }

            // VENDOR UI: Radix components (usado em toda aplicação)
            if (id.includes('node_modules/@radix-ui') || 
                id.includes('lucide-react')) {
              return 'vendor-ui';
            }

            // VENDOR DOCS: PDF/DOC libraries (lazy load)
            if (id.includes('html2pdf') || id.includes('html2canvas') || 
                id.includes('jspdf') || id.includes('docx') || 
                id.includes('react-markdown') || id.includes('pdf-lib')) {
              return 'vendor-docs';
            }

            // VENDOR CHARTS: Chart.js (lazy load)
            if (id.includes('chart.js') || id.includes('chartjs')) {
              return 'vendor-charts';
            }

            // VENDOR CORE: Core libraries (Router, Query)
            if (id.includes('@tanstack/react-query') || 
                id.includes('react-router')) {
              return 'vendor-core';
            }

            // VENDOR SUPABASE: Data layer
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // VENDOR FORMS: Forms e validação
            if (id.includes('react-hook-form') || 
                id.includes('@hookform') || 
                id.includes('zod')) {
              return 'vendor-forms';
            }

            // VENDOR UTILS: Utilitários pequenos
            if (id.includes('date-fns') || 
                id.includes('clsx') || 
                id.includes('tailwind-merge') || 
                id.includes('dompurify') || 
                id.includes('sonner')) {
              return 'vendor-utils';
            }

            // VENDOR SPECIALIZED: Bibliotecas grandes opcionais (lazy load)
            if (id.includes('exceljs') || 
                id.includes('framer-motion') ||
                id.includes('@sentry') || 
                id.includes('openai')) {
              return 'vendor-specialized';
            }

            return null;
          },

          // 3. NOMES DE ARQUIVOS OTIMIZADOS
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          
          // 4. NOMES DE ASSETS ORGANIZADOS
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return 'assets/images/[name]-[hash].[ext]';
            }
            if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
              return 'assets/fonts/[name]-[hash].[ext]';
            }
            if (/css/i.test(ext || '')) {
              return 'assets/css/[name]-[hash].[ext]';
            }
            return 'assets/[name]-[hash].[ext]';
          },
        },
      },
    },

    server: {
      allowedHosts: process.env.TEMPO === 'true' ? true : undefined,
      ...(isDevelopment ? {
        host: '::',
        port: 8080,
      } : {}),
      // Headers de segurança no desenvolvimento
      ...(isDevelopment && {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }),
    },

    preview: {
      // Headers de segurança no preview
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      }
    },

    // 5. OTIMIZAÇÕES DE DEPENDÊNCIAS
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'lucide-react',
        '@radix-ui/react-slot',
        '@radix-ui/react-toast',
        'clsx',
        'tailwind-merge',
        'date-fns',
        'sonner',
      ],
      exclude: [
        'html2pdf.js',
        'html2canvas', 
        'jspdf',
        'docx',
        'exceljs',
        'chart.js',
        'framer-motion',
        'openai',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },

    // 6. CONFIGURAÇÕES ESBUILD PARA PRODUÇÃO
    esbuild: {
      target: 'es2020',
      legalComments: 'none',
      treeShaking: true,
      drop: ['console', 'debugger'],
      pure: ['console.log', 'console.info', 'console.warn', 'console.error'],
    },

    // 7. CONFIGURAÇÕES DE CSS
    css: {
      devSourcemap: !isProduction,
    },

    // 8. DEFINIR VARIÁVEIS DE AMBIENTE
    define: {
      __DEV__: !isProduction,
      __PROD__: isProduction,
      __ANALYZE__: isAnalyze,
    },
  };
});