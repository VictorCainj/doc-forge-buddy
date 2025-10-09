import { generateEmbedding } from './embeddingService';
import { log } from './logger';

interface SemanticCacheEntry {
  id: string;
  query: string;
  response: string;
  embedding: number[];
  timestamp: Date;
  usageCount: number;
  lastUsed: Date;
  context?: string;
  metadata?: Record<string, unknown>;
}

interface CacheSearchResult {
  entry: SemanticCacheEntry;
  similarity: number;
}

/**
 * Cache semântico avançado usando embeddings
 */
export class SemanticCache {
  private cache: Map<string, SemanticCacheEntry> = new Map();
  private readonly MAX_ENTRIES = 500;
  private readonly MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 horas
  private readonly SIMILARITY_THRESHOLD = 0.85; // Limiar de similaridade

  constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Adiciona entrada ao cache com embedding
   */
  async set(
    query: string,
    response: string,
    options: {
      context?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<void> {
    try {
      // Gerar embedding da query
      const { embedding } = await generateEmbedding(query);

      const entry: SemanticCacheEntry = {
        id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        response,
        embedding,
        timestamp: new Date(),
        usageCount: 0,
        lastUsed: new Date(),
        context: options.context,
        metadata: options.metadata,
      };

      this.cache.set(entry.id, entry);

      // Limpar cache se exceder limite
      if (this.cache.size > this.MAX_ENTRIES) {
        this.evictOldest();
      }

      this.saveToStorage();
      log.debug('Entrada adicionada ao cache semântico', { id: entry.id });
    } catch (error) {
      log.error('Erro ao adicionar ao cache semântico', error);
    }
  }

  /**
   * Busca entrada similar no cache
   */
  async get(query: string, context?: string): Promise<string | null> {
    try {
      // Gerar embedding da query
      const { embedding: queryEmbedding } = await generateEmbedding(query);

      // Buscar entrada mais similar
      let bestMatch: CacheSearchResult | null = null;
      let highestSimilarity = 0;

      for (const entry of this.cache.values()) {
        // Calcular similaridade de cosseno
        const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);

        // Considerar contexto se fornecido
        const contextMatch = !context || !entry.context || entry.context === context;

        if (similarity > highestSimilarity && contextMatch && similarity >= this.SIMILARITY_THRESHOLD) {
          highestSimilarity = similarity;
          bestMatch = { entry, similarity };
        }
      }

      if (bestMatch) {
        // Atualizar estatísticas de uso
        bestMatch.entry.usageCount++;
        bestMatch.entry.lastUsed = new Date();
        this.saveToStorage();

        log.debug('Cache hit semântico', {
          similarity: bestMatch.similarity,
          query,
          cachedQuery: bestMatch.entry.query,
        });

        return bestMatch.entry.response;
      }

      return null;
    } catch (error) {
      log.error('Erro ao buscar no cache semântico', error);
      return null;
    }
  }

  /**
   * Calcula similaridade de cosseno entre dois vetores
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Invalida cache baseado em contexto
   */
  invalidateByContext(context: string): void {
    let removed = 0;
    
    for (const [id, entry] of this.cache.entries()) {
      if (entry.context === context) {
        this.cache.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveToStorage();
      log.debug('Entradas invalidadas por contexto', { context, removed });
    }
  }

  /**
   * Remove entradas mais antigas
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por último uso e remover as mais antigas
    entries.sort((a, b) => a[1].lastUsed.getTime() - b[1].lastUsed.getTime());
    
    const toRemove = Math.floor(this.MAX_ENTRIES * 0.1); // Remover 10%
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }

    log.debug('Entradas antigas removidas do cache', { removed: toRemove });
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > this.MAX_AGE_MS) {
        this.cache.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveToStorage();
      log.debug('Cache cleanup executado', { removed });
    }
  }

  /**
   * Inicia timer de limpeza
   */
  private startCleanupTimer(): void {
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // 1 hora
  }

  /**
   * Salva cache no localStorage
   */
  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries());
      const serialized = JSON.stringify(entries);
      localStorage.setItem('semantic_cache', serialized);
    } catch (error) {
      log.error('Erro ao salvar cache no storage', error);
    }
  }

  /**
   * Carrega cache do localStorage
   */
  private loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem('semantic_cache');
      if (serialized) {
        const entries = JSON.parse(serialized);
        this.cache = new Map(
          entries.map(([id, entry]: [string, any]) => [
            id,
            {
              ...entry,
              timestamp: new Date(entry.timestamp),
              lastUsed: new Date(entry.lastUsed),
            },
          ])
        );
        log.debug('Cache semântico carregado', { entries: this.cache.size });
      }
    } catch (error) {
      log.error('Erro ao carregar cache do storage', error);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    totalEntries: number;
    totalUsage: number;
    avgUsagePerEntry: number;
    oldestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: this.cache.size,
      totalUsage: entries.reduce((sum, e) => sum + e.usageCount, 0),
      avgUsagePerEntry: entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.usageCount, 0) / entries.length 
        : 0,
      oldestEntry: entries.length > 0 
        ? new Date(Math.min(...entries.map(e => e.timestamp.getTime())))
        : null,
    };
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
    log.debug('Cache semântico limpo');
  }
}

// Instância global
export const semanticCache = new SemanticCache();
