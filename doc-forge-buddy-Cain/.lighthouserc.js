module.exports = {
  ci: {
    // Configurações de coleta
    collect: {
      // URLs para testar
      url: [
        'http://localhost:4173',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/contracts'
      ],
      
      // Comando para iniciar servidor (para build local)
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      
      // Número de execuções por URL
      numberOfRuns: 3,
      
      // Configurações de coleta
      settings: {
        // Preset: desktop ou mobile
        preset: 'desktop',
        
        // Form factor
        formFactor: 'desktop',
        
        // Screen emulation
        screenEmulation: {
          mobile: false,
          disabled: true
        },
        
        // Throttling de rede
        throttling: {
          rttMs: 40,           // Round trip time
          throughputKbps: 10240, // Throughput em Kbps
          cpuSlowdownMultiplier: 1 // Multiplicador de CPU
        },
        
        // Configurações de timeout
        maxWaitForLoad: 45000,
        waitFor: 'networkidle0',
        
        // Apenas categorias específicas
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    
    // Configurações de assertions (validações)
    assert: {
      // Validações básicas
      assertions: {
        // Performance score geral
        'categories:performance': ['error', { minScore: 0.85 }],
        
        // Core Web Vitals - thresholds do Google
        'first-contentful-paint': ['error', { 
          maxNumericValue: 1800, // 1.8s
          minScore: 0.8
        }],
        
        'largest-contentful-paint': ['error', { 
          maxNumericValue: 2500, // 2.5s
          minScore: 0.8
        }],
        
        'cumulative-layout-shift': ['error', { 
          maxNumericValue: 0.1, // 0.1
          minScore: 0.8
        }],
        
        'max-potential-fid': ['error', { 
          maxNumericValue: 100, // 100ms
          minScore: 0.8
        }],
        
        // Time to First Byte
        'server-response-time': ['error', { 
          maxNumericValue: 800 // 800ms
        }],
        
        // Outras métricas importantes
        'speed-index': ['warn', { 
          maxNumericValue: 3000 // 3s
        }],
        
        'total-blocking-time': ['warn', { 
          maxNumericValue: 200 // 200ms
        }],
        
        'interactive': ['warn', { 
          maxNumericValue: 5000 // 5s
        }],
        
        // Resource budgets (em bytes)
        'total-byte-weight': ['warn', { 
          maxNumericValue: 1000 * 1024 // 1MB
        }],
        
        'resource-summary:script': ['warn', { 
          maxNumericValue: 300 * 1024 // 300KB
        }],
        
        'resource-summary:image': ['warn', { 
          maxNumericValue: 1500 * 1024 // 1.5MB
        }],
        
        'resource-summary:font': ['warn', { 
          maxNumericValue: 200 * 1024 // 200KB
        }],
        
        // Outras categorias
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    },
    
    // Configurações de upload/armazenamento
    upload: {
      target: 'temporary-public-storage',
      
      // Nome do arquivo de relatório
      reportFilenamePattern: '%%PATHNAME%%-%%TIMESTAMP%%.report.%%EXT%%'
    }
  }
};

// Configurações específicas para diferentes ambientes
module.exports.mobile = {
  ci: {
    collect: {
      settings: {
        preset: 'mobile',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          disabled: false,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          touch: true
        },
        throttling: {
          rttMs: 150,            // 3G slow
          throughputKbps: 1638,  // 3G slow
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }], // Threshold mais baixo para mobile
        'first-contentful-paint': ['error', { maxNumericValue: 3000 }], // Mais permissivo para mobile
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'max-potential-fid': ['error', { maxNumericValue: 200 }]
      }
    }
  }
};

module.exports.production = {
  ci: {
    collect: {
      numberOfRuns: 5, // Mais execuções para consistência em produção
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'max-potential-fid': ['error', { maxNumericValue: 80 }],
        'total-byte-weight': ['error', { maxNumericValue: 500 * 1024 }] // 500KB mais restritivo
      }
    }
  }
};

// Função para obter configuração baseada no ambiente
module.exports.getConfig = (env = 'default') => {
  switch (env) {
    case 'production':
      return module.exports.production;
    case 'mobile':
      return module.exports.mobile;
    default:
      return module.exports;
  }
};
