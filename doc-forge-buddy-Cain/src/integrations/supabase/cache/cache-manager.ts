import { MemoryCache } from './memory-cache';
import { RedisCache } from './redis-cache';
import { LocalStorageCache } from './local-storage-cache';
import { CacheAnalytics } from '../monitoring/cache-analytics';

export type CacheStrategy = 'memory' | 'redis' | 'localStorage' | 'hybrid';

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
  key: string;
}

export interface CacheConfig {
  memory: {
    maxSize: number;
    maxAge: number;
    cleanupInterval: number;
  };
  redis: {
    host: string;
    port: number;
    ttl: number;
  };
  localStorage: {
    prefix: string;
    maxSize: number;
    compression: boolean;
  };
  hybrid: {
    l1Cache: 'memory';
    l2Cache: 'redis' | 'localStorage';
    syncInterval: number;
  };
}

// Configuração de cache por ambiente
const getDefaultConfig = (): CacheConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isTest = import.meta.env.MODE === 'test';

  if (isTest) {
    return {
      memory: { maxSize: 50, maxAge: 5000, cleanupInterval: 1000 },
      redis: { host: 'localhost', port: 6379, ttl: 1000 },
      localStorage: { prefix: 'test_', maxSize: 1000, compression: false },
      hybrid: { l1Cache: 'memory', l2Cache: 'localStorage', syncInterval: 500 }
    };
  }

  if (isDevelopment) {
    return {
      memory: { maxSize: 100, maxAge: 5 * 60 * 1000, cleanupInterval: 60000 },
      redis: { host: 'localhost', port: 6379, ttl: 10 * 60 * 1000 },
      localStorage: { prefix: 'dev_', maxSize: 5000, compression: true },
      hybrid: { l1Cache: 'memory', l2Cache: 'localStorage', syncInterval: 5000 }
    };
  }

  // Produção
  return {
    memory: { maxSize: 500, maxAge: 15 * 60 * 1000, cleanupInterval: 300000 },
    redis: { 
      host: import.meta.env.VITE_REDIS_HOST || 'localhost', 
      port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'), 
      ttl: 30 * 60 * 1000 
    },
    localStorage: { 
      prefix: 'prod_', 
      maxSize: 50000, 
      compression: true 
    },
    hybrid: { 
      l1Cache: 'memory', 
      l2Cache: 'redis', 
      syncInterval: 10000 
    }
  };
};

// Gerenciador de cache com múltiplas estratégias
export class CacheManager {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;
  private localStorageCache: LocalStorageCache;
  private analytics: CacheAnalytics;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
    this.analytics = new CacheAnalytics();
    
    // Inicializar caches
    this.memoryCache = new MemoryCache(this.config.memory);
    this.redisCache = new RedisCache(this.config.redis);
    this.localStorageCache = new LocalStorageCache(this.config.localStorage);

    // Iniciar cleanup automático
    this.startCleanupInterval();
  }

  // Obter dados do cache (verifica múltiplas camadas)
  async get<T = any>(key: string, strategy: CacheStrategy = 'hybrid'): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      let data: T | null = null;
      let source: string = '';

      switch (strategy) {
        case 'memory':
          data = await this.memoryCache.get<T>(key);
          source = 'memory';
          break;

        case 'redis':
          data = await this.redisCache.get<T>(key);
          source = 'redis';
          break;

        case 'localStorage':
          data = await this.localStorageCache.get<T>(key);
          source = 'localStorage';
          break;

        case 'hybrid':
          // L1: Memory cache
          data = await this.memoryCache.get<T>(key);
          if (data) {
            source = 'memory';
            break;
          }

          // L2: Redis cache
          data = await this.redisCache.get<T>(key);
          if (data) {
            source = 'redis';
            // Propagar para L1
            await this.memoryCache.set(key, data);
            break;
          }

          // L3: LocalStorage cache
          data = await this.localStorageCache.get<T>(key);
          if (data) {
            source = 'localStorage';
            // Propagar para camadas superiores
            await this.memoryCache.set(key, data);
            await this.redisCache.set(key, data);
            break;
          }

          source = 'miss';
          break;
      }

      // Log analytics
      const duration = performance.now() - startTime;
      this.analytics.logCacheAccess({
        key,
        strategy,
        source,
        hit: data !== null,
        duration,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Armazenar dados no cache
  async set<T = any>(
    key: string, 
    data: T, 
    ttl?: number, 
    strategy: CacheStrategy = 'hybrid'
  ): Promise<boolean> {
    try {
      const finalTtl = ttl || this.getDefaultTTL(strategy);

      switch (strategy) {
        case 'memory':
          return await this.memoryCache.set(key, data, finalTtl);

        case 'redis':
          return await this.redisCache.set(key, data, finalTtl);

        case 'localStorage':
          return await this.localStorageCache.set(key, data, finalTtl);

        case 'hybrid':
          // Armazenar em todas as camadas
          const results = await Promise.allSettled([
            this.memoryCache.set(key, data, finalTtl),
            this.redisCache.set(key, data, finalTtl),
            this.localStorageCache.set(key, data, finalTtl)
          ]);

          // Verificar se pelo menos uma succeeded
          return results.some(result => result.status === 'fulfilled');
      }
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Deletar do cache
  async delete(key: string, strategy: CacheStrategy = 'hybrid'): Promise<boolean> {
    try {
      switch (strategy) {
        case 'memory':
          return await this.memoryCache.delete(key);

        case 'redis':
          return await this.redisCache.delete(key);

        case 'localStorage':
          return await this.localStorageCache.delete(key);

        case 'hybrid':
          const results = await Promise.allSettled([
            this.memoryCache.delete(key),
            this.redisCache.delete(key),
            this.localStorageCache.delete(key)
          ]);

          return results.some(result => 
            result.status === 'fulfilled' && result.value
          );
      }
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Limpar cache por padrão
  async clear(pattern?: string, strategy: CacheStrategy = 'hybrid'): Promise<boolean> {
    try {
      switch (strategy) {
        case 'memory':
          return await this.memoryCache.clear(pattern);

        case 'redis':
          return await this.redisCache.clear(pattern);

        case 'localStorage':
          return await this.localStorageCache.clear(pattern);

        case 'hybrid':
          const results = await Promise.allSettled([
            this.memoryCache.clear(pattern),
            this.redisCache.clear(pattern),
            this.localStorageCache.clear(pattern)
          ]);

          return results.every(result => 
            result.status === 'fulfilled' && result.value
          );
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Verificar se existe
  async has(key: string, strategy: CacheStrategy = 'hybrid'): Promise<boolean> {
    const data = await this.get(key, strategy);
    return data !== null;
  }

  // Obter TTL padrão por estratégia
  private getDefaultTTL(strategy: CacheStrategy): number {
    switch (strategy) {
      case 'memory':
        return this.config.memory.maxAge;
      case 'redis':
        return this.config.redis.ttl;
      case 'localStorage':
        return this.config.memory.maxAge; // Usar mesmo TTL da memory
      case 'hybrid':
        return this.config.redis.ttl;
      default:
        return 5 * 60 * 1000; // 5 minutos
    }
  }

  // Obter estatísticas do cache
  getStats(strategy?: CacheStrategy) {
    if (strategy && strategy !== 'hybrid') {
      switch (strategy) {
        case 'memory':
          return this.memoryCache.getStats();
        case 'redis':
          return this.redisCache.getStats();
        case 'localStorage':
          return this.localStorageCache.getStats();
      }
    }

    // Estatísticas de todos os caches para hybrid
    return {
      memory: this.memoryCache.getStats(),
      redis: this.redisCache.getStats(),
      localStorage: this.localStorageCache.getStats(),
      analytics: this.analytics.getStats()
    };
  }

  // Limpeza automática
  private startCleanupInterval(): void {
    // Cleanup da memory cache
    setInterval(() => {
      this.memoryCache.cleanup();
    }, this.config.memory.cleanupInterval);

    // Sync do cache híbrido
    setInterval(() => {
      if (this.config.hybrid.l1Cache === 'memory' && this.config.hybrid.l2Cache === 'redis') {
        this.syncMemoryToRedis();
      }
    }, this.config.hybrid.syncInterval);
  }

  // Sincronizar memory cache para Redis
  private async syncMemoryToRedis(): Promise<void> {
    try {
      const memoryKeys = this.memoryCache.getAllKeys();
      
      for (const key of memoryKeys) {
        const data = await this.memoryCache.get(key);
        if (data) {
          await this.redisCache.set(key, data);
        }
      }
    } catch (error) {
      console.error('Cache sync error:', error);
    }
  }

  // Invalidação inteligente de cache
  async invalidate(pattern: string, strategy: CacheStrategy = 'hybrid'): Promise<number> {
    const stats = await this.getStats(strategy);
    let invalidatedCount = 0;

    try {
      switch (strategy) {
        case 'memory':
          invalidatedCount = await this.memoryCache.invalidate(pattern);
          break;
        case 'redis':
          invalidatedCount = await this.redisCache.invalidate(pattern);
          break;
        case 'localStorage':
          invalidatedCount = await this.localStorageCache.invalidate(pattern);
          break;
        case 'hybrid':
          // Invalidar em todas as camadas
          const results = await Promise.allSettled([
            this.memoryCache.invalidate(pattern),
            this.redisCache.invalidate(pattern),
            this.localStorageCache.invalidate(pattern)
          ]);

          invalidatedCount = results.reduce((total, result) => {
            if (result.status === 'fulfilled') {
              return total + result.value;
            }
            return total;
          }, 0);
          break;
      }

      this.analytics.logInvalidation({
        pattern,
        strategy,
        count: invalidatedCount,
        timestamp: Date.now()
      });

      return invalidatedCount;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  // Warm up do cache
  async warmup(queries: Array<{ key: string; query: () => Promise<any> }>): Promise<void> {
    for (const { key, query } of queries) {
      try {
        const data = await query();
        await this.set(key, data);
      } catch (error) {
        console.error(`Cache warmup error for key ${key}:`, error);
      }
    }
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export const getCacheManager = (config?: Partial<CacheConfig>): CacheManager => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
};