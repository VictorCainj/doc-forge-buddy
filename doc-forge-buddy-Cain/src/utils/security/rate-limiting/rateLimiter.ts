/**
 * Módulo de Rate Limiting
 * Proteção contra abuso e ataques de força bruta
 */

// Instância do Redis (ajuste conforme sua configuração)
let redisClient: any = null;

/**
 * Inicializar cliente Redis
 */
export function initializeRedis(url?: string): void {
  try {
    // Para uso em ambiente Node.js
    if (typeof window === 'undefined') {
      const { createClient } = require('redis');
      redisClient = createClient({
        url: url || process.env.REDIS_URL || 'redis://localhost:6379'
      });
    }
  } catch (error) {
    console.warn('Redis não disponível, usando armazenamento em memória');
  }
}

/**
 * Rate Limiter Configuration
 */
interface RateLimitConfig {
  windowMs: number;        // Janela de tempo em ms
  max: number;             // Máximo de requisições
  message: string;         // Mensagem de erro
  keyGenerator?: (req: any) => string; // Gerador de chave
  skipSuccessfulRequests?: boolean;    // Pular requisições bem-sucedidas
  skipFailedRequests?: boolean;        // Pular requisições falhadas
}

/**
 * Rate Limiter Store Interface
 */
interface RateLimitStore {
  increment: (key: string) => Promise<{ count: number; resetTime: number }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

/**
 * Memory Store (fallback quando Redis não está disponível)
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      const newRecord = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.count++;
    return record;
  }

  async decrement(key: string): Promise<void> {
    const record = this.store.get(key);
    if (record && record.count > 0) {
      record.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Rate Limiter Implementation
 */
class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig, store: RateLimitStore) {
    this.config = config;
    this.store = store;
  }

  /**
   * Verificar se a requisição está dentro do limite
   */
  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const result = await this.store.increment(key);
      const remaining = Math.max(0, this.config.max - result.count);
      const resetTime = result.resetTime;

      return {
        allowed: result.count <= this.config.max,
        remaining,
        resetTime
      };
    } catch (error) {
      // Em caso de erro, permitir a requisição
      console.error('Rate limiter error:', error);
      return {
        allowed: true,
        remaining: this.config.max,
        resetTime: Date.now() + this.config.windowMs
      };
    }
  }

  /**
   * Decrementar contador (para requisições falhadas)
   */
  async decrement(key: string): Promise<void> {
    if (this.config.skipFailedRequests) {
      await this.store.decrement(key);
    }
  }

  /**
   * Resetar limite
   */
  async reset(key: string): Promise<void> {
    await this.store.resetKey(key);
  }
}

/**
 * Gerar chave baseada no IP e rota
 */
function defaultKeyGenerator(req: any): string {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const route = req.route?.path || req.path || req.url;
  return `rate_limit:${ip}:${route}`;
}

/**
 * Rate limiter para autenticação (5 tentativas por 15 minutos)
 */
export const authRateLimiter = new RateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    keyGenerator: (req: any) => {
      const ip = req.ip || req.connection?.remoteAddress;
      return `auth:${ip}:${req.body?.email || 'unknown'}`;
    },
    skipSuccessfulRequests: true
  },
  redisClient || new MemoryStore()
);

/**
 * Rate limiter para API geral (100 requests por minuto)
 */
export const apiRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 1000, // 1 minuto
    max: 100,
    message: 'Muitas requisições. Tente novamente em 1 minuto.',
    keyGenerator: defaultKeyGenerator
  },
  redisClient || new MemoryStore()
);

/**
 * Rate limiter para uploads (10 uploads por hora)
 */
export const uploadRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: 'Muitas tentativas de upload. Tente novamente em 1 hora.',
    keyGenerator: (req: any) => {
      const ip = req.ip || req.connection?.remoteAddress;
      return `upload:${ip}`;
    }
  },
  redisClient || new MemoryStore()
);

/**
 * Rate limiter para API search (30 pesquisas por minuto)
 */
export const searchRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 1000, // 1 minuto
    max: 30,
    message: 'Muitas pesquisas. Tente novamente em 1 minuto.',
    keyGenerator: (req: any) => {
      const ip = req.ip || req.connection?.remoteAddress;
      return `search:${ip}`;
    }
  },
  redisClient || new MemoryStore()
);

/**
 * Rate limiter estrito (1 request por segundo)
 */
export const strictRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 1000, // 1 minuto
    max: 60,
    message: 'Muitas requisições. Aguarde um momento.',
    keyGenerator: defaultKeyGenerator
  },
  redisClient || new MemoryStore()
);

/**
 * Middleware de rate limiting para Express
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (req: any, res: any, next: any) => {
    try {
      const key = limiter.config.keyGenerator 
        ? limiter.config.keyGenerator(req)
        : defaultKeyGenerator(req);

      const result = await limiter.checkLimit(key);

      // Definir headers
      res.set({
        'X-RateLimit-Limit': limiter.config.max,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000)
      });

      if (!result.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: limiter.config.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
        return;
      }

      // Armazenar função de cleanup no request
      req.rateLimit = {
        key,
        limiter,
        decrement: () => limiter.decrement(key)
      };

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Em caso de erro, permitir a requisição
    }
  };
}

/**
 * Limpar rate limit após a resposta
 */
export function rateLimitCleanup() {
  return (req: any, res: any, next: any) => {
    const originalEnd = res.end;
    
    res.end = async function(...args: any[]) {
      // Decrementar contador se a requisição falhou
      if (req.rateLimit && res.statusCode >= 400) {
        try {
          await req.rateLimit.decrement();
        } catch (error) {
          console.error('Rate limit decrement error:', error);
        }
      }
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

/**
 * Middleware para endpoints específicos
 */
export const authRateLimitMiddleware = createRateLimitMiddleware(authRateLimiter);
export const apiRateLimitMiddleware = createRateLimitMiddleware(apiRateLimiter);
export const uploadRateLimitMiddleware = createRateLimitMiddleware(uploadRateLimiter);
export const searchRateLimitMiddleware = createRateLimitMiddleware(searchRateLimiter);
export const strictRateLimitMiddleware = createRateLimitMiddleware(strictRateLimiter);

/**
 * Rate limiter customizável
 */
export function createCustomRateLimiter(config: RateLimitConfig): RateLimiter {
  const store = redisClient || new MemoryStore();
  return new RateLimiter(config, store);
}

/**
 * Rate limiter para IP específico
 */
export function createIPRateLimiter(ip: string, windowMs: number, max: number): RateLimiter {
  return new RateLimiter(
    {
      windowMs,
      max,
      message: `Muitas requisições do IP ${ip}. Tente novamente mais tarde.`,
      keyGenerator: () => `ip:${ip}`
    },
    redisClient || new MemoryStore()
  );
}

/**
 * Rate limiter para usuário específico
 */
export function createUserRateLimiter(userId: string, windowMs: number, max: number): RateLimiter {
  return new RateLimiter(
    {
      windowMs,
      max,
      message: `Muitas requisições do usuário ${userId}. Tente novamente mais tarde.`,
      keyGenerator: () => `user:${userId}`
    },
    redisClient || new MemoryStore()
  );
}

/**
 * Verificar status do rate limiting
 */
export async function getRateLimitStatus(key: string, limiter: RateLimiter) {
  try {
    const result = await limiter.checkLimit(key);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit: limiter.config.max
    };
  } catch (error) {
    console.error('Rate limit status error:', error);
    return {
      allowed: true,
      remaining: limiter.config.max,
      resetTime: Date.now() + limiter.config.windowMs,
      limit: limiter.config.max
    };
  }
}

/**
 * Resetar rate limit para uma chave específica
 */
export async function resetRateLimit(key: string, limiter: RateLimiter): Promise<void> {
  try {
    await limiter.reset(key);
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
}
