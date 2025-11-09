/**
 * Servidor Express com Content Security Policy (CSP) robusto
 * Implementa headers de segurança completos para proteção contra XSS
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { createCSPMiddleware, cspReportHandler, devCSPMiddleware, securityLogger } from './lib/csp-middleware';
import { generateCSPMetaTag, getDevCSPConfig, getProdCSPConfig } from './lib/csp-config';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// === 1. MIDDLEWARE BÁSICO ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === 2. HEADERS DE SEGURANÇA COM HELMET ===
app.use(helmet({
  // Content Security Policy robusto
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Scripts inline apenas com nonce (mais seguro)
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        // Adicionar domínios confiáveis se necessário
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'",
        // CSS inline apenas para desenvolvimento
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-inline'"] : []),
        "https://fonts.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        // APIs permitidas
        "https://api.github.com"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      // Upgrade HTTP to HTTPS em produção
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
      // Relatório de violações
      reportUri: "/csp-report"
    }
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  
  // XSS Protection
  xssFilter: true,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Clickjacking protection
  frameguard: { action: 'deny' },
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: []
  }
}));

// === 3. MIDDLEWARE CSP PERSONALIZADO ===
// Aplicar CSP middleware personalizado
app.use(createCSPMiddleware({
  enabled: process.env.NODE_ENV === 'production',
  useNonce: true,
  reportUri: '/csp-report'
}));

// Middleware para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use(devCSPMiddleware);
}

// Logger de segurança
app.use(securityLogger);

// === 4. ROTAS ===

// Home page
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CSP Demo - Content Security Policy</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #f5f5f5;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .card { 
          background: white; 
          padding: 20px; 
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .button {
          background: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin: 5px;
        }
        .button:hover { background: #0056b3; }
        pre { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛡️ Content Security Policy (CSP) Demo</h1>
        <p>Proteção robusta contra XSS e outros ataques</p>
      </div>

      <div class="card">
        <h2>📊 Status do CSP</h2>
        <div id="csp-status">
          <p>Carregando informações do CSP...</p>
        </div>
      </div>

      <div class="card">
        <h2>🔍 Testes de Violação</h2>
        <p>Clique nos botões abaixo para testar diferentes tipos de violações CSP:</p>
        
        <button class="button" onclick="testXSS()">Testar XSS (script inline)</button>
        <button class="button" onclick="testExternalScript()">Testar script externo</button>
        <button class="button" onclick="testFrame()">Testar iframe</button>
        <button class="button" onclick="testDataURI()">Testar data URI</button>
        
        <h3>Resultados dos Testes:</h3>
        <div id="test-results"></div>
      </div>

      <div class="card">
        <h2>⚙️ Configuração Ativa</h2>
        <pre id="csp-config"></pre>
      </div>

      <script>
        // Função para obter configuração CSP
        function getCSPConfig() {
          const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
          const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || 
                           '${JSON.stringify(getProdCSPConfig(), null, 2)}';
          return cspHeader;
        }

        // Atualizar status do CSP
        function updateCSPStatus() {
          const cspHeader = getCSPConfig();
          const statusDiv = document.getElementById('csp-status');
          const configPre = document.getElementById('csp-config');
          
          if (cspHeader) {
            const directives = cspHeader.split(';').filter(d => d.trim());
            statusDiv.innerHTML = \`
              <p class="success">✅ CSP Ativo</p>
              <p><strong>Diretivas ativas:</strong> \${directives.length}</p>
              <p><strong>Principais políticas:</strong></p>
              <ul>
                \${directives.map(d => \`<li><code>\${d.trim()}</code></li>\`).join('')}
              </ul>
            \`;
            configPre.textContent = cspHeader;
          } else {
            statusDiv.innerHTML = '<p class="warning">⚠️ CSP não encontrado</p>';
          }
        }

        // Testes de violação
        function testXSS() {
          const results = document.getElementById('test-results');
          try {
            // Tentar injetar script inline (deve ser bloqueado)
            const script = document.createElement('script');
            script.textContent = 'console.log("XSS Test - Esta mensagem não deveria aparecer");';
            document.head.appendChild(script);
            results.innerHTML += '<p class="success">✅ Script inline foi bloqueado (correto)</p>';
          } catch (e) {
            results.innerHTML += '<p class="success">✅ Script inline foi bloqueado: ' + e.message + '</p>';
          }
        }

        function testExternalScript() {
          const results = document.getElementById('test-results');
          try {
            // Tentar carregar script externo (deve ser bloqueado)
            const script = document.createElement('script');
            script.src = 'https://evil.com/malicious.js';
            document.head.appendChild(script);
            results.innerHTML += '<p class="warning">⚠️ Script externo não foi bloqueado (investigar)</p>';
          } catch (e) {
            results.innerHTML += '<p class="success">✅ Script externo foi bloqueado: ' + e.message + '</p>';
          }
        }

        function testFrame() {
          const results = document.getElementById('test-results');
          try {
            // Tentar criar iframe (deve ser bloqueado)
            const iframe = document.createElement('iframe');
            iframe.src = 'https://evil.com';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            results.innerHTML += '<p class="warning">⚠️ Frame não foi bloqueado (investigar)</p>';
          } catch (e) {
            results.innerHTML += '<p class="success">✅ Frame foi bloqueado: ' + e.message + '</p>';
          }
        }

        function testDataURI() {
          const results = document.getElementById('test-results');
          try {
            // Testar se data URI é permitido
            const img = document.createElement('img');
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text>Test</text></svg>';
            img.style.display = 'none';
            document.body.appendChild(img);
            results.innerHTML += '<p class="success">✅ Data URI foi permitido (se configurado)</p>';
          } catch (e) {
            results.innerHTML += '<p class="warning">⚠️ Data URI foi bloqueado</p>';
          }
        }

        // Monitor de violações CSP
        document.addEventListener('securitypolicyviolation', function(e) {
          const results = document.getElementById('test-results');
          results.innerHTML += \`
            <div style="background: #ffebee; padding: 10px; border-left: 4px solid #f44336; margin: 10px 0;">
              <p><strong>🚨 Violação CSP Detectada:</strong></p>
              <p><strong>Diretiva:</strong> \${e.violatedDirective}</p>
              <p><strong>Bloqueado:</strong> \${e.blockedURI}</p>
              <p><strong>Documento:</strong> \${e.documentURI}</p>
            </div>
          \`;
        });

        // Inicializar
        updateCSPStatus();
      </script>
    </body>
    </html>
  `);
});

// Endpoint para reportar violações CSP
app.post('/csp-report', cspReportHandler);

// === 5. ROTAS DE TESTE ===

// Endpoint para verificar headers de segurança
app.get('/security-headers', (req: Request, res: Response) => {
  const securityHeaders = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Referrer-Policy'
  ];

  const headers = securityHeaders.map(header => ({
    header,
    value: res.getHeader(header) || 'Não definido',
    present: !!res.getHeader(header)
  }));

  res.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    headers
  });
});

// Endpoint para testar CSP em tempo real
app.get('/test-csp', (req: Request, res: Response) => {
  const testType = req.query.type as string;
  
  let testResult = '';
  switch (testType) {
    case 'script':
      testResult = '<script>console.log("Script blocked!");</script>';
      break;
    case 'iframe':
      testResult = '<iframe src="https://example.com" width="100" height="100"></iframe>';
      break;
    case 'object':
      testResult = '<object data="malicious.swf"></object>';
      break;
    default:
      testResult = '<p>Tipo de teste inválido</p>';
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CSP Test: ${testType}</title>
    </head>
    <body>
      <h1>Teste CSP - ${testType}</h1>
      <p>Esta página testa a diretiva CSP para: ${testType}</p>
      <div id="test-result">
        ${testResult}
      </div>
      <p>Se você vê algum conteúdo carregado acima, o CSP pode não estar funcionando corretamente.</p>
    </body>
    </html>
  `);
});

// === 6. SERVE DE ARQUIVOS ESTÁTICOS ===
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      // Headers adicionais para assets
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
    }
  }
}));

// === 7. ERROR HANDLING ===
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// === 8. INICIALIZAÇÃO ===
app.listen(PORT, () => {
  console.log(`
🛡️  Servidor CSP Demo rodando na porta ${PORT}
🌍 Ambiente: ${process.env.NODE_ENV}
🔒 Content Security Policy: ${process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'}
📊 Acesse: http://localhost:${PORT}
🔍 Teste CSP: http://localhost:${PORT}/security-headers
`);

  // Criar arquivo de configuração CSP
  if (!fs.existsSync('./csp-config.json')) {
    const cspConfig = {
      development: getDevCSPConfig(),
      production: getProdCSPConfig(),
      generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync('./csp-config.json', JSON.stringify(cspConfig, null, 2));
    console.log('📝 Configuração CSP salva em csp-config.json');
  }
});

export default app;