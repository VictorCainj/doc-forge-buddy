// Cache em memória com LRU eviction
export interface MemoryCacheConfig {
  maxSize: number;
  maxAge: number;
  cleanupInterval: number;
}

export interface MemoryCacheEntry {
  data: any;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  key: string;
  size: number;
}

export class MemoryCache {
  private cache = new Map<string, MemoryCacheEntry>();
  private config: MemoryCacheConfig;
  private currentSize = 0;
  private accessOrder: string[] = []; // Para LRU

  constructor(config: MemoryCacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  // Obter dados do cache
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (this.isExpired(entry)) {
      await this.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    this.updateAccessStats(key, entry);
    
    return entry.data;
  }

  // Armazenar dados no cache
  async set<T = any>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      // Calcular tamanho aproximado
      const size = this.estimateSize(data);
      
      // Verificar se precisa fazer espaço
      if (this.currentSize + size > this.config.maxSize) {
        await this.evictLRU(size);
      }

      const now = Date.now();
      const finalTtl = ttl || this.config.maxAge;
      
      const entry: MemoryCacheEntry = {
        data,
        timestamp: now,
        lastAccessed: now,
        accessCount: 0,
        key,
        size
      };

      // Se já existe, remover tamanho antigo
      if (this.cache.has(key)) {
        this.currentSize -= this.cache.get(key)!.size;
      }

      this.cache.set(key, entry);
      this.currentSize += size;
      this.updateAccessOrder(key);

      return true;
    } catch (error) {
      console.error('Memory cache set error:', error);
      return false;
    }
  }

  // Deletar do cache
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.removeFromAccessOrder(key);
      return true;
    }
    return false;
  }

  // Limpar cache
  async clear(pattern?: string): Promise<boolean> {
    if (pattern) {
      // Limpar por padrão
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
      
      for (const key of keysToDelete) {
        await this.delete(key);
      }
    } else {
      // Limpar tudo
      this.cache.clear();
      this.currentSize = 0;
      this.accessOrder = [];
    }
    
    return true;
  }

  // Verificar se existe
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  // Invalidar por padrão
  async invalidate(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    
    let count = 0;
    for (const key of keysToDelete) {
      if (await this.delete(key)) {
        count++;
      }
    }
    
    return count;
  }

  // Cleanup de entradas expiradas
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    // Log estatísticas ocasionalmente
    if (Math.random() < 0.01) { // 1% das vezes
      console.debug('Memory cache stats:', {
        size: this.cache.size,
        currentSize: this.currentSize,
        maxSize: this.config.maxSize,
        hitRate: this.getHitRate()
      });
    }
  }

  // Obter estatísticas
  getStats() {
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.config.maxSize,
      usagePercent: (this.currentSize / this.config.maxSize) * 100,
      hitRate: this.getHitRate(),
      averageAccessCount: this.getAverageAccessCount(),
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry()
    };
  }

  // Obter todas as chaves
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Verificar se entrada expirou
  private isExpired(entry: MemoryCacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > this.config.maxAge;
  }

  // Estimar tamanho dos dados
  private estimateSize(data: any): number {
    if (data === null || data === undefined) return 64;
    if (typeof data === 'string') return data.length * 2 + 64;
    if (typeof data === 'number') return 64;
    if (typeof data === 'boolean') return 64;
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.estimateSize(item), 64);
    }
    if (typeof data === 'object') {
      return Object.keys(data).reduce((sum, key) => {
        return sum + key.length * 2 + this.estimateSize(data[key]);
      }, 64);
    }
    return 64;
  }

  // Evict usando LRU
  private async evictLRU(requiredSpace: number): Promise<void> {
    // Ordenar por lastAccessed (mais antigo primeiro)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      await this.delete(key);
      freedSpace += entry.size;
    }

    // Se ainda não tem espaço suficiente, limpar mais
    if (freedSpace < requiredSpace) {
      const half = Math.floor(this.cache.size / 2);
      const keysToRemove = entries.slice(0, half).map(([key]) => key);
      
      for (const key of keysToRemove) {
        await this.delete(key);
      }
    }
  }

  // Atualizar estatísticas de acesso
  private updateAccessStats(key: string, entry: MemoryCacheEntry): void {
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.updateAccessOrder(key);
  }

  // Atualizar ordem de acesso
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  // Remover da ordem de acesso
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // Calcular hit rate
  private getHitRate(): number {
    // Simplificado - em uma implementação real, teríamos um contador real
    const totalAccesses = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    const uniqueEntries = this.cache.size;
    return uniqueEntries > 0 ? totalAccesses / uniqueEntries : 0;
  }

  // Calcular access count médio
  private getAverageAccessCount(): number {
    if (this.cache.size === 0) return 0;
    
    const totalAccesses = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return totalAccesses / this.cache.size;
  }

  // Obter entrada mais antiga
  private getOldestEntry(): Date | null {
    if (this.cache.size === 0) return null;
    
    const oldestEntry = Array.from(this.cache.values())
      .reduce((oldest, entry) => 
        entry.timestamp < oldest.timestamp ? entry : oldest
      );
    
    return new Date(oldestEntry.timestamp);
  }

  // Obter entrada mais nova
  private getNewestEntry(): Date | null {
    if (this.cache.size === 0) return null;
    
    const newestEntry = Array.from(this.cache.values())
      .reduce((newest, entry) => 
        entry.timestamp > newest.timestamp ? entry : newest
      );
    
    return new Date(newestEntry.timestamp);
  }

  // Iniciar intervalo de cleanup
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
}