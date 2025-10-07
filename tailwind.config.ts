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
        // Sistema de cores neutras - Design Minimalista
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#121212',
        },
        // Cor de acento única - Azul suave
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
          DEFAULT: '#2196F3',
          foreground: '#FFFFFF',
        },
        // Cores semânticas suaves
        success: {
          50: '#E8F5E9',
          500: '#66BB6A',
          700: '#43A047',
        },
        warning: {
          50: '#FFF3E0',
          500: '#FFA726',
          700: '#FB8C00',
        },
        error: {
          50: '#FFEBEE',
          500: '#EF5350',
          700: '#E53935',
        },
        info: {
          50: '#E1F5FE',
          500: '#29B6F6',
          700: '#039BE5',
        },
        // Mapeamento para compatibilidade
        border: '#E0E0E0',
        input: '#E0E0E0',
        ring: '#2196F3',
        background: '#FFFFFF',
        foreground: '#212121',
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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
      },
      boxShadow: {
        // Sombras Material Design
        'elevation-0': 'none',
        'elevation-1': '0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12)',
        'elevation-2': '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)',
        'elevation-3': '0 3px 3px -2px rgba(0,0,0,0.2), 0 3px 4px 0 rgba(0,0,0,0.14), 0 1px 8px 0 rgba(0,0,0,0.12)',
        'elevation-4': '0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12)',
        'elevation-6': '0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12)',
        'elevation-8': '0 5px 5px -3px rgba(0,0,0,0.2), 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12)',
        // Sombras simples
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
      },
      transitionTimingFunction: {
        'material-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'material-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'material-accelerate': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'material-sharp': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
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
