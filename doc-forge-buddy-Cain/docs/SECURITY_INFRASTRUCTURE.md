# Security & Infrastructure Optimizations

## 1. CONTENT SECURITY POLICY (CSP)

// Headers de segurança avançados
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' 
      https://*.supabase.co 
      https://*.vercel.app
      https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' 
      https://fonts.googleapis.com
      https://*.vercel.app;
    font-src 'self' 
      https://fonts.gstatic.com
      https://*.vercel.app;
    img-src 'self' data: 
      https://*.supabase.co
      https://*.vercel.app
      https://lh3.googleusercontent.com;
    connect-src 'self'
      https://agzutoonsruttqbjnclo.supabase.co
      https://api.openai.com
      https://*.vercel.app
      wss://*.supabase.co;
    worker-src 'self'
      https://*.vercel.app;
    child-src 'self'
      https://*.vercel.app;
  `.replace(/\s+/g, ' ').trim(),
  
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

## 2. API RATE LIMITING

// Rate limiting para edge functions
const rateLimitConfig = {
  routes: {
    '/api/ai-proxy': { requests: 100, window: '1m' },
    '/api/email': { requests: 50, window: '1m' },
    '/api/uploads': { requests: 20, window: '1m' }
  },
  
  // Implementar em Supabase Edge Functions
  checkRateLimit: async (userId, route) => {
    const key = `rate_limit:${userId}:${route}`;
    const count = await redis.get(key);
    
    if (count && parseInt(count) >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    await redis.incr(key);
    await redis.expire(key, window);
  }
};

// 3. INPUT VALIDATION & SANITIZATION

// Validação rigorosa com Zod
import { z } from 'zod';

const ContractSchema = z.object({
  id: z.string().uuid(),
  property: z.string().min(1).max(100),
  rent: z.number().positive(),
  dueDate: z.string().datetime(),
  locador: z.string().min(2).max(50),
  locatario: z.string().min(2).max(50),
  status: z.enum(['ativo', 'inativo', 'vencido'])
});

const validateContract = (data) => {
  try {
    return ContractSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid contract data', error);
  }
};

// 4. DATA ENCRYPTION

// Criptografia para dados sensíveis
const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  key: process.env.ENCRYPTION_KEY,
  
  encrypt: (data) => {
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  },
  
  decrypt: (data) => {
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
};

// 5. DATABASE OPTIMIZATION

// Índices para performance
const databaseIndexes = [
  {
    table: 'contracts',
    columns: ['status', 'due_date', 'created_at'],
    type: 'B-tree'
  },
  {
    table: 'notifications', 
    columns: ['user_id', 'read', 'created_at'],
    type: 'B-tree'
  },
  {
    table: 'documents',
    columns: ['contract_id', 'type', 'created_at'],
    type: 'B-tree'
  }
];

// 6. MONITORING & ALERTAS

// Sistema de monitoramento
const monitoringConfig = {
  metrics: {
    responseTime: { threshold: 1000, critical: 3000 },
    errorRate: { threshold: 0.01, critical: 0.05 },
    memoryUsage: { threshold: 80, critical: 95 },
    diskUsage: { threshold: 70, critical: 90 }
  },
  
  alerts: [
    {
      condition: 'error_rate > 0.05',
      action: 'send_slack_alert',
      channels: ['admin@docforge.com', '#alerts']
    },
    {
      condition: 'response_time > 3000',
      action: 'send_email_alert',
      channels: ['dev-team@docforge.com']
    }
  ]
};

// 7. BACKUP STRATEGY

// Backup automatizado
const backupConfig = {
  schedule: '0 2 * * *', // 2h AM daily
  retention: {
    daily: 30,
    weekly: 12,
    monthly: 12,
    yearly: 7
  },
  
  destinations: [
    {
      type: 's3',
      bucket: 'docforge-backups',
      region: 'us-east-1',
      encryption: true
    }
  ]
};

// 8. ERROR TRACKING

// Sentry configuration otimizada
const sentryConfig = {
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // Reduzir para 10% em produção
  profilesSampleRate: 0.1,
  
  integrations: [
    new RewriteFrames(),
    new BrowserTracing()
  ],
  
  beforeSend: (event) => {
    // Filtrar erros de spam
    if (event.exception) {
      const error = event.exception.values[0];
      if (error.value?.includes('ResizeObserver loop limit exceeded')) {
        return null; // Ignorar erros de performance
      }
    }
    return event;
  }
};

// 9. API GATEWAY

// Gateway para roteamento e segurança
const apiGateway = {
  routes: {
    '/api/contracts/*': {
      target: 'supabase-edge-function',
      rateLimit: '100/minute',
      cache: '5 minutes'
    },
    '/api/documents/*': {
      target: 'supabase-storage',
      authentication: 'required',
      rateLimit: '20/minute'
    },
    '/api/ai/*': {
      target: 'openai-proxy',
      rateLimit: '50/minute',
      costLimit: '$10/day'
    }
  },
  
  middleware: [
    'authentication',
    'rateLimiting', 
    'logging',
    'cors',
    'compression'
  ]
};

// 10. DEPLOYMENT SECURITY

// Pipeline de deploy seguro
const deploymentConfig = {
  stages: [
    {
      name: 'code-quality',
      commands: ['npm run lint', 'npm run type-check', 'npm run test']
    },
    {
      name: 'security-scan',
      commands: ['npm audit', 'snyk test', 'dependency-check']
    },
    {
      name: 'build',
      commands: ['npm run build', 'bundle-size-check'],
      condition: 'all-tests-pass'
    },
    {
      name: 'deploy-staging',
      target: 'staging.docforge.com',
      condition: 'build-success'
    },
    {
      name: 'e2e-tests',
      target: 'staging',
      commands: ['npm run test:e2e'],
      condition: 'deploy-staging-success'
    },
    {
      name: 'deploy-production',
      target: 'docforge.com',
      condition: 'e2e-tests-pass',
      approval: 'required'
    }
  ]
};
