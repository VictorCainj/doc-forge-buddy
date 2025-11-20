import type { Decorator } from '@storybook/react';

declare module '@storybook/react' {
  interface ConfigOptions {
    // Custom configurations for our components
  }
}

// Story metadata types
export interface ComponentMeta {
  title: string;
  component: any;
  tags?: string[];
  decorators?: Decorator[];
  parameters?: Record<string, any>;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
}

// Design tokens
export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  borders: {
    radius: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    width: {
      none: string;
      thin: string;
      medium: string;
      thick: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    none: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}