/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Sistema de cores Google Material Design 3 - Tons Sutis
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
          DEFAULT: '#4285F4',
          foreground: '#FFFFFF',
        },
        // Verde Google - Success
        success: {
          50: '#E6F4EA', // Verde muito claro
          100: '#CEEAD6',
          200: '#A8DAB5', // Borda clara
          500: '#34A853', // Verde Google
          600: '#1E8E3E',
          700: '#137333',
          900: '#0D652D', // Verde profundo
        },
        // Amarelo Google - Warning
        warning: {
          50: '#FEF7E0', // Amarelo muito claro
          100: '#FEEFC3',
          200: '#FEEAA7', // Borda clara
          500: '#FBBC04', // Amarelo Google
          600: '#F9AB00',
          700: '#F29900',
          900: '#E37400', // Amarelo profundo
        },
        // Vermelho Google - Error
        error: {
          50: '#FCE8E6', // Vermelho muito claro
          100: '#FAD2CF',
          200: '#F8BBB7', // Borda clara
          500: '#EA4335', // Vermelho Google
          600: '#D93025',
          700: '#C5221F',
          900: '#A50E0E', // Vermelho profundo
        },
        // Azul Informativo
        info: {
          50: '#E8F0FE',
          200: '#AECBFA', // Borda clara
          500: '#4285F4',
          600: '#1A73E8',
          700: '#1967D2',
          900: '#0D47A1', // Azul profundo
        },
        // Mapeamento para compatibilidade
        border: '#DADCE0',
        input: '#DADCE0',
        ring: '#4285F4',
        background: '#FFFFFF',
        foreground: '#202124',
        secondary: {
          DEFAULT: '#F5F5F5',
          foreground: '#616161',
        },
        destructive: {
          DEFAULT: '#EF5350',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#757575',
        },
        accent: {
          DEFAULT: '#E3F2FD',
          foreground: '#1976D2',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#212121',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#212121',
        },
        sidebar: {
          DEFAULT: '#FAFAFA',
          foreground: '#616161',
          primary: '#2196F3',
          'primary-foreground': '#FFFFFF',
          accent: '#E3F2FD',
          'accent-foreground': '#1976D2',
          border: '#E0E0E0',
          ring: '#2196F3',
        },
      },
      borderRadius: {
        none: '0',
        sm: '4px', // Material Design - pequeno
        DEFAULT: '8px', // Material Design - padrão
        md: '8px', // Material Design - médio
        lg: '12px', // Material Design - grande
        xl: '16px', // Material Design - extra grande
        '2xl': '20px', // Material Design - extra extra grande
        full: '9999px', // Círculo/pílula
      },
      boxShadow: {
        // Google Material Design 3 - Elevations
        'elevation-1':
          '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'elevation-2':
          '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        'elevation-3':
          '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'elevation-4':
          '0 2px 3px 0 rgba(60,64,67,0.3), 0 6px 10px 4px rgba(60,64,67,0.15)',
        'elevation-5':
          '0 4px 4px 0 rgba(60,64,67,0.3), 0 8px 12px 6px rgba(60,64,67,0.15)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
      },
      transitionTimingFunction: {
        'material-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'material-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'material-accelerate': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'material-sharp': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      },
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
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
