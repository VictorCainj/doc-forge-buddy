/**
 * Sistema de cache persistente usando localStorage + memória
 * Otimizado para performance e compressão de dados
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
  version: string;
}

interface CacheOptions {
  expiresIn?: number; // Tempo de expiração em ms
  version?: string; // Versão do cache para invalidação
  compress?: boolean; // Comprimir dados grandes
}

const CACHE_VERSION = '1.0.0';
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB máximo
const STORAGE_PREFIX = 'dfb_cache_';

class PersistentCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Comprimir dados grandes usando JSON.stringify otimizado
   */
  private compress(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('Erro ao comprimir dados:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Descomprimir dados
   */
  private decompress<T>(compressed: string): T | null {
    try {
      return JSON.parse(compressed) as T;
    } catch (error) {
      console.warn('Erro ao descomprimir dados:', error);
      return null;
    }
  }

  /**
   * Obter chave formatada para localStorage
   */
  private getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  /**
   * Verificar se localStorage está disponível e tem espaço
   */
  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      // Testar escrita
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calcular tamanho aproximado em bytes
   */
  private getSize(value: string): number {
    return new Blob([value]).size;
  }

  /**
   * Limpar cache expirado do localStorage
   */
  private cleanupExpired(): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      const now = Date.now();

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            const entry = JSON.parse(window.localStorage.getItem(key) || '{}') as CacheEntry<any>;
            if (now - entry.timestamp > entry.expiresIn) {
              keysToRemove.push(key);
            }
          } catch {
            // Entrada inválida, remover
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn('Erro ao limpar cache expirado:', error);
    }
  }

  /**
   * Armazenar dados no cache (memória + localStorage)
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    const {
      expiresIn = this.defaultTTL,
      version = CACHE_VERSION,
      compress = true,
    } = options;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
      version,
    };

    // Cache em memória (sempre disponível)
    this.memoryCache.set(key, entry);

    // Cache no localStorage (se disponível)
    if (this.isStorageAvailable()) {
      try {
        const serialized = compress ? this.compress(entry) : JSON.stringify(entry);
        const size = this.getSize(serialized);

        // Verificar se não excede limite
        if (size > MAX_CACHE_SIZE) {
          console.warn(`Cache muito grande para ${key}: ${size} bytes`);
          return false;
        }

        window.localStorage.setItem(this.getStorageKey(key), serialized);
        return true;
      } catch (error) {
        // localStorage cheio ou outro erro
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          // Limpar cache expirado e tentar novamente
          this.cleanupExpired();
          try {
            const serialized = compress ? this.compress(entry) : JSON.stringify(entry);
            window.localStorage.setItem(this.getStorageKey(key), serialized);
            return true;
          } catch {
            // Falhou mesmo após limpeza
            console.warn('localStorage cheio, usando apenas cache em memória');
            return false;
          }
        }
        console.warn('Erro ao salvar no localStorage:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Recuperar dados do cache
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // Verificar cache em memória primeiro (mais rápido)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (now - memoryEntry.timestamp < memoryEntry.expiresIn) {
        return memoryEntry.data as T;
      } else {
        // Expirou, remover
        this.memoryCache.delete(key);
      }
    }

    // Verificar localStorage
    if (this.isStorageAvailable()) {
      try {
        const storageKey = this.getStorageKey(key);
        const stored = window.localStorage.getItem(storageKey);

        if (!stored) return null;

        const entry = this.decompress<CacheEntry<T>>(stored);
        if (!entry) return null;

        // Verificar expiração
        if (now - entry.timestamp > entry.expiresIn) {
          window.localStorage.removeItem(storageKey);
          return null;
        }

        // Verificar versão
        if (entry.version !== CACHE_VERSION) {
          window.localStorage.removeItem(storageKey);
          return null;
        }

        // Restaurar em memória para acesso rápido
        this.memoryCache.set(key, entry);

        return entry.data;
      } catch (error) {
        console.warn('Erro ao recuperar do localStorage:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Remover entrada do cache
   */
  delete(key: string): void {
    this.memoryCache.delete(key);

    if (this.isStorageAvailable()) {
      try {
        window.localStorage.removeItem(this.getStorageKey(key));
      } catch (error) {
        console.warn('Erro ao remover do localStorage:', error);
      }
    }
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.memoryCache.clear();

    if (this.isStorageAvailable()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      } catch (error) {
        console.warn('Erro ao limpar localStorage:', error);
      }
    }
  }

  /**
   * Limpar apenas cache expirado
   */
  cleanup(): void {
    const now = Date.now();

    // Limpar memória
    const memoryKeysToDelete: string[] = [];
    this.memoryCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiresIn) {
        memoryKeysToDelete.push(key);
      }
    });
    memoryKeysToDelete.forEach((key) => this.memoryCache.delete(key));

    // Limpar localStorage
    this.cleanupExpired();
  }

  /**
   * Obter todas as chaves do cache
   */
  keys(): string[] {
    const keys: string[] = [];

    // Chaves da memória
    this.memoryCache.forEach((_, key) => keys.push(key));

    // Chaves do localStorage
    if (this.isStorageAvailable()) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            const cleanKey = key.replace(STORAGE_PREFIX, '');
            if (!keys.includes(cleanKey)) {
              keys.push(cleanKey);
            }
          }
        }
      } catch (error) {
        console.warn('Erro ao obter chaves do localStorage:', error);
      }
    }

    return keys;
  }

  /**
   * Verificar se chave existe e está válida
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Instância singleton
export const persistentCache = new PersistentCache();

// Limpeza automática a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    persistentCache.cleanup();
  }, 10 * 60 * 1000);

  // Limpar ao carregar página
  persistentCache.cleanup();
}

