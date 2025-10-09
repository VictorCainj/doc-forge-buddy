/**
 * Política de Senhas Robusta
 * Valida e garante a segurança das senhas dos usuários
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  checkCompromised: boolean;
  maxAge: number; // dias
  preventReuse: number; // número de senhas anteriores
}

// Política padrão
const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  checkCompromised: false, // Requer API externa
  maxAge: 90,
  preventReuse: 5,
};

// Lista de senhas comuns (top 100 mais usadas)
const COMMON_PASSWORDS = [
  '123456',
  'password',
  '123456789',
  '12345678',
  '12345',
  '1234567',
  '1234567890',
  'qwerty',
  'abc123',
  '111111',
  'password1',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'princess',
  'qwerty123',
];

/**
 * Valida uma senha contra a política configurada
 */
export function validatePassword(
  password: string,
  policy: Partial<PasswordPolicy> = {}
): PasswordValidationResult {
  const appliedPolicy = { ...DEFAULT_POLICY, ...policy };
  const errors: string[] = [];
  let score = 0;

  // Validação de comprimento mínimo
  if (password.length < appliedPolicy.minLength) {
    errors.push(
      `A senha deve ter no mínimo ${appliedPolicy.minLength} caracteres`
    );
  } else {
    score += 20;
  }

  // Validação de letra maiúscula
  if (appliedPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  // Validação de letra minúscula
  if (appliedPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  // Validação de números
  if (appliedPolicy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  // Validação de caracteres especiais
  if (
    appliedPolicy.requireSpecialChars &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push(
      'A senha deve conter pelo menos um caractere especial (!@#$%^&*...)'
    );
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15;
  }

  // Prevenção de senhas comuns
  if (
    appliedPolicy.preventCommonPasswords &&
    COMMON_PASSWORDS.some((common) => password.toLowerCase().includes(common))
  ) {
    errors.push('Esta senha é muito comum. Escolha uma senha mais segura');
    score -= 20;
  }

  // Bonificações adicionais
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;
  if (/[A-Z].*[A-Z]/.test(password)) score += 5; // Múltiplas maiúsculas
  if (/[0-9].*[0-9]/.test(password)) score += 5; // Múltiplos números
  if (/[!@#$%^&*].*[!@#$%^&*]/.test(password)) score += 5; // Múltiplos especiais

  // Determinar força da senha
  let strength: PasswordValidationResult['strength'];
  if (score < 40) strength = 'weak';
  else if (score < 60) strength = 'medium';
  else if (score < 80) strength = 'strong';
  else strength = 'very-strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(100, Math.max(0, score)),
  };
}

/**
 * Verifica se a senha foi comprometida (usando Have I Been Pwned API)
 * Nota: Esta função requer uma chamada de API externa
 */
export async function checkPasswordCompromised(
  password: string
): Promise<boolean> {
  try {
    // Usar SHA-1 hash dos primeiros 5 caracteres (k-anonymity)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const prefix = hashHex.substring(0, 5).toUpperCase();
    const suffix = hashHex.substring(5).toUpperCase();

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );
    const text = await response.text();

    // Verificar se o sufixo aparece na resposta
    return text.includes(suffix);
  } catch (error) {
    console.error('Erro ao verificar senha comprometida:', error);
    // Em caso de erro, permitir o uso (não bloquear por falha de API)
    return false;
  }
}

/**
 * Gera uma senha forte aleatória
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // Garantir pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Preencher o restante aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralhar a senha
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Calcula o tempo estimado para quebrar a senha (força bruta)
 */
export function estimateCrackTime(password: string): string {
  const charset = {
    lowercase: /[a-z]/.test(password) ? 26 : 0,
    uppercase: /[A-Z]/.test(password) ? 26 : 0,
    numbers: /[0-9]/.test(password) ? 10 : 0,
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 32 : 0,
  };

  const charsetSize =
    charset.lowercase + charset.uppercase + charset.numbers + charset.special;
  const possibilities = Math.pow(charsetSize, password.length);

  // Assumindo 1 bilhão de tentativas por segundo
  const seconds = possibilities / 1_000_000_000;

  if (seconds < 1) return 'Instantâneo';
  if (seconds < 60) return `${Math.round(seconds)} segundos`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutos`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} horas`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} dias`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} anos`;
  return 'Séculos';
}

/**
 * Verifica se a senha expirou
 */
export function isPasswordExpired(
  lastChange: Date,
  maxAgeDays: number = DEFAULT_POLICY.maxAge
): boolean {
  const now = new Date();
  const daysSinceChange =
    (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceChange > maxAgeDays;
}

/**
 * Calcula dias até a expiração da senha
 */
export function daysUntilExpiration(
  lastChange: Date,
  maxAgeDays: number = DEFAULT_POLICY.maxAge
): number {
  const now = new Date();
  const daysSinceChange =
    (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = maxAgeDays - daysSinceChange;
  return Math.max(0, Math.round(daysRemaining));
}

/**
 * Sanitiza entrada para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
