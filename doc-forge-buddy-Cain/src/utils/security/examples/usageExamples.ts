/**
 * Exemplo de Uso do Sistema de Segurança
 * Input Sanitization e Rate Limiting
 */

import express from 'express';
import multer from 'multer';
import { 
  configureSecurity,
  SECURITY_CONFIG,
  setupDevEnvironment,
  healthCheck
} from './index';

// Configurar ambiente
setupDevEnvironment();

// Inicializar segurança
const security = configureSecurity({
  redisUrl: process.env.REDIS_URL,
  enableRateLimit: true,
  enableSanitization: true,
  customSensitiveFields: ['confidentialData', 'internalCode']
});

const app = express();

// Middleware base
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// EXEMPLO 1: Usando Middleware de Sanitização
// ============================================================================

/**
 * Endpoint com sanitização completa
 */
app.post('/api/users', 
  // Rate limiting
  security.middlewares.sanitizeAll,
  
  // Validação manual adicional
  (req, res, next) => {
    // Validar email
    const emailValidation = security.validators.validateEmail(req.body.email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email inválido',
        details: emailValidation.errors
      });
    }
    
    // Validar telefone se fornecido
    if (req.body.phone) {
      const phoneValidation = security.validators.validatePhone(req.body.phone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Telefone inválido',
          details: phoneValidation.errors
        });
      }
    }
    
    next();
  },
  
  (req, res) => {
    // Dados já sanitizados pelo middleware
    console.log('Usuário recebido:', {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    });
    
    res.json({
      message: 'Usuário criado com sucesso',
      sanitizedData: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone
      }
    });
  }
);

// ============================================================================
// EXEMPLO 2: Endpoint com Rich Text Sanitization
// ============================================================================

/**
 * Endpoint para posts com rich text
 */
app.post('/api/posts',
  security.middlewares.sanitizeAll,
  (req, res) => {
    // Rich text já foi sanitizado
    const { title, content } = req.body;
    
    res.json({
      message: 'Post criado com sucesso',
      data: { title, content }
    });
  }
);

// ============================================================================
// EXEMPLO 3: Upload de Arquivo Seguro
// ============================================================================

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

app.post('/api/upload',
  security.middlewares.sanitizeAll,
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
    }
    
    // Nome do arquivo já foi sanitizado
    console.log('Arquivo recebido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    res.json({
      message: 'Arquivo enviado com sucesso',
      filename: req.file.originalname
    });
  }
);

// ============================================================================
// EXEMPLO 4: Busca com Rate Limiting Específico
// ============================================================================

app.get('/api/search',
  // Rate limiting específico para busca
  (req, res, next) => {
    security.rateLimiters.search.checkLimit('search:' + (req.ip || 'unknown'))
      .then(result => {
        res.set({
          'X-RateLimit-Limit': 30,
          'X-RateLimit-Remaining': result.remaining
        });
        
        if (!result.allowed) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Muitas pesquisas. Tente novamente em 1 minuto.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }
        
        next();
      })
      .catch(next);
  },
  
  security.middlewares.sanitizeAll,
  
  (req, res) => {
    const { q } = req.query;
    
    // Implementar lógica de busca aqui
    res.json({
      message: 'Busca realizada',
      query: q,
      results: [] // Resultados da busca
    });
  }
);

// ============================================================================
// EXEMPLO 5: Autenticação com Proteção Máxima
// ============================================================================

app.post('/api/auth/login',
  // Rate limiting rigoroso para auth
  (req, res, next) => {
    const key = `auth:${req.ip}:${req.body?.email || 'unknown'}`;
    security.rateLimiters.auth.checkLimit(key)
      .then(result => {
        res.set({
          'X-RateLimit-Limit': 5,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000)
        });
        
        if (!result.allowed) {
          return res.status(429).json({
            error: 'Too Many Login Attempts',
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }
        
        next();
      })
      .catch(next);
  },
  
  // Sanitização específica para auth
  (req, res, next) => {
    // Não sanitizar campos sensíveis
    if (req.body) {
      const { sanitizeInput, sanitizeObject } = require('./sanitization/inputSanitizer');
      
      // Sanitizar apenas campos não sensíveis
      req.body.email = sanitizeInput(req.body.email);
      req.body.username = sanitizeInput(req.body.username);
      
      // Manter senha e token intactos
    }
    
    next();
  },
  
  // Validação de credenciais
  (req, res) => {
    const { email, password } = req.body;
    
    // Validar credenciais
    const emailValidation = security.validators.validateEmail(email);
    const passwordValidation = security.validators.validatePassword(password);
    
    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid Credentials',
        message: 'Email ou senha inválidos',
        details: {
          email: emailValidation.errors,
          password: passwordValidation.errors
        }
      });
    }
    
    // Simular login
    res.json({
      message: 'Login realizado com sucesso',
      token: 'jwt_token_here'
    });
  }
);

// ============================================================================
// EXEMPLO 6: Query Builder Seguro
// ============================================================================

app.get('/api/users/:id',
  security.middlewares.sanitizeAll,
  
  (req, res) => {
    // Validar ID
    const idValidation = security.validators.validateId(req.params.id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid ID',
        details: idValidation.errors
      });
    }
    
    // Usar Query Builder Seguro
    const { QueryBuilderFactory } = require('./query-builder/secureQueryBuilder');
    const queryBuilder = QueryBuilderFactory.createUserQueryBuilder();
    
    try {
      const query = queryBuilder
        .select(['id', 'name', 'email', 'status'])
        .from('users')
        .where('id', '=', req.params.id)
        .where('status', '=', 'active')
        .limit(1)
        .build();
      
      // Exemplo: executar query no banco
      // const result = await db.query(query.sql, query.params);
      
      res.json({
        message: 'Usuário encontrado',
        query: query.sql,
        params: query.params
      });
    } catch (error) {
      res.status(400).json({
        error: 'Query Error',
        message: error.message
      });
    }
  }
);

// ============================================================================
// EXEMPLO 7: Health Check do Sistema de Segurança
// ============================================================================

app.get('/api/health/security', (req, res) => {
  const health = healthCheck();
  res.json(health);
});

// ============================================================================
// EXEMPLO 8: Middleware Customizado
// ============================================================================

/**
 * Middleware customizado para sanitização de rich text
 */
const customRichTextSanitizer = (req: any, res: any, next: any) => {
  if (req.body) {
    const { sanitizeRichText } = require('./sanitization/inputSanitizer');
    
    if (req.body.content) {
      req.body.content = sanitizeRichText(req.body.content);
    }
    
    if (req.body.description) {
      req.body.description = sanitizeRichText(req.body.description);
    }
  }
  
  next();
};

app.post('/api/articles',
  security.middlewares.sanitizeAll,
  customRichTextSanitizer,
  (req, res) => {
    res.json({
      message: 'Artigo criado com sucesso',
      data: {
        title: req.body.title,
        content: req.body.content, // Rich text sanitizado
        description: req.body.description // Rich text sanitizado
      }
    });
  }
);

// ============================================================================
// EXEMPLO 9: Endpoint com Validação Personalizada
// ============================================================================

app.post('/api/validate-field',
  security.middlewares.sanitizeAll,
  (req, res) => {
    const { fieldName, value, type } = req.body;
    let validation;
    
    switch (type) {
      case 'email':
        validation = security.validators.validateEmail(value);
        break;
      case 'phone':
        validation = security.validators.validatePhone(value);
        break;
      case 'cpf':
        validation = security.validators.validateCPF(value);
        break;
      case 'cnpj':
        validation = security.validators.validateCNPJ(value);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid Type',
          message: 'Tipo de validação não suportado'
        });
    }
    
    res.json({
      field: fieldName,
      type,
      isValid: validation.isValid,
      errors: validation.errors,
      value: validation.value
    });
  }
);

// ============================================================================
// EXEMPLO 10: Rate Limiting Status
// ============================================================================

app.get('/api/rate-limit-status', async (req, res) => {
  const key = 'api:' + (req.ip || 'unknown');
  
  try {
    const status = await security.rateLimiters.api.checkLimit(key);
    res.json({
      allowed: status.allowed,
      remaining: status.remaining,
      resetTime: new Date(status.resetTime).toISOString(),
      limit: 100,
      window: '1 minute'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Rate Limit Error',
      message: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Middleware de tratamento de erros
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Security Error:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint não encontrado'
  });
});

// ============================================================================
// UTILIZAÇÃO NO REACT (CLIENTE)
// ============================================================================

/**
 * Hook customizado para sanitização no cliente
 */
export const useSecurity = () => {
  const sanitizeInput = (input: string) => {
    // Sanitização básica no cliente
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  return {
    sanitizeInput,
    validateEmail
  };
};

export default app;
