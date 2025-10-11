import { log } from './logger';

export interface Fact {
  id: string;
  statement: string;
  source: string;
  confidence: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface FactCheckResult {
  isConsistent: boolean;
  conflicts: Fact[];
  confidence: number;
  explanation: string;
}

/**
 * Repositório de fatos em memória (pode ser persistido)
 */
class FactRepository {
  private facts: Map<string, Fact[]> = new Map();

  /**
   * Adiciona um fato ao repositório
   */
  addFact(userId: string, fact: Fact): void {
    if (!this.facts.has(userId)) {
      this.facts.set(userId, []);
    }

    const userFacts = this.facts.get(userId)!;
    userFacts.push(fact);

    // Manter apenas os últimos 1000 fatos por usuário
    if (userFacts.length > 1000) {
      userFacts.shift();
    }

    log.debug('Fato adicionado', { userId, factId: fact.id });
  }

  /**
   * Busca fatos relacionados a um tópico
   */
  findRelatedFacts(userId: string, query: string, limit: number = 10): Fact[] {
    const userFacts = this.facts.get(userId) || [];

    // Busca simples por palavras-chave
    const queryWords = query.toLowerCase().split(/\s+/);

    return userFacts
      .filter((fact) => {
        const factText = fact.statement.toLowerCase();
        return queryWords.some((word) => factText.includes(word));
      })
      .slice(-limit);
  }

  /**
   * Obtém todos os fatos de um usuário
   */
  getAllFacts(userId: string): Fact[] {
    return this.facts.get(userId) || [];
  }

  /**
   * Remove fatos antigos (mais de 90 dias)
   */
  cleanOldFacts(userId: string): void {
    const userFacts = this.facts.get(userId) || [];
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const filtered = userFacts.filter((fact) => fact.timestamp > ninetyDaysAgo);
    this.facts.set(userId, filtered);

    log.debug('Fatos antigos removidos', {
      userId,
      removed: userFacts.length - filtered.length,
    });
  }
}

// Instância global do repositório
const factRepository = new FactRepository();

/**
 * Extrai fatos de uma resposta da IA
 */
export function extractFactsFromResponse(
  response: string,
  source: string = 'ai_response'
): Fact[] {
  const facts: Fact[] = [];

  // Identificar afirmações factuais (heurística simples)
  const sentences = response
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 10);

  sentences.forEach((sentence, idx) => {
    const trimmed = sentence.trim();

    // Detectar afirmações factuais (contém números, datas, nomes próprios)
    const hasNumbers = /\d+/.test(trimmed);
    const hasProperNouns = /[A-Z][a-z]+/.test(trimmed);
    const hasDateIndicators = /(em|de|até|desde|durante)/i.test(trimmed);

    if (hasNumbers || (hasProperNouns && hasDateIndicators)) {
      facts.push({
        id: `fact_${Date.now()}_${idx}`,
        statement: trimmed,
        source,
        confidence: 0.7,
        timestamp: new Date(),
      });
    }
  });

  return facts;
}

/**
 * Verifica consistência de uma nova afirmação com fatos anteriores
 */
export function checkFactConsistency(
  userId: string,
  newStatement: string,
  _context: string = ''
): FactCheckResult {
  const relatedFacts = factRepository.findRelatedFacts(userId, newStatement);

  if (relatedFacts.length === 0) {
    return {
      isConsistent: true,
      conflicts: [],
      confidence: 0.5,
      explanation: 'Nenhum fato relacionado encontrado para comparação',
    };
  }

  // Detectar contradições simples (palavras opostas)
  const contradictionPairs = [
    ['sim', 'não'],
    ['verdade', 'falso'],
    ['correto', 'incorreto'],
    ['existe', 'não existe'],
    ['tem', 'não tem'],
  ];

  const conflicts: Fact[] = [];
  const newLower = newStatement.toLowerCase();

  relatedFacts.forEach((fact) => {
    const factLower = fact.statement.toLowerCase();

    contradictionPairs.forEach(([word1, word2]) => {
      if (
        (newLower.includes(word1) && factLower.includes(word2)) ||
        (newLower.includes(word2) && factLower.includes(word1))
      ) {
        conflicts.push(fact);
      }
    });
  });

  const isConsistent = conflicts.length === 0;

  return {
    isConsistent,
    conflicts,
    confidence: isConsistent ? 0.8 : 0.3,
    explanation: isConsistent
      ? 'Afirmação consistente com fatos anteriores'
      : `Possível contradição com ${conflicts.length} fato(s) anterior(es)`,
  };
}

/**
 * Salva fatos de uma resposta
 */
export function saveFactsFromResponse(
  userId: string,
  response: string,
  source: string = 'ai_response'
): void {
  const facts = extractFactsFromResponse(response, source);

  facts.forEach((fact) => {
    factRepository.addFact(userId, fact);
  });

  log.debug('Fatos salvos', { userId, count: facts.length });
}

/**
 * Obtém estatísticas de fatos
 */
export function getFactStats(userId: string): {
  totalFacts: number;
  recentFacts: number;
  oldestFact: Date | null;
} {
  const allFacts = factRepository.getAllFacts(userId);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentFacts = allFacts.filter((f) => f.timestamp > sevenDaysAgo);
  const oldestFact = allFacts.length > 0 ? allFacts[0].timestamp : null;

  return {
    totalFacts: allFacts.length,
    recentFacts: recentFacts.length,
    oldestFact,
  };
}

// Exportar repositório para uso direto se necessário
export { factRepository };
