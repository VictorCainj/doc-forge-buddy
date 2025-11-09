// Cache usando LocalStorage com compressão
export interface LocalStorageCacheConfig {
  prefix: string;
  maxSize: number; // Tamanho máximo em bytes
  compression: boolean;
  maxEntries: number;
  cleanupInterval: number;
}

export interface StorageEntry {
  data: string; // Dados serializados
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export class LocalStorageCache {
  private config: LocalStorageCacheConfig;
  private storageStats = {
    totalSize: 0,
    entryCount: 0,
    hits: 0,
    misses: 0
  };

  constructor(config: LocalStorageCacheConfig) {
    this.config = {
      maxEntries: 1000,
      cleanupInterval: 300000, // 5 minutos
      ...config
    };

    this.startCleanupInterval();
    this.loadStats();
  }

  // Obter dados do cache
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const storageKey = this.getStorageKey(key);
      const rawData = localStorage.getItem(storageKey);
      
      if (!rawData) {
        this.storageStats.misses++;
        return null;
      }

      const entry: StorageEntry = JSON.parse(rawData);
      
      // Verificar se não expirou
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.storageStats.misses++;
        return null;
      }

      // Atualizar estatísticas de acesso
      this.updateAccessStats(storageKey, entry);
      
      // Deserializar dados
      const data = this.deserializeData(entry.data);
      this.storageStats.hits++;
      
      return data as T;
    } catch (error) {
      console.error('LocalStorage cache get error:', error);
      this.storageStats.misses++;
      return null;
    }
  }

  // Armazenar dados no cache
  async set<T = any>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(key);
      
      // Serializar dados
      const serializedData = this.serializeData(data);
      const size = this.calculateSize(serializedData);
      
      // Verificar se precisa fazer espaço
      if (!this.hasSpace(size)) {
        await this.makeSpace(size);
      }

      // Criar entrada
      const now = Date.now();
      const entry: StorageEntry = {
        data: serializedData,
        timestamp: now,
        size,
        accessCount: 1,
        lastAccessed: now
      };

      // Obter entrada existente para calcular tamanho anterior
      const existingSize = this.getExistingEntrySize(storageKey);

      // Armazenar no localStorage
      localStorage.setItem(storageKey, JSON.stringify(entry));

      // Atualizar estatísticas
      this.updateStorageStats(size, existingSize);
      this.saveStats();

      return true;
    } catch (error) {
      console.error('LocalStorage cache set error:', error);
      return false;
    }
  }

  // Deletar do cache
  async delete(key: string): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(key);
      const entry = this.getEntry(storageKey);
      
      if (entry) {
        localStorage.removeItem(storageKey);
        this.updateStorageStats(-entry.size, 0);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('LocalStorage cache delete error:', error);
      return false;
    }
  }

  // Limpar cache
  async clear(pattern?: string): Promise<boolean> {
    try {
      if (pattern) {
        // Limpar por padrão
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const keysToDelete = this.getAllKeys().filter(key => regex.test(key));
        
        for (const key of keysToDelete) {
          await this.delete(key);
        }
      } else {
        // Limpar tudo
        const allKeys = this.getAllKeys();
        for (const key of allKeys) {
          localStorage.removeItem(key);
        }
        
        this.storageStats.totalSize = 0;
        this.storageStats.entryCount = 0;
      }

      this.saveStats();
      return true;
    } catch (error) {
      console.error('LocalStorage cache clear error:', error);
      return false;
    }
  }

  // Verificar se existe
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  // Invalidar por padrão
  async invalidate(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const allKeys = this.getAllKeys();
    let count = 0;
    
    for (const storageKey of allKeys) {
      if (regex.test(storageKey)) {
        const key = this.getOriginalKey(storageKey);
        if (await this.delete(key)) {
          count++;
        }
      }
    }
    
    return count;
  }

  // Obter estatísticas
  getStats() {
    return {
      ...this.storageStats,
      maxSize: this.config.maxSize,
      usagePercent: (this.storageStats.totalSize / this.config.maxSize) * 100,
      maxEntries: this.config.maxEntries,
      entryCount: this.storageStats.entryCount,
      hitRate: this.storageStats.hits + this.storageStats.misses > 0 
        ? this.storageStats.hits / (this.storageStats.hits + this.storageStats.misses)
        : 0,
      averageSize: this.storageStats.entryCount > 0 
        ? this.storageStats.totalSize / this.storageStats.entryCount 
        : 0
    };
  }

  // Obter todas as chaves
  getAllKeys(): string[] {
    const keys: string[] = [];
    const prefix = this.getStoragePrefix();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  // Exportar dados (para backup/sync)
  async export(): Promise<Array<{ key: string; data: any; timestamp: number }>> {
    const exported: Array<{ key: string; data: any; timestamp: number }> = [];
    const keys = this.getAllKeys();
    
    for (const storageKey of keys) {
      try {
        const rawData = localStorage.getItem(storageKey);
        if (rawData) {
          const entry: StorageEntry = JSON.parse(rawData);
          const data = this.deserializeData(entry.data);
          exported.push({
            key: this.getOriginalKey(storageKey),
            data,
            timestamp: entry.timestamp
          });
        }
      } catch (error) {
        console.error('Error exporting cache entry:', error);
      }
    }
    
    return exported;
  }

  // Importar dados
  async import(data: Array<{ key: string; data: any; timestamp?: number }>): Promise<number> {
    let imported = 0;
    
    for (const item of data) {
      try {
        await this.set(item.key, item.data);
        imported++;
      } catch (error) {
        console.error('Error importing cache entry:', error);
      }
    }
    
    return imported;
  }

  // Comprimir dados grandes
  private serializeData(data: any): string {
    const json = JSON.stringify(data);
    
    if (this.config.compression && json.length > 1024) {
      // Em produção, usar library como lz-string para compressão
      // return LZString.compressToUTF16(json);
      return json;
    }
    
    return json;
  }

  // Deserializar dados
  private deserializeData(serializedData: string): any {
    try {
      // Em produção, verificar se é compressão
      // if (this.config.compression && serializedData.length > 1024) {
      //   return JSON.parse(LZString.decompressFromUTF16(serializedData));
      // }
      
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error deserializing cache data:', error);
      return null;
    }
  }

  // Calcular tamanho dos dados
  private calculateSize(data: string): number {
    // Estimar tamanho em bytes (UTF-16 = 2 bytes por caractere)
    return data.length * 2 + 200; // +200 para overhead do JSON e entry
  }

  // Verificar se tem espaço
  private hasSpace(requiredSize: number): boolean {
    return this.storageStats.totalSize + requiredSize <= this.config.maxSize;
  }

  // Fazer espaço removendo entradas antigas (LRU)
  private async makeSpace(requiredSize: number): Promise<void> {
    // Obter todas as entradas ordenadas por último acesso
    const entries = this.getAllEntriesSortedByAccess();
    
    let freedSpace = 0;
    for (const { key, entry } of entries) {
      if (freedSpace >= requiredSize) break;
      
      localStorage.removeItem(key);
      this.updateStorageStats(-entry.size, 0);
      freedSpace += entry.size;
    }

    // Se ainda não tem espaço, remover mais entradas
    if (freedSpace < requiredSize) {
      const remainingEntries = this.getAllEntriesSortedByAccess();
      const halfCount = Math.floor(remainingEntries.length / 2);
      
      for (let i = 0; i < halfCount && i < remainingEntries.length; i++) {
        const { key, entry } = remainingEntries[i];
        localStorage.removeItem(key);
        this.updateStorageStats(-entry.size, 0);
      }
    }
  }

  // Obter todas as entradas ordenadas por acesso
  private getAllEntriesSortedByAccess(): Array<{ key: string; entry: StorageEntry }> {
    const entries: Array<{ key: string; entry: StorageEntry }> = [];
    const keys = this.getAllKeys();
    
    for (const key of keys) {
      try {
        const entry = this.getEntry(key);
        if (entry) {
          entries.push({ key, entry });
        }
      } catch (error) {
        // Remover entrada corrompida
        localStorage.removeItem(key);
      }
    }
    
    return entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
  }

  // Verificar se entrada expirou
  private isExpired(entry: StorageEntry): boolean {
    // TTL de 1 hora por padrão para localStorage
    const maxAge = 60 * 60 * 1000; // 1 hora
    return (Date.now() - entry.timestamp) > maxAge;
  }

  // Atualizar estatísticas de acesso
  private updateAccessStats(storageKey: string, entry: StorageEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Error updating access stats:', error);
    }
  }

  // Obter entrada existente
  private getEntry(storageKey: string): StorageEntry | null {
    try {
      const rawData = localStorage.getItem(storageKey);
      return rawData ? JSON.parse(rawData) : null;
    } catch (error) {
      console.error('Error getting entry:', error);
      return null;
    }
  }

  // Obter tamanho de entrada existente
  private getExistingEntrySize(storageKey: string): number {
    const entry = this.getEntry(storageKey);
    return entry ? entry.size : 0;
  }

  // Atualizar estatísticas de storage
  private updateStorageStats(newSize: number, oldSize: number): void {
    this.storageStats.totalSize += (newSize - oldSize);
    
    if (newSize > oldSize) {
      this.storageStats.entryCount++;
    } else if (newSize < oldSize) {
      this.storageStats.entryCount = Math.max(0, this.storageStats.entryCount - 1);
    }
  }

  // Obter chave do localStorage
  private getStorageKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  // Obter prefixo do storage
  private getStoragePrefix(): string {
    return this.config.prefix;
  }

  // Obter chave original
  private getOriginalKey(storageKey: string): string {
    return storageKey.substring(this.config.prefix.length);
  }

  // Carregar estatísticas
  private loadStats(): void {
    try {
      const statsKey = `${this.config.prefix}stats`;
      const stored = localStorage.getItem(statsKey);
      if (stored) {
        const stats = JSON.parse(stored);
        this.storageStats = { ...this.storageStats, ...stats };
      }
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  }

  // Salvar estatísticas
  private saveStats(): void {
    try {
      const statsKey = `${this.config.prefix}stats`;
      localStorage.setItem(statsKey, JSON.stringify(this.storageStats));
    } catch (error) {
      console.error('Error saving storage stats:', error);
    }
  }

  // Cleanup periódico
  private startCleanupInterval(): void {
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  // Realizar cleanup
  private performCleanup(): void {
    const keys = this.getAllKeys();
    let cleanedCount = 0;
    let freedSpace = 0;

    for (const key of keys) {
      try {
        const entry = this.getEntry(key);
        if (!entry) {
          localStorage.removeItem(key);
          cleanedCount++;
          continue;
        }

        // Remover entradas expiradas
        if (this.isExpired(entry)) {
          localStorage.removeItem(key);
          this.updateStorageStats(-entry.size, 0);
          cleanedCount++;
          freedSpace += entry.size;
        }
      } catch (error) {
        // Remover entrada corrompida
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.debug(`LocalStorage cleanup: ${cleanedCount} entries removed, ${freedSpace} bytes freed`);
      this.saveStats();
    }
  }

  // Verificar espaço disponível
  getAvailableSpace(): number {
    return this.config.maxSize - this.storageStats.totalSize;
  }

  // Otimizar storage (reorganizar entradas)
  async optimize(): Promise<void> {
    const entries = this.getAllEntriesSortedByAccess();
    const optimized: Array<{ key: string; data: any; timestamp: number }> = [];

    // Exportar dados válidos
    for (const { key, entry } of entries) {
      try {
        const data = this.deserializeData(entry.data);
        if (data !== null) {
          optimized.push({
            key: this.getOriginalKey(key),
            data,
            timestamp: entry.timestamp
          });
        }
      } catch (error) {
        // Pular entrada corrompida
        localStorage.removeItem(key);
      }
    }

    // Limpar tudo
    await this.clear();

    // Reimportar dados otimizados
    for (const item of optimized) {
      await this.set(item.key, item.data);
    }

    console.log(`LocalStorage optimized: ${optimized.length} entries reimported`);
  }
}