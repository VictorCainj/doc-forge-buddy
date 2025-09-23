import { analyzeContractsWithAI } from './openai';

export interface TextAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  suggestions: string[];
  improvements: string[];
  readabilityScore: number;
  complexity: 'simple' | 'moderate' | 'complex';
  tone: 'formal' | 'informal' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  context: string;
  keywords: string[];
  entities: string[];
}

export interface DocumentType {
  type: 'contract' | 'email' | 'report' | 'communication' | 'legal' | 'general';
  confidence: number;
  suggestions: string[];
}

// Análise de sentimento básica
export const analyzeSentiment = (
  text: string
): { sentiment: 'positive' | 'negative' | 'neutral'; confidence: number } => {
  const positiveWords = [
    'excelente',
    'ótimo',
    'bom',
    'perfeito',
    'fantástico',
    'maravilhoso',
    'incrível',
    'satisfeito',
    'feliz',
    'conteúdo',
    'agradecido',
    'obrigado',
    'obrigada',
    'sucesso',
    'conquista',
    'vitória',
    'ganho',
    'benefício',
    'vantagem',
    'recomendo',
    'aprovado',
    'aceito',
    'concordo',
    'confirmo',
  ];

  const negativeWords = [
    'ruim',
    'terrível',
    'horrível',
    'péssimo',
    'decepcionante',
    'frustrante',
    'insatisfeito',
    'infeliz',
    'triste',
    'preocupado',
    'angustiado',
    'problema',
    'erro',
    'falha',
    'dificuldade',
    'complicado',
    'confuso',
    'rejeito',
    'negado',
    'recusado',
    'cancelado',
    'suspenso',
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  const total = words.length;
  const positiveRatio = positiveCount / total;
  const negativeRatio = negativeCount / total;

  if (positiveRatio > negativeRatio && positiveRatio > 0.05) {
    return {
      sentiment: 'positive',
      confidence: Math.min(positiveRatio * 10, 1),
    };
  } else if (negativeRatio > positiveRatio && negativeRatio > 0.05) {
    return {
      sentiment: 'negative',
      confidence: Math.min(negativeRatio * 10, 1),
    };
  } else {
    return { sentiment: 'neutral', confidence: 0.5 };
  }
};

// Análise de urgência
export const analyzeUrgency = (text: string): 'low' | 'medium' | 'high' => {
  const urgentWords = [
    'urgente',
    'imediato',
    'emergência',
    'crítico',
    'asap',
    'hoje',
    'agora',
    'já',
    'rápido',
    'pressa',
    'deadline',
    'prazo',
    'atraso',
    'problema',
    'erro',
    'falha',
    'quebrado',
  ];

  const textLower = text.toLowerCase();
  const urgentCount = urgentWords.filter((word) =>
    textLower.includes(word)
  ).length;

  if (urgentCount >= 3) return 'high';
  if (urgentCount >= 1) return 'medium';
  return 'low';
};

// Análise de tom
export const analyzeTone = (
  text: string
): 'formal' | 'informal' | 'neutral' => {
  const formalWords = [
    'solicito',
    'requer',
    'necessário',
    'obrigatório',
    'conforme',
    'mediante',
    'através',
    'portanto',
    'desta forma',
    'assim sendo',
    'cordialmente',
    'atenciosamente',
    'respeitosamente',
  ];

  const informalWords = [
    'oi',
    'olá',
    'e aí',
    'beleza',
    'tranquilo',
    'legal',
    'bacana',
    'tipo',
    'assim',
    'né',
    'tá',
    'pra',
    'vc',
    'vou',
    'tô',
  ];

  const textLower = text.toLowerCase();
  const formalCount = formalWords.filter((word) =>
    textLower.includes(word)
  ).length;
  const informalCount = informalWords.filter((word) =>
    textLower.includes(word)
  ).length;

  if (formalCount > informalCount) return 'formal';
  if (informalCount > formalCount) return 'informal';
  return 'neutral';
};

// Análise de complexidade
export const analyzeComplexity = (
  text: string
): 'simple' | 'moderate' | 'complex' => {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/);
  const complexWords = words.filter((word) => word.length > 6);

  const avgWordsPerSentence = words.length / sentences.length;
  const complexWordRatio = complexWords.length / words.length;

  if (avgWordsPerSentence > 20 || complexWordRatio > 0.3) return 'complex';
  if (avgWordsPerSentence > 10 || complexWordRatio > 0.15) return 'moderate';
  return 'simple';
};

// Análise de legibilidade
export const calculateReadabilityScore = (text: string): number => {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/);
  const syllables = words.reduce(
    (total, word) => total + countSyllables(word),
    0
  );

  if (sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Fórmula simplificada de legibilidade
  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, score));
};

// Contar sílabas (aproximação)
const countSyllables = (word: string): number => {
  const vowels = 'aeiouáéíóúâêîôûàèìòùãõ';
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i].toLowerCase());
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  return Math.max(1, count);
};

// Extrair palavras-chave
export const extractKeywords = (text: string): string[] => {
  const stopWords = [
    'a',
    'o',
    'e',
    'de',
    'do',
    'da',
    'em',
    'para',
    'com',
    'por',
    'sobre',
    'que',
    'se',
    'não',
    'mais',
    'como',
    'mas',
    'ou',
    'quando',
    'onde',
    'porque',
    'então',
    'assim',
    'também',
    'muito',
    'pouco',
    'bem',
    'mal',
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word));

  const wordCount: { [key: string]: number } = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

// Extrair entidades (nomes, lugares, etc.)
export const extractEntities = (text: string): string[] => {
  const entities: string[] = [];

  // Padrões para identificar entidades
  const patterns = [
    /[A-Z][a-z]+ [A-Z][a-z]+/g, // Nomes próprios
    /Rua [A-Z][a-z]+/g, // Endereços
    /\d{5}-?\d{3}/g, // CEPs
    /\(\d{2}\) \d{4,5}-?\d{4}/g, // Telefones
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Emails
    /contrato \d+/gi, // Números de contrato
  ];

  patterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      entities.push(...matches);
    }
  });

  return [...new Set(entities)]; // Remove duplicatas
};

// Análise completa de texto
export const analyzeTextAdvanced = async (
  text: string
): Promise<TextAnalysisResult> => {
  const sentiment = analyzeSentiment(text);
  const urgency = analyzeUrgency(text);
  const tone = analyzeTone(text);
  const complexity = analyzeComplexity(text);
  const readabilityScore = calculateReadabilityScore(text);
  const keywords = extractKeywords(text);
  const entities = extractEntities(text);

  // Gerar sugestões baseadas na análise
  const suggestions: string[] = [];
  const improvements: string[] = [];

  if (readabilityScore < 30) {
    suggestions.push(
      'Considere simplificar as frases para melhorar a legibilidade'
    );
    improvements.push('Use frases mais curtas e vocabulário mais simples');
  }

  if (complexity === 'complex' && urgency === 'high') {
    suggestions.push(
      'Para mensagens urgentes, considere usar linguagem mais direta'
    );
    improvements.push(
      'Simplifique a estrutura para transmitir a mensagem rapidamente'
    );
  }

  if (tone === 'informal' && urgency === 'high') {
    suggestions.push('Para assuntos urgentes, considere um tom mais formal');
  }

  if (sentiment.sentiment === 'negative') {
    suggestions.push('Considere reformular para um tom mais positivo');
    improvements.push('Use linguagem mais construtiva e soluções orientadas');
  }

  return {
    sentiment: sentiment.sentiment,
    confidence: sentiment.confidence,
    suggestions,
    improvements,
    readabilityScore,
    complexity,
    tone,
    urgency,
    context: determineContext(text),
    keywords,
    entities,
  };
};

// Determinar contexto do texto
const determineContext = (text: string): string => {
  const contractKeywords = [
    'contrato',
    'locação',
    'imóvel',
    'locador',
    'locatário',
  ];
  const emailKeywords = ['email', 'enviar', 'mensagem', 'comunicar'];
  const legalKeywords = ['lei', 'artigo', 'código', 'jurídico', 'legal'];
  const reportKeywords = ['relatório', 'análise', 'dados', 'estatística'];

  const textLower = text.toLowerCase();

  if (contractKeywords.some((keyword) => textLower.includes(keyword))) {
    return 'contract';
  } else if (emailKeywords.some((keyword) => textLower.includes(keyword))) {
    return 'email';
  } else if (legalKeywords.some((keyword) => textLower.includes(keyword))) {
    return 'legal';
  } else if (reportKeywords.some((keyword) => textLower.includes(keyword))) {
    return 'report';
  }

  return 'general';
};

// Gerar sugestões inteligentes baseadas no contexto
export const generateContextualSuggestions = (
  analysis: TextAnalysisResult
): string[] => {
  const suggestions: string[] = [];

  switch (analysis.context) {
    case 'contract':
      suggestions.push('Considere incluir cláusulas de rescisão claras');
      suggestions.push('Verifique se todas as datas estão corretas');
      suggestions.push('Confirme se os valores estão atualizados');
      break;
    case 'email':
      suggestions.push('Use uma saudação apropriada');
      suggestions.push('Estruture o conteúdo de forma clara');
      suggestions.push('Inclua uma despedida formal');
      break;
    case 'legal':
      suggestions.push('Verifique a conformidade com a legislação vigente');
      suggestions.push('Considere consultar um advogado');
      break;
    case 'report':
      suggestions.push('Use dados quantitativos quando possível');
      suggestions.push('Inclua conclusões e recomendações');
      break;
  }

  return suggestions;
};

// Análise de documentos contratuais específica
export const analyzeContractDocument = async (
  text: string,
  contracts: any[]
): Promise<{
  completeness: number;
  missingFields: string[];
  suggestions: string[];
  riskAssessment: 'low' | 'medium' | 'high';
}> => {
  const requiredFields = [
    'número do contrato',
    'data',
    'locador',
    'locatário',
    'endereço',
    'valor',
    'prazo',
    'condições',
    'assinatura',
  ];

  const textLower = text.toLowerCase();
  const foundFields = requiredFields.filter(
    (field) =>
      textLower.includes(field) || textLower.includes(field.replace(' ', ''))
  );

  const completeness = (foundFields.length / requiredFields.length) * 100;
  const missingFields = requiredFields.filter(
    (field) =>
      !textLower.includes(field) && !textLower.includes(field.replace(' ', ''))
  );

  const suggestions: string[] = [];
  if (completeness < 70) {
    suggestions.push(
      'Documento incompleto - inclua todos os campos obrigatórios'
    );
  }
  if (missingFields.includes('data')) {
    suggestions.push('Inclua a data de assinatura do contrato');
  }
  if (missingFields.includes('valor')) {
    suggestions.push(
      'Especifique claramente os valores e condições de pagamento'
    );
  }

  let riskAssessment: 'low' | 'medium' | 'high' = 'low';
  if (completeness < 50) riskAssessment = 'high';
  else if (completeness < 80) riskAssessment = 'medium';

  return {
    completeness,
    missingFields,
    suggestions,
    riskAssessment,
  };
};
