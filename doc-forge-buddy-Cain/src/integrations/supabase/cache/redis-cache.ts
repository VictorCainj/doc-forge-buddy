// Cache Redis com fallback para simulação em desenvolvimento
export interface RedisCacheConfig {
  host: string;
  port: number;
  ttl: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  compression?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export class RedisCache {
  private config: RedisCacheConfig;
  private client: any = null;
  private isConnected = false;
  private fallbackMode = false; // Para desenvolvimento sem Redis

  constructor(config: RedisCacheConfig) {
    this.config = {
      keyPrefix: 'supabase_cache:',
      compression: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.initClient();
  }

  // Inicializar cliente Redis
  private async initClient(): Promise<void> {
    if (import.meta.env.DEV && !import.meta.env.VITE_REDIS_HOST) {
      // Modo fallback para desenvolvimento
      this.fallbackMode = true;
      console.warn('Redis cache em modo fallback - usando cache em memória simulada');
      return;
    }

    try {
      // Em produção, usar cliente Redis real (ex: ioredis)
      // Para demonstração, vamos simular a conexão
      await this.connect();
    } catch (error) {
      console.error('Erro ao conectar com Redis:', error);
      this.fallbackMode = true;
    }
  }

  // Conectar ao Redis (simulado para demonstração)
  private async connect(): Promise<void> {
    // Simulação de conexão Redis
    // Em produção, seria algo como:
    // this.client = new Redis({
    //   host: this.config.host,
    //   port: this.config.port,
    //   password: this.config.password,
    //   db: this.config.db
    // });

    // this.client.on('error', (err: any) => {
    //   console.error('Redis Client Error', err);
    //   this.isConnected = false;
    // });

    // await this.client.connect();
    
    this.isConnected = true;
  }

  // Obter dados do cache
  async get<T = any>(key: string): Promise<T | null> {
    if (this.fallbackMode) {
      return this.getFromFallback<T>(key);
    }

    if (!this.isConnected) {
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const data = await this.client.get(fullKey);
      
      if (!data) {
        return null;
      }

      const parsed = this.parseData(data);
      return parsed;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Armazenar dados no cache
  async set<T = any>(key: string, data: T, ttl?: number): Promise<boolean> {
    if (this.fallbackMode) {
      return this.setInFallback(key, data, ttl);
    }

    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serialized = this.serializeData(data);
      const finalTtl = ttl || this.config.ttl;

      // Usar EX para definir TTL em segundos
      await this.client.setEx(fullKey, Math.floor(finalTtl / 1000), serialized);
      
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  // Deletar do cache
  async delete(key: string): Promise<boolean> {
    if (this.fallbackMode) {
      return this.deleteFromFallback(key);
    }

    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey();
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  // Limpar cache
  async clear(pattern?: string): Promise<boolean> {
    if (this.fallbackMode) {
      return this.clearFallback(pattern);
    }

    if (!this.isConnected) {
      return false;
    }

    try {
      if (pattern) {
        const fullPattern = this.getFullKey(pattern);
        const keys = await this.client.keys(fullPattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        const fullPattern = this.getFullKey('*');
        const keys = await this.client.keys(fullPattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  }

  // Verificar se existe
  async has(key: string): Promise<boolean> {
    if (this.fallbackMode) {
      return this.hasInFallback(key);
    }

    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Redis has error:', error);
      return false;
    }
  }

  // Invalidar por padrão
  async invalidate(pattern: string): Promise<number> {
    if (this.fallbackMode) {
      return this.invalidateFallback(pattern);
    }

    if (!this.isConnected) {
      return 0;
    }

    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.client.keys(fullPattern);
      if (keys.length > 0) {
        const result = await this.client.del(...keys);
        return result;
      }
      return 0;
    } catch (error) {
      console.error('Redis invalidate error:', error);
      return 0;
    }
  }

  // Obter estatísticas
  getStats() {
    if (this.fallbackMode) {
      return {
        mode: 'fallback',
        connected: false,
        fallbackStats: this.getFallbackStats()
      };
    }

    return {
      mode: 'redis',
      connected: this.isConnected,
      host: this.config.host,
      port: this.config.port,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      compression: this.config.compression
    };
  }

  // Hash operations (para cache de múltiplos valores)
  async hset(key: string, field: string, value: any): Promise<boolean> {
    if (this.fallbackMode) {
      return this.hsetFallback(key, field, value);
    }

    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serialized = this.serializeData(value);
      await this.client.hSet(fullKey, field, serialized);
      return true;
    } catch (error) {
      console.error('Redis hset error:', error);
      return false;
    }
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (this.fallbackMode) {
      return this.hgetFallback<T>(key, field);
    }

    if (!this.isConnected) {
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const data = await this.client.hGet(fullKey, field);
      
      if (!data) {
        return null;
      }

      return this.parseData(data);
    } catch (error) {
      console.error('Redis hget error:', error);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    if (this.fallbackMode) {
      return this.hdelFallback(key, field);
    }

    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.hDel(fullKey, field);
      return result > 0;
    } catch (error) {
      console.error('Redis hdel error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key: string, value: any): Promise<number> {
    if (this.fallbackMode) {
      return this.lpushFallback(key, value);
    }

    if (!this.isConnected) {
      return 0;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serialized = this.serializeData(value);
      return await this.client.lPush(fullKey, serialized);
    } catch (error) {
      console.error('Redis lpush error:', error);
      return 0;
    }
  }

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    if (this.fallbackMode) {
      return this.lrangeFallback<T>(key, start, stop);
    }

    if (!this.isConnected) {
      return [];
    }

    try {
      const fullKey = this.getFullKey(key);
      const data = await this.client.lRange(fullKey, start, stop);
      return data.map(item => this.parseData(item));
    } catch (error) {
      console.error('Redis lrange error:', error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, member: any): Promise<number> {
    if (this.fallbackMode) {
      return this.saddFallback(key, member);
    }

    if (!this.isConnected) {
      return 0;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serialized = this.serializeData(member);
      return await this.client.sAdd(fullKey, serialized);
    } catch (error) {
      console.error('Redis sadd error:', error);
      return 0;
    }
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    if (this.fallbackMode) {
      return this.smembersFallback<T>(key);
    }

    if (!this.isConnected) {
      return [];
    }

    try {
      const fullKey = this.getFullKey(key);
      const data = await this.client.sMembers(fullKey);
      return data.map(item => this.parseData(item));
    } catch (error) {
      console.error('Redis smembers error:', error);
      return [];
    }
  }

  // Sincronizar dados entre caches
  async syncFromMemory(memoryData: Array<{ key: string; data: any; ttl: number }>): Promise<void> {
    if (this.fallbackMode) {
      return;
    }

    if (!this.isConnected) {
      return;
    }

    try {
      const pipeline = this.client.multi();
      
      for (const { key, data, ttl } of memoryData) {
        const fullKey = this.getFullKey(key);
        const serialized = this.serializeData(data);
        pipeline.setEx(fullKey, Math.floor(ttl / 1000), serialized);
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Redis sync error:', error);
    }
  }

  // Métodos auxiliares
  private getFullKey(key?: string): string {
    if (!key) {
      // Para casos onde o key é construído internamente
      return `${this.config.keyPrefix}*`;
    }
    return `${this.config.keyPrefix}${key}`;
  }

  private serializeData(data: any): string {
    const json = JSON.stringify(data);
    
    if (this.config.compression && json.length > 1024) {
      // Em produção, usar library como pako para compressão
      // return pako.deflate(json);
      return json;
    }
    
    return json;
  }

  private parseData(data: string): any {
    try {
      // Em produção, verificar se é compressão
      // if (data instanceof Buffer) {
      //   return JSON.parse(pako.inflate(data).toString());
      // }
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing Redis data:', error);
      return null;
    }
  }

  // FALLBACK IMPLEMENTATIONS (para desenvolvimento)
  private fallbackCache = new Map<string, { data: any; ttl: number; timestamp: number }>();
  private fallbackTtl = new Map<string, number>();

  private async getFromFallback<T = any>(key: string): Promise<T | null> {
    const entry = this.fallbackCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private async setInFallback<T = any>(key: string, data: T, ttl?: number): Promise<boolean> {
    const finalTtl = ttl || this.config.ttl;
    this.fallbackCache.set(key, {
      data,
      ttl: finalTtl,
      timestamp: Date.now()
    });
    return true;
  }

  private async deleteFromFallback(key: string): Promise<boolean> {
    return this.fallbackCache.delete(key);
  }

  private async clearFallback(pattern?: string): Promise<boolean> {
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.fallbackCache.keys()) {
        if (regex.test(key)) {
          this.fallbackCache.delete(key);
        }
      }
    } else {
      this.fallbackCache.clear();
    }
    return true;
  }

  private async hasInFallback(key: string): Promise<boolean> {
    return this.fallbackCache.has(key);
  }

  private async invalidateFallback(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    
    for (const key of this.fallbackCache.keys()) {
      if (regex.test(key)) {
        this.fallbackCache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  private getFallbackStats() {
    return {
      size: this.fallbackCache.size,
      keys: Array.from(this.fallbackCache.keys())
    };
  }

  // Hash operations fallback
  private fallbackHashes = new Map<string, Map<string, any>>();

  private async hsetFallback(key: string, field: string, value: any): Promise<boolean> {
    if (!this.fallbackHashes.has(key)) {
      this.fallbackHashes.set(key, new Map());
    }
    this.fallbackHashes.get(key)!.set(field, value);
    return true;
  }

  private async hgetFallback<T = any>(key: string, field: string): Promise<T | null> {
    const hash = this.fallbackHashes.get(key);
    return hash?.get(field) as T || null;
  }

  private async hdelFallback(key: string, field: string): Promise<boolean> {
    const hash = this.fallbackHashes.get(key);
    if (hash) {
      return hash.delete(field);
    }
    return false;
  }

  // List operations fallback
  private fallbackLists = new Map<string, any[]>();

  private async lpushFallback(key: string, value: any): Promise<number> {
    if (!this.fallbackLists.has(key)) {
      this.fallbackLists.set(key, []);
    }
    this.fallbackLists.get(key)!.unshift(value);
    return this.fallbackLists.get(key)!.length;
  }

  private async lrangeFallback<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const list = this.fallbackLists.get(key) || [];
    return list.slice(start, stop + 1) as T[];
  }

  // Set operations fallback
  private fallbackSets = new Map<string, Set<any>>();

  private async saddFallback(key: string, member: any): Promise<number> {
    if (!this.fallbackSets.has(key)) {
      this.fallbackSets.set(key, new Set());
    }
    const set = this.fallbackSets.get(key)!;
    const sizeBefore = set.size;
    set.add(member);
    return set.size - sizeBefore;
  }

  private async smembersFallback<T = any>(key: string): Promise<T[]> {
    const set = this.fallbackSets.get(key);
    return set ? Array.from(set) as T[] : [];
  }
}