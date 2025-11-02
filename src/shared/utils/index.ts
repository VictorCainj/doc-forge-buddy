// @ts-nocheck
/**
 * Barrel export para utilitários compartilhados
 * Organiza utilitários por categoria
 */

// Formatters
export { formatDateBrazilian, formatCurrency, formatPhone } from './formatters';

// Validators
export {
  validateEmail,
  validatePhone,
  validateCPF,
  validateCNPJ,
} from './validators';

// Helpers
export { cn, generateId, debounce, throttle } from './helpers';

// Date utilities
export {
  getCurrentDate,
  addDays,
  subtractDays,
  formatRelativeTime,
  isValidDate,
} from './dateHelpers';

// String utilities
export {
  capitalize,
  slugify,
  truncate,
  removeAccents,
  sanitizeHtml,
} from './stringHelpers';

// Array utilities
export { groupBy, sortBy, uniqueBy, chunk, flatten } from './arrayHelpers';

// Object utilities
export { deepMerge, omit, pick, isEmpty, isEqual } from './objectHelpers';

// Performance utilities
export { memoize, createCache, measurePerformance } from './performanceHelpers';
