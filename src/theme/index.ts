/**
 * Sistema de Design Minimalista - Estilo Google Material
 * Cores neutras, sem ícones coloridos, design limpo e suave
 */

// ============================================
// CORES - Paleta Monocromática
// ============================================
export const colors = {
  // Escala de Cinza Principal
  neutral: {
    50: '#FAFAFA',   // Backgrounds sutis
    100: '#F5F5F5',  // Cards e containers
    200: '#EEEEEE',  // Bordas suaves
    300: '#E0E0E0',  // Divisores
    400: '#BDBDBD',  // Texto desabilitado
    500: '#9E9E9E',  // Ícones inativos
    600: '#757575',  // Texto secundário
    700: '#616161',  // Ícones ativos
    800: '#424242',  // Texto principal
    900: '#212121',  // Títulos
    950: '#121212',  // Backgrounds dark mode
  },
  
  // Cor de Acento Única - Azul Suave
  primary: {
    50: '#E3F2FD',   // Hover states light
    100: '#BBDEFB',  // Selected states
    200: '#90CAF9',  // Active states
    300: '#64B5F6',  // Focus rings
    400: '#42A5F5',  // Secondary actions
    500: '#2196F3',  // Primary actions
    600: '#1E88E5',  // Primary hover
    700: '#1976D2',  // Primary pressed
    800: '#1565C0',  // Primary dark
    900: '#0D47A1',  // Primary darkest
  },
  
  // Estados Semânticos - Tons Suaves
  semantic: {
    success: '#66BB6A',     // Verde suave
    successBg: '#E8F5E9',   // Verde background
    warning: '#FFA726',     // Laranja suave
    warningBg: '#FFF3E0',   // Laranja background
    error: '#EF5350',       // Vermelho suave
    errorBg: '#FFEBEE',     // Vermelho background
    info: '#29B6F6',        // Azul informativo
    infoBg: '#E1F5FE',      // Azul background
  },
  
  // Cores Funcionais
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
  },
  
  border: {
    light: '#E0E0E0',
    default: '#BDBDBD',
    dark: '#9E9E9E',
  },
  
  text: {
    primary: '#212121',
    secondary: '#616161',
    tertiary: '#9E9E9E',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
};

// ============================================
// TIPOGRAFIA
// ============================================
export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px - Captions
    sm: '0.875rem',   // 14px - Body small
    base: '1rem',     // 16px - Body default
    lg: '1.125rem',   // 18px - Subtítulos
    xl: '1.25rem',    // 20px - Títulos seção
    '2xl': '1.5rem',  // 24px - Títulos página
    '3xl': '2rem',    // 32px - Headlines
    '4xl': '2.5rem',  // 40px - Display
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
    fast: '150ms',
    base: '200ms',
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
  all: 'all 200ms ease',
  colors: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
  opacity: 'opacity 200ms ease',
  shadow: 'box-shadow 200ms ease',
  transform: 'transform 200ms ease',
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
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-md',
    },
    variants: {
      primary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-500',
      outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50 focus-visible:ring-neutral-500',
      ghost: 'bg-transparent hover:bg-neutral-100 focus-visible:ring-neutral-500',
      link: 'bg-transparent underline-offset-4 hover:underline text-neutral-900',
    },
  },
  
  card: {
    base: 'bg-white rounded-lg border border-neutral-200 overflow-hidden',
    hover: 'transition-shadow duration-200 hover:shadow-md',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  
  input: {
    base: 'w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed transition-colors duration-200',
    sizes: {
      sm: 'h-8 text-sm',
      md: 'h-10 text-sm',
      lg: 'h-12 text-base',
    },
  },
  
  badge: {
    base: 'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
    variants: {
      default: 'bg-neutral-100 text-neutral-700',
      primary: 'bg-primary-50 text-primary-700',
      success: 'bg-green-50 text-green-700',
      warning: 'bg-yellow-50 text-yellow-700',
      error: 'bg-red-50 text-red-700',
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
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
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
