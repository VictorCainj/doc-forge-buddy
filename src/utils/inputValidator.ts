// @ts-nocheck
import { log } from '@/utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedInput: string;
  metadata: {
    length: number;
    wordCount: number;
    language: string;
    containsSpecialChars: boolean;
    containsNumbers: boolean;
    estimatedProcessingTime: number; // em segundos
  };
}

export interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  maxWords?: number;
  minWords?: number;
  allowedLanguages?: string[];
  blockHtml?: boolean;
  blockScripts?: boolean;
  requireText?: boolean;
  sanitizeHtml?: boolean;
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxLength: 5000,
  minLength: 1,
  maxWords: 1000,
  minWords: 1,
  allowedLanguages: ['pt-BR', 'pt', 'en'],
  blockHtml: true,
  blockScripts: true,
  requireText: true,
  sanitizeHtml: true,
};

// Padrões para detecção de conteúdo malicioso
const MALICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<style\b[^>]*>/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
];

// Padrões para detecção de spam
const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Caracteres repetidos (ex: aaaaa)
  /[A-Z]{10,}/g, // Muitas maiúsculas
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{5,}/g, // Muitos símbolos
  /\b(?:free|gratis|urgente|importante|clique|aqui|agora)\b.{0,50}\b(?:free|gratis|urgente|importante|clique|aqui|agora)\b/gi, // Palavras de spam
];

// Palavras proibidas ou inadequadas (básico)
const INAPPROPRIATE_WORDS = [
  // Adicionar palavras conforme necessário
];

// Detectar idioma do texto (simplificado)
const detectLanguage = (text: string): string => {
  const portugueseWords = [
    'o',
    'a',
    'os',
    'as',
    'um',
    'uma',
    'de',
    'da',
    'do',
    'das',
    'dos',
    'em',
    'na',
    'no',
    'nas',
    'nos',
    'para',
    'com',
    'por',
    'sobre',
    'entre',
    'através',
    'durante',
    'após',
    'antes',
    'que',
    'quando',
    'onde',
    'como',
    'porque',
    'então',
    'mas',
    'ou',
    'e',
    'se',
    'não',
    'são',
    'foi',
    'será',
    'tem',
    'ter',
    'fazer',
    'dizer',
    'ver',
    'ir',
    'vir',
    'dar',
    'saber',
    'poder',
    'querer',
  ];
  const englishWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'up',
    'about',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'between',
    'among',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'shall',
  ];

  const words = text.toLowerCase().split(/\s+/);
  const portugueseCount = words.filter((word) =>
    portugueseWords.includes(word)
  ).length;
  const englishCount = words.filter((word) =>
    englishWords.includes(word)
  ).length;

  if (portugueseCount > englishCount) return 'pt-BR';
  if (englishCount > portugueseCount) return 'en';
  return 'unknown';
};

// Sanitizar HTML
const sanitizeHtml = (text: string): string => {
  // Remover tags HTML perigosas
  let sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<style\b[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '');

  // Se não permitir HTML, remover todas as tags
  if (DEFAULT_OPTIONS.blockHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  return sanitized;
};

// Remover caracteres especiais excessivos
const normalizeSpecialChars = (text: string): string => {
  return text
    .replace(/(.)\1{3,}/g, '$1$1$1') // Limitar repetições
    .replace(/[^\w\s\p{L}\p{N}\p{P}]/gu, '') // Manter apenas caracteres válidos
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim();
};

// Validar entrada do usuário
export const validateInput = (
  input: string,
  options: ValidationOptions = {}
): ValidationResult => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  // Sanitização básica
  let sanitizedInput = input.trim();

  // Verificar se há conteúdo
  if (opts.requireText && !sanitizedInput) {
    errors.push('Texto é obrigatório');
    return {
      isValid: false,
      errors,
      warnings,
      sanitizedInput: '',
      metadata: {
        length: 0,
        wordCount: 0,
        language: 'unknown',
        containsSpecialChars: false,
        containsNumbers: false,
        estimatedProcessingTime: 0,
      },
    };
  }

  // Sanitizar HTML se necessário
  if (opts.sanitizeHtml) {
    sanitizedInput = sanitizeHtml(sanitizedInput);
  }

  // Verificar padrões maliciosos
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(sanitizedInput)) {
      errors.push('Conteúdo potencialmente malicioso detectado');
      log.warn(
        'Conteúdo malicioso detectado:',
        sanitizedInput.substring(0, 100)
      );
      break;
    }
  }

  // Verificar padrões de spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(sanitizedInput)) {
      warnings.push('Possível conteúdo de spam detectado');
      break;
    }
  }

  // Verificar palavras inadequadas
  const lowerInput = sanitizedInput.toLowerCase();
  for (const word of INAPPROPRIATE_WORDS) {
    if (lowerInput.includes(word.toLowerCase())) {
      warnings.push('Conteúdo pode ser inadequado');
      break;
    }
  }

  // Normalizar caracteres especiais
  sanitizedInput = normalizeSpecialChars(sanitizedInput);

  // Verificar comprimento
  if (sanitizedInput.length > opts.maxLength) {
    errors.push(`Texto muito longo (máximo ${opts.maxLength} caracteres)`);
  }

  if (sanitizedInput.length < opts.minLength) {
    errors.push(`Texto muito curto (mínimo ${opts.minLength} caracteres)`);
  }

  // Contar palavras
  const words = sanitizedInput.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  if (wordCount > opts.maxWords) {
    errors.push(`Muitas palavras (máximo ${opts.maxWords})`);
  }

  if (wordCount < opts.minWords) {
    errors.push(`Poucas palavras (mínimo ${opts.minWords})`);
  }

  // Detectar idioma
  const language = detectLanguage(sanitizedInput);
  if (!opts.allowedLanguages.includes(language) && language !== 'unknown') {
    warnings.push(
      `Idioma detectado: ${language} (permitidos: ${opts.allowedLanguages.join(', ')})`
    );
  }

  // Análise de metadados
  const containsSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
    sanitizedInput
  );
  const containsNumbers = /\d/.test(sanitizedInput);

  // Estimar tempo de processamento (baseado no comprimento e complexidade)
  const estimatedProcessingTime = Math.max(
    1,
    Math.ceil(sanitizedInput.length / 100)
  );

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedInput,
    metadata: {
      length: sanitizedInput.length,
      wordCount,
      language,
      containsSpecialChars,
      containsNumbers,
      estimatedProcessingTime,
    },
  };

  // Log para debugging
  if (errors.length > 0 || warnings.length > 0) {
    log.debug('Validação de entrada:', {
      originalLength: input.length,
      sanitizedLength: sanitizedInput.length,
      errors,
      warnings,
      metadata: result.metadata,
    });
  }

  return result;
};

// Validar entrada para diferentes modos de chat
export const validateChatInput = (
  input: string,
  mode: 'normal' | 'intelligent' | 'analysis'
): ValidationResult => {
  const modeOptions: Record<string, ValidationOptions> = {
    normal: {
      maxLength: 5000,
      maxWords: 1000,
      minLength: 10,
      minWords: 3,
    },
    intelligent: {
      maxLength: 5000,
      maxWords: 1000,
      minLength: 20,
      minWords: 5,
    },
    analysis: {
      maxLength: 5000,
      maxWords: 1000,
      minLength: 5,
      minWords: 2,
      requireText: true,
    },
  };

  return validateInput(input, modeOptions[mode]);
};

// Função para limpar e preparar entrada para processamento
export const prepareInputForProcessing = (
  input: string,
  mode: 'normal' | 'intelligent' | 'analysis'
): { input: string; validation: ValidationResult } => {
  const validation = validateChatInput(input, mode);

  return {
    input: validation.sanitizedInput,
    validation,
  };
};

// Verificar se entrada é segura para processamento
export const isInputSafe = (input: string): boolean => {
  const validation = validateInput(input);
  return validation.isValid && validation.warnings.length === 0;
};

// Gerar sugestões de melhoria baseadas na validação
export const getInputSuggestions = (validation: ValidationResult): string[] => {
  const suggestions: string[] = [];

  if (validation.errors.length > 0) {
    suggestions.push('Corrija os erros antes de continuar');
  }

  if (validation.warnings.length > 0) {
    suggestions.push('Revise os avisos para melhor resultado');
  }

  if (validation.metadata.wordCount < 10) {
    suggestions.push('Considere adicionar mais detalhes');
  }

  if (
    validation.metadata.containsSpecialChars &&
    validation.metadata.wordCount > 100
  ) {
    suggestions.push('Considere simplificar a formatação');
  }

  if (validation.metadata.estimatedProcessingTime > 30) {
    suggestions.push('Texto longo - processamento pode demorar');
  }

  return suggestions;
};
