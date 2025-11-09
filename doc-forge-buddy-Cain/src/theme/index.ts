/**
 * Sistema de Design Google Material Design 3
 * Paleta Google com tons sutis, design limpo e moderno
 */

// ============================================
// CORES - Paleta Google Material Design 3
// ============================================
export const colors = {
  // Escala de Cinza Google
  neutral: {
    50: '#F8F9FA', // Surface mais clara
    100: '#F1F3F4', // Surface clara
    200: '#E8EAED', // Borders suaves
    300: '#DADCE0', // Borders padrão
    400: '#BDC1C6', // Texto desabilitado
    500: '#9AA0A6', // Ícones inativos
    600: '#80868B', // Texto secundário
    700: '#5F6368', // Texto terciário
    800: '#3C4043', // Texto secundário escuro
    900: '#202124', // Texto principal
    950: '#000000', // Preto puro
  },

  // Azul Google - Cor Primária
  primary: {
    50: '#E8F0FE', // Azul muito claro
    100: '#D2E3FC', // Azul claro
    200: '#AECBFA', // Azul claro médio
    300: '#8AB4F8', // Azul médio
    400: '#669DF6', // Azul médio escuro
    500: '#4285F4', // Azul Google principal
    600: '#1A73E8', // Azul escuro
    700: '#1967D2', // Azul mais escuro
    800: '#185ABC', // Azul muito escuro
    900: '#174EA6', // Azul profundo
  },

  // Estados Semânticos - Cores Google
  semantic: {
    success: '#34A853', // Verde Google
    successBg: '#E6F4EA', // Verde background
    warning: '#FBBC04', // Amarelo Google
    warningBg: '#FEF7E0', // Amarelo background
    error: '#EA4335', // Vermelho Google
    errorBg: '#FCE8E6', // Vermelho background
    info: '#4285F4', // Azul informativo
    infoBg: '#E8F0FE', // Azul background
  },

  // Cores Funcionais
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F4',
  },

  border: {
    light: '#E8EAED',
    default: '#DADCE0',
    dark: '#BDC1C6',
  },

  text: {
    primary: '#202124',
    secondary: '#5F6368',
    tertiary: '#80868B',
    disabled: '#BDC1C6',
    inverse: '#FFFFFF',
  },
};

// ============================================
// TIPOGRAFIA
// ============================================
export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ],
    mono: [
      '"JetBrains Mono"',
      'Monaco',
      'Consolas',
      '"Courier New"',
      'monospace',
    ],
  },

  fontSize: {
    xs: '0.75rem', // 12px - Captions
    sm: '0.875rem', // 14px - Body small
    base: '1rem', // 16px - Body default
    lg: '1.125rem', // 18px - Subtítulos
    xl: '1.25rem', // 20px - Títulos seção
    '2xl': '1.5rem', // 24px - Títulos página
    '3xl': '2rem', // 32px - Headlines
    '4xl': '2.5rem', // 40px - Display
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
};

// ============================================
// ESPAÇAMENTO - Sistema 8pt
// ============================================
export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
};

// ============================================
// BORDAS E RAIOS
// ============================================
export const borders = {
  radius: {
    none: '0',
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  width: {
    none: '0',
    thin: '1px',
    base: '1px',
    thick: '2px',
  },
};

// ============================================
// SOMBRAS - Elevação Material Design
// ============================================
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Elevações Material Design
  elevation: {
    0: 'none',
    1: '0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12)',
    2: '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)',
    3: '0 3px 3px -2px rgba(0,0,0,0.2), 0 3px 4px 0 rgba(0,0,0,0.14), 0 1px 8px 0 rgba(0,0,0,0.12)',
    4: '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)',
    6: '0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12)',
    8: '0 5px 5px -3px rgba(0,0,0,0.2), 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12)',
    12: '0 7px 8px -4px rgba(0,0,0,0.2), 0 12px 17px 2px rgba(0,0,0,0.14), 0 5px 22px 4px rgba(0,0,0,0.12)',
    16: '0 8px 10px -5px rgba(0,0,0,0.2), 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12)',
    24: '0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)',
  },
};

// ============================================
// TRANSIÇÕES E ANIMAÇÕES
// ============================================
export const transitions = {
  duration: {
    instant: '0ms',
    fast: '75ms',
    base: '100ms',
    slow: '300ms',
    slower: '500ms',
  },

  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Material Design easing
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },

  // Transições pré-definidas
  all: 'all 100ms ease',
  colors:
    'background-color 100ms ease, border-color 100ms ease, color 100ms ease',
  opacity: 'opacity 75ms ease',
  shadow: 'box-shadow 100ms ease',
  transform: 'transform 75ms ease',
};

// ============================================
// Z-INDEX
// ============================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
  max: 9999,
};

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// COMPONENTES - Estilos Base
// ============================================
export const components = {
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      sm: 'h-9 px-3 text-sm rounded-lg',
      md: 'h-10 px-4 text-sm rounded-lg',
      lg: 'h-12 px-6 text-base rounded-xl',
    },
    variants: {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 shadow-elevation-1 hover:shadow-elevation-2 focus-visible:ring-primary-500',
      secondary:
        'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-500',
      outline:
        'border border-neutral-300 bg-transparent hover:bg-neutral-50 focus-visible:ring-primary-500',
      ghost:
        'bg-transparent hover:bg-neutral-100 text-neutral-700 focus-visible:ring-neutral-500',
      link: 'bg-transparent underline-offset-4 hover:underline text-primary-600',
    },
  },

  card: {
    base: 'bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-elevation-1',
    hover: 'transition-shadow duration-200 hover:shadow-elevation-2',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },

  input: {
    base: 'w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed transition-all duration-200',
    sizes: {
      sm: 'h-8 text-sm',
      md: 'h-10 text-sm',
      lg: 'h-12 text-base',
    },
  },

  badge: {
    base: 'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium',
    variants: {
      default: 'bg-neutral-100 text-neutral-700',
      primary: 'bg-primary-50 text-primary-700',
      success: 'bg-success-50 text-success-700',
      warning: 'bg-warning-50 text-warning-700',
      error: 'bg-error-50 text-error-700',
    },
  },
};

// ============================================
// UTILIDADES
// ============================================
export const utils = {
  // Função para criar classes consistentes
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },

  // Função para obter cor com opacidade
  withOpacity: (color: string, opacity: number) => {
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  },
};

// Export default do tema completo
const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  components,
  utils,
};

export default theme;
