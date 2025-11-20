import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color|fill|stroke)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    docs: {
      theme: 'light',
      toc: true,
      source: {
        language: 'typescript',
      },
    },
    a11y: {
      element: '#storybook-root',
      manual: false,
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
        ],
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Introduction', 'UI', ['Button', 'Input', 'Card', 'Table', 'Modal', 'Loading', 'EmptyState'], '*'],
      },
      showPanel: true,
      panelPosition: 'right',
    },
    backgrounds: {
      default: 'light',
      values: [
        { 
          name: 'light', 
          value: '#ffffff',
          title: 'Light Background'
        },
        { 
          name: 'dark', 
          value: '#0a0a0a',
          title: 'Dark Background'
        },
        { 
          name: 'gray', 
          value: '#f3f4f6',
          title: 'Gray Background'
        },
        { 
          name: 'blue', 
          value: '#eff6ff',
          title: 'Blue Background'
        },
        { 
          name: 'green', 
          value: '#f0fdf4',
          title: 'Green Background'
        },
        { 
          name: 'red', 
          value: '#fef2f2',
          title: 'Red Background'
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/your-design-file', // Substitua pela URL do Figma
    },
    // Design Tokens
    layout: 'padded',
    grid: {
      cellSize: 8,
      opacity: 0.5,
    },
  },
  decorators: [
    (Story, context) => {
      // Design Tokens Configuration
      const designTokens = {
        colors: {
          // Primary Colors
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          // Neutral Colors
          neutral: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          },
          // Semantic Colors
          success: {
            50: '#f0fdf4',
            500: '#22c55e',
            600: '#16a34a',
          },
          warning: {
            50: '#fffbeb',
            500: '#f59e0b',
            600: '#d97706',
          },
          error: {
            50: '#fef2f2',
            500: '#ef4444',
            600: '#dc2626',
          },
          info: {
            50: '#eff6ff',
            500: '#3b82f6',
            600: '#2563eb',
          },
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '12px',
          lg: '16px',
          xl: '24px',
          '2xl': '32px',
          '3xl': '48px',
          '4xl': '64px',
        },
        typography: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          fontSize: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',   // 14px
            base: '1rem',     // 16px
            lg: '1.125rem',   // 18px
            xl: '1.25rem',    // 20px
            '2xl': '1.5rem',  // 24px
            '3xl': '1.875rem', // 30px
            '4xl': '2.25rem', // 36px
          },
          fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
          lineHeight: {
            tight: '1.25',
            normal: '1.5',
            relaxed: '1.75',
          },
        },
        borderRadius: {
          none: '0px',
          sm: '4px',
          md: '8px',
          lg: '12px',
          xl: '16px',
          '2xl': '24px',
          full: '9999px',
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        transitions: {
          fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
          normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
          slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      };

      // Inject CSS custom properties
      const style = document.createElement('style');
      style.textContent = `
        :root {
          /* Primary Colors */
          --color-primary-50: ${designTokens.colors.primary[50]};
          --color-primary-100: ${designTokens.colors.primary[100]};
          --color-primary-200: ${designTokens.colors.primary[200]};
          --color-primary-300: ${designTokens.colors.primary[300]};
          --color-primary-400: ${designTokens.colors.primary[400]};
          --color-primary-500: ${designTokens.colors.primary[500]};
          --color-primary-600: ${designTokens.colors.primary[600]};
          --color-primary-700: ${designTokens.colors.primary[700]};
          --color-primary-800: ${designTokens.colors.primary[800]};
          --color-primary-900: ${designTokens.colors.primary[900]};
          
          /* Neutral Colors */
          --color-neutral-50: ${designTokens.colors.neutral[50]};
          --color-neutral-100: ${designTokens.colors.neutral[100]};
          --color-neutral-200: ${designTokens.colors.neutral[200]};
          --color-neutral-300: ${designTokens.colors.neutral[300]};
          --color-neutral-400: ${designTokens.colors.neutral[400]};
          --color-neutral-500: ${designTokens.colors.neutral[500]};
          --color-neutral-600: ${designTokens.colors.neutral[600]};
          --color-neutral-700: ${designTokens.colors.neutral[700]};
          --color-neutral-800: ${designTokens.colors.neutral[800]};
          --color-neutral-900: ${designTokens.colors.neutral[900]};
          
          /* Semantic Colors */
          --color-success-50: ${designTokens.colors.success[50]};
          --color-success-500: ${designTokens.colors.success[500]};
          --color-success-600: ${designTokens.colors.success[600]};
          
          --color-warning-50: ${designTokens.colors.warning[50]};
          --color-warning-500: ${designTokens.colors.warning[500]};
          --color-warning-600: ${designTokens.colors.warning[600]};
          
          --color-error-50: ${designTokens.colors.error[50]};
          --color-error-500: ${designTokens.colors.error[500]};
          --color-error-600: ${designTokens.colors.error[600]};
          
          --color-info-50: ${designTokens.colors.info[50]};
          --color-info-500: ${designTokens.colors.info[500]};
          --color-info-600: ${designTokens.colors.info[600]};
          
          /* Spacing */
          --spacing-xs: ${designTokens.spacing.xs};
          --spacing-sm: ${designTokens.spacing.sm};
          --spacing-md: ${designTokens.spacing.md};
          --spacing-lg: ${designTokens.spacing.lg};
          --spacing-xl: ${designTokens.spacing.xl};
          --spacing-2xl: ${designTokens.spacing['2xl']};
          --spacing-3xl: ${designTokens.spacing['3xl']};
          --spacing-4xl: ${designTokens.spacing['4xl']};
          
          /* Border Radius */
          --radius-sm: ${designTokens.borderRadius.sm};
          --radius-md: ${designTokens.borderRadius.md};
          --radius-lg: ${designTokens.borderRadius.lg};
          --radius-xl: ${designTokens.borderRadius.xl};
          --radius-2xl: ${designTokens.borderRadius['2xl']};
          --radius-full: ${designTokens.borderRadius.full};
          
          /* Shadows */
          --shadow-sm: ${designTokens.shadows.sm};
          --shadow-md: ${designTokens.shadows.md};
          --shadow-lg: ${designTokens.shadows.lg};
          --shadow-xl: ${designTokens.shadows.xl};
          
          /* Transitions */
          --transition-fast: ${designTokens.transitions.fast};
          --transition-normal: ${designTokens.transitions.normal};
          --transition-slow: ${designTokens.transitions.slow};
        }
        
        .storybook-design-token-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }
        
        .token-item {
          padding: 1rem;
          border: 1px solid #e5e5e5;
          border-radius: var(--radius-md);
          background: white;
        }
        
        .color-swatch {
          width: 100%;
          height: 60px;
          border-radius: var(--radius-sm);
          margin-bottom: 0.5rem;
        }
      `;
      
      // Add style to head if not already present
      if (!document.querySelector('#storybook-design-tokens')) {
        style.id = 'storybook-design-tokens';
        document.head.appendChild(style);
      }

      const isModalStory = context.component?.name === 'Modal' || context.component?.name === 'Dialog';
      const padding = isModalStory ? '0' : '20px';
      
      return (
        <div 
          id="storybook-root" 
          style={{ 
            minHeight: '100vh', 
            padding: padding,
            backgroundColor: 'var(--background, #ffffff)',
            fontFamily: designTokens.typography.fontFamily.sans.join(', '),
          }}
        >
          <Story />
        </div>
      );
    },
  ],
  // Global parameters
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
};

export default preview;