/**
 * Configuração do Lighthouse CI
 * Otimizada para Doc Forge Buddy
 */

module.exports = {
  ci: {
    collect: {
      // URLs para testar
      url: [
        'http://localhost:4173',
        'http://localhost:4173/contratos',
        'http://localhost:4173/cadastrar-contrato',
        'http://localhost:4173/gerar-documento',
      ],
      
      // Configurações de coleta
      settings: {
        // Usar Chrome headless
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
        
        // Configurações de performance
        preset: 'desktop', // ou 'mobile'
        throttling: {
          requestLatencyMs: 40,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 10240,
        },
        
        // Configurações de emulação
        emulatedUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        
        // Configurações de navegação
        numberOfRuns: 3,
        maxWaitForFcp: 15000,
        maxWaitForLoad: 30000,
        
        // Excluir recursos que podem afetar o teste
        blockedUrlPatterns: [
          // Bloquear analytics e tracking em desenvolvimento
          '*googletagmanager.com*',
          '*google-analytics.com*',
          '*facebook.net*',
          // Bloquear fontes externas se necessário
          // '*fonts.googleapis.com*',
        ],
      },
    },
    
    assert: {
      // Assertions para CI/CD
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['error', { maxNumericValue: 3000 }], // 3s
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // 200ms
        
        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        
        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'is-on-https': 'error',
        'no-vulnerabilities': 'error',
        'no-browser-logs': 'warn',
        
        // SEO
        'categories:seo': ['error', { minScore: 0.9 }],
        'meta-description': 'error',
        'document-title': 'error',
        'font-size': 'error',
        'viewport': 'error',
      },
    },
    
    upload: {
      // Configurações de upload (LHCI Server ou Google Storage)
      target: 'filesystem',
      outputDir: './lhci-reports',
      
      // Configurações de reporte
      reportFilenamePattern: '%%PATHNAME%%-%%TIMESTAMP%%.report.%%EXT%%',
      
      // Configurações de server (se usar LHCI Server)
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-lhci-token',
    },
    
    // Configurações de server
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
  },
  
  // Configurações customizadas para diferentes ambientes
  environments: {
    // Ambiente de desenvolvimento
    development: {
      collect: {
        url: ['http://localhost:4173'],
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.8 }],
          'categories:accessibility': ['warn', { minScore: 0.8 }],
          'categories:best-practices': ['warn', { minScore: 0.8 }],
          'categories:seo': ['warn', { minScore: 0.8 }],
        },
      },
    },
    
    // Ambiente de produção
    production: {
      collect: {
        url: [
          'https://your-production-domain.com',
          'https://your-production-domain.com/contratos',
          'https://your-production-domain.com/cadastrar-contrato',
        ],
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['error', { minScore: 0.9 }],
          'categories:seo': ['error', { minScore: 0.9 }],
          'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
          'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        },
      },
    },
  },
};