/**
 * Gerenciador de cache híbrido (memória + localStorage)
 * Usa persistentCache para persistência e cacheManager para velocidade
 */

import { persistentCache } from './persistentCache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly PERSISTENT_TTL = 15 * 60 * 1000; // 15 minutos para localStorage

  /**
   * Armazena dados no cache (memória + localStorage)
   */
  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_TTL): void {
    // Cache em memória (rápido)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });

    // Cache persistente (para dados importantes)
    if (expiresIn >= this.PERSISTENT_TTL) {
      persistentCache.set(key, data, {
        expiresIn: this.PERSISTENT_TTL,
      });
    }
  }

  /**
   * Recupera dados do cache (memória primeiro, depois localStorage)
   */
  get<T>(key: string): T | null {
    // Tentar cache em memória primeiro (mais rápido)
    const entry = this.cache.get(key);
    
    if (entry) {
      const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
      
      if (!isExpired) {
        return entry.data as T;
      } else {
        this.cache.delete(key);
      }
    }

    // Tentar cache persistente
    const persistentData = persistentCache.get<T>(key);
    if (persistentData) {
      // Restaurar em memória para acesso rápido
      this.cache.set(key, {
        data: persistentData,
        timestamp: Date.now(),
        expiresIn: this.DEFAULT_TTL,
      });
      return persistentData;
    }

    return null;
  }

  /**
   * Remove entrada do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    persistentCache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    persistentCache.clear();
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiresIn) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    persistentCache.cleanup();
  }
}

// Instância singleton
export const cacheManager = new CacheManager();

// Cleanup automático a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup();
  }, 10 * 60 * 1000);
}
