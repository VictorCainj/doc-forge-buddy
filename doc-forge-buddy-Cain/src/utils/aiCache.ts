import { log } from '@/utils/logger';

interface CacheEntry {
  id: string;
  input: string;
  output: string;
  mode: 'normal' | 'intelligent' | 'analysis' | 'conversational';
  timestamp: Date;
  usageCount: number;
  lastUsed: Date;
  confidence: number;
  metadata?: Record<string, unknown>;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

class AICache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_ENTRIES = 1000;
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  // Gerar chave de cache baseada no input e modo
  private generateKey(input: string, mode: string): string {
    // Normalizar input para melhor cache hit
    const normalizedInput = input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');

    return `${mode}:${normalizedInput}`;
  }

  // Verificar se entrada é similar (para cache fuzzy)
  private isSimilar(
    input1: string,
    input2: string,
    threshold: number = 0.8
  ): boolean {
    const normalize = (str: string) =>
      str.toLowerCase().trim().replace(/\s+/g, ' ');

    const norm1 = normalize(input1);
    const norm2 = normalize(input2);

    // Verificação exata
    if (norm1 === norm2) return true;

    // Verificação de similaridade simples (Levenshtein distance)
    const distance = this.levenshteinDistance(norm1, norm2);
    const similarity = 1 - distance / Math.max(norm1.length, norm2.length);

    return similarity >= threshold;
  }

  // Calcular distância de Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Obter entrada do cache
  get(
    input: string,
    mode: 'normal' | 'intelligent' | 'analysis' | 'conversational'
  ): CacheEntry | null {
    const key = this.generateKey(input, mode);
    const entry = this.cache.get(key);

    if (!entry) {
      // Tentar busca fuzzy
      return this.fuzzySearch(input, mode);
    }

    // Verificar se entrada não expirou
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de uso
    entry.usageCount++;
    entry.lastUsed = new Date();

    log.debug(`Cache hit para: ${input.substring(0, 50)}...`);
    return entry;
  }

  // Busca fuzzy no cache
  private fuzzySearch(input: string, mode: string): CacheEntry | null {
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0.7; // Threshold mínimo

    for (const entry of this.cache.values()) {
      if (entry.mode !== mode) continue;
      if (this.isExpired(entry)) continue;

      if (this.isSimilar(input, entry.input, 0.85)) {
        const similarity = this.calculateSimilarity(input, entry.input);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = entry;
        }
      }
    }

    if (bestMatch) {
      bestMatch.usageCount++;
      bestMatch.lastUsed = new Date();
      log.debug(
        `Cache fuzzy hit (${Math.round(bestSimilarity * 100)}%) para: ${input.substring(0, 50)}...`
      );
    }

    return bestMatch;
  }

  // Calcular similaridade entre duas strings
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / Math.max(str1.length, str2.length);
  }

  // Adicionar entrada ao cache
  set(
    input: string,
    output: string,
    mode: 'normal' | 'intelligent' | 'analysis' | 'conversational',
    confidence: number = 0.9,
    metadata?: Record<string, unknown>
  ): void {
    const key = this.generateKey(input, mode);

    const entry: CacheEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      input,
      output,
      mode,
      timestamp: new Date(),
      usageCount: 1,
      lastUsed: new Date(),
      confidence,
      metadata,
    };

    this.cache.set(key, entry);

    // Verificar limite de entradas
    if (this.cache.size > this.MAX_ENTRIES) {
      this.evictLeastUsed();
    }

    this.saveToStorage();
    log.debug(`Cache entry adicionada para: ${input.substring(0, 50)}...`);
  }

  // Verificar se entrada expirou
  private isExpired(entry: CacheEntry): boolean {
    const now = new Date();
    return now.getTime() - entry.timestamp.getTime() > this.MAX_AGE_MS;
  }

  // Remover entradas menos usadas
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      // Ordenar por uso e depois por idade
      const scoreA =
        a[1].usageCount -
        (Date.now() - a[1].lastUsed.getTime()) / (1000 * 60 * 60);
      const scoreB =
        b[1].usageCount -
        (Date.now() - b[1].lastUsed.getTime()) / (1000 * 60 * 60);
      return scoreA - scoreB;
    });

    // Remover 10% das entradas menos usadas
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    log.debug(`Removidas ${toRemove} entradas do cache`);
  }

  // Limpar cache expirado
  private cleanup(): void {
    const _now = new Date();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      log.debug(
        `Limpeza do cache: ${removedCount} entradas expiradas removidas`
      );
      this.saveToStorage();
    }
  }

  // Iniciar timer de limpeza
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  // Parar timer de limpeza
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Obter estatísticas do cache
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const _now = new Date();

    return {
      totalEntries: entries.length,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.calculateMemoryUsage(),
      oldestEntry:
        entries.length > 0
          ? entries.reduce(
              (oldest, entry) =>
                entry.timestamp < oldest ? entry.timestamp : oldest,
              entries[0].timestamp
            )
          : null,
      newestEntry:
        entries.length > 0
          ? entries.reduce(
              (newest, entry) =>
                entry.timestamp > newest ? entry.timestamp : newest,
              entries[0].timestamp
            )
          : null,
    };
  }

  // Calcular taxa de hit (simplificado)
  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    const totalUses = entries.reduce((sum, entry) => sum + entry.usageCount, 0);
    const uniqueEntries = entries.length;

    return uniqueEntries > 0 ? totalUses / uniqueEntries : 0;
  }

  // Calcular uso de memória (aproximado)
  private calculateMemoryUsage(): number {
    const entries = Array.from(this.cache.values());
    return entries.reduce((total, entry) => {
      return (
        total +
        entry.input.length +
        entry.output.length +
        JSON.stringify(entry.metadata || {}).length
      );
    }, 0);
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
    log.debug('Cache limpo completamente');
  }

  // Salvar cache no localStorage
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('ai-cache', JSON.stringify(data));
    } catch (error) {
      log.error('Erro ao salvar cache no localStorage:', error);
    }
  }

  // Carregar cache do localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai-cache');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, entry] of data) {
          this.cache.set(key, {
            ...entry,
            timestamp: new Date(entry.timestamp),
            lastUsed: new Date(entry.lastUsed),
          });
        }
        log.debug(`Cache carregado: ${data.length} entradas`);
      }
    } catch (error) {
      log.error('Erro ao carregar cache do localStorage:', error);
    }
  }

  // Destruir instância
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

// Instância singleton
export const aiCache = new AICache();

// Função utilitária para usar o cache
export const getCachedResponse = (
  input: string,
  mode: 'normal' | 'intelligent' | 'analysis' | 'conversational'
): string | null => {
  const cached = aiCache.get(input, mode);
  return cached ? cached.output : null;
};

export const setCachedResponse = (
  input: string,
  output: string,
  mode: 'normal' | 'intelligent' | 'analysis' | 'conversational',
  confidence?: number,
  metadata?: Record<string, unknown>
): void => {
  aiCache.set(input, output, mode, confidence, metadata);
};

export const clearAICache = (): void => {
  aiCache.clear();
};

export const getCacheStats = (): CacheStats => {
  return aiCache.getStats();
};
