import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import fs from 'fs';
import https from 'https';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. HTTPS ENFORCEMENT
app.use((req, res, next) => {
  if (isProduction && process.env.FORCE_HTTPS === 'true' && !req.secure && req.get('host') !== 'localhost') {
    return res.redirect(301, 'https://' + req.get('host') + req.url);
  }
  next();
});

// 2. TRUST PROXY (necessário para HTTPS behind reverse proxy)
if (isProduction && process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// 3. COMPRESSION
app.use(compression());

// 4. COOKIE PARSER
app.use(cookieParser());

// 5. BODY PARSER
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. SECURITY HEADERS COMPLETOS COM HELMET
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://agzutoonsruttqbjnclo.supabase.co"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://agzutoonsruttqbjnclo.supabase.co", "wss://agzutoonsruttqbjnclo.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  
  // HSTS
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
    includeSubDomains: true,
    preload: true
  },
  
  // XSS Protection
  xssFilter: true,
  
  // Content Type Options
  noSniff: true,
  
  // Frame Options
  frameguard: {
    action: 'deny'
  },
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Cross Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },
  
  // Remove Powered By header
  hidePoweredBy: true,
  
  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // Don't Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross Domain Policies
  permittedCrossDomainPolicies: false,
  
  // Policy Detector
  crossOriginEmbedderPolicy: false,
}));

// 7. CORS CONFIGURATION
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://localhost:3000',
  'https://agzutoonsruttqbjnclo.supabase.co'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}));

// 8. CUSTOM SECURITY HEADERS MIDDLEWARE
app.use((req, res, next) => {
  // Remove Server header
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  
  // Custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Remove sensitive headers
  res.removeHeader('X-AspNet-Version');
  res.removeHeader('X-AspNetMvc-Version');
  
  next();
});

// 9. SECURE COOKIES MIDDLEWARE
app.use((req, res, next) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction && process.env.SECURE_COOKIES === 'true',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    path: '/'
  };
  
  // CSRF Token
  if (!req.cookies.csrf_token) {
    const csrfToken = require('crypto').randomBytes(32).toString('hex');
    res.cookie('csrf_token', csrfToken, cookieOptions);
  }
  
  // Session token
  if (!req.cookies.session_token) {
    const sessionToken = require('crypto').randomBytes(64).toString('hex');
    res.cookie('session_token', sessionToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });
  }
  
  next();
});

// 10. RATE LIMITING
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 11. STATIC FILES SERVE
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, {
  maxAge: isProduction ? '1y' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// 12. API ROUTES (se necessário)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 13. SPA CATCH ALL ROUTE
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 14. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const message = isProduction ? 'Internal Server Error' : err.message;
  
  res.status(err.status || 500).json({
    error: message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// 15. 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// 16. SSL/TLS SERVER SETUP
let server;

if (isProduction && process.env.HTTPS === 'true') {
  try {
    const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    
    server = https.createServer(credentials, app);
    console.log('🔒 HTTPS server configured');
  } catch (error) {
    console.error('❌ Error loading SSL certificates:', error.message);
    console.log('⚠️  Falling back to HTTP server');
    server = app;
  }
} else {
  server = app;
}

// 17. START SERVER
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
${isProduction && process.env.HTTPS === 'true' ? '🔒 HTTPS: Enabled' : '🔓 HTTPS: Disabled'}
📝 Security Headers: Enabled
🛡️  CORS: Configured
🍪 Secure Cookies: ${isProduction && process.env.SECURE_COOKIES === 'true' ? 'Enabled' : 'Disabled'}
  `);
});

// 18. GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;