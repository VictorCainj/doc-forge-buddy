/**
 * Tipos de Interface do Usuário
 * 
 * Este módulo contém os tipos para componentes React, temas, acessibilidade
 * e elementos visuais reutilizáveis em toda a aplicação.
 */

import type { ReactNode, ComponentType, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// PROPS BASE DE COMPONENTES
// ============================================================================

/**
 * Props base para todos os componentes
 */
export interface BaseComponentProps {
  /** Classes CSS customizadas */
  className?: string;
  /** Estilos CSS inline */
  style?: CSSProperties;
  /** Children do componente */
  children?: ReactNode;
  /** Test ID para testes automatizados */
  testId?: string;
  /** Indica se o componente está desabilitado */
  disabled?: boolean;
}

// ============================================================================
// TIPOS DE LAYOUT
// ============================================================================

/**
 * Breakpoints responsivos
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Configurações de container
 */
export interface ContainerConfig {
  /** Largura máxima do container */
  maxWidth: Breakpoint;
  /** Padding horizontal */
  paddingX: number;
  /** Padding vertical */
  paddingY?: number;
  /** Se deve ser responsivo */
  responsive?: boolean;
}

/**
 * Configurações de grid
 */
export interface GridConfig {
  /** Número de colunas */
  columns: number;
  /** Espaçamento entre itens */
  gap: number;
  /** Breakpoint para responsividade */
  breakpoint?: Breakpoint;
}

// ============================================================================
// TIPOS DE BOTÃO
// ============================================================================

/**
 * Variantes de botão
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/**
 * Tamanhos de botão
 */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * Props do componente Button
 */
export interface ButtonProps extends BaseComponentProps {
  /** Variante visual do botão */
  variant?: ButtonVariant;
  /** Tamanho do botão */
  size?: ButtonSize;
  /** Ícone do botão */
  icon?: LucideIcon;
  /** Posição do ícone */
  iconPosition?: 'left' | 'right';
  /** Se deve ocupar toda a largura disponível */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Tipo do botão HTML */
  type?: 'button' | 'submit' | 'reset';
  /** Callback de clique */
  onClick?: () => void;
  /** Elemento HTML customizado */
  asChild?: boolean;
}

// ============================================================================
// TIPOS DE INPUT
// ============================================================================

/**
 * Estados de input
 */
export type InputState = 'default' | 'focused' | 'filled' | 'error' | 'disabled';

/**
 * Props do componente Input
 */
export interface InputProps extends BaseComponentProps {
  /** Tipo do input */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Placeholder do input */
  placeholder?: string;
  /** Valor atual do input */
  value?: string;
  /** Valor padrão do input */
  defaultValue?: string;
  /** Estado de erro */
  error?: string;
  /** Label do input */
  label?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Ícone do input */
  icon?: LucideIcon;
  /** Posição do ícone */
  iconPosition?: 'left' | 'right';
  /** Se é um input de senha */
  isPassword?: boolean;
  /** Callback de mudança de valor */
  onChange?: (value: string) => void;
  /** Callback de foco */
  onFocus?: () => void;
  /** Callback de perda de foco */
  onBlur?: () => void;
  /** Input requerido */
  required?: boolean;
  /** Autocomplete */
  autoComplete?: string;
  /** Máscara de entrada */
  mask?: (value: string) => string;
  /** ID do input */
  inputId?: string;
}

// ============================================================================
// TIPOS DE CARD
// ============================================================================

/**
 * Props do componente Card
 */
export interface CardProps extends BaseComponentProps {
  /** Se o card pode ser clicável */
  clickable?: boolean;
  /** Se o card está em estado de loading */
  loading?: boolean;
  /** Elevation do card */
  elevation?: 0 | 1 | 2 | 3 | 4;
  /** Cor de fundo do card */
  backgroundColor?: string;
  /** Callback de clique */
  onClick?: () => void;
  /** Header do card */
  header?: ReactNode;
  /** Footer do card */
  footer?: ReactNode;
}

// ============================================================================
// TIPOS DE MODAL
// ============================================================================

/**
 * Props do componente Modal
 */
export interface ModalProps extends BaseComponentProps {
  /** Se o modal está aberto */
  open: boolean;
  /** Título do modal */
  title?: string;
  /** Descrição do modal */
  description?: string;
  /** Tamanho do modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Se deve fechar ao clicar fora */
  closeOnOverlayClick?: boolean;
  /** Se deve ter botão de fechar */
  showCloseButton?: boolean;
  /** Callback de fechamento */
  onClose: () => void;
  /** Callback de confirmação */
  onConfirm?: () => void;
  /** Texto do botão de confirmar */
  confirmText?: string;
  /** Texto do botão de cancelar */
  cancelText?: string;
  /** Se o modal está em loading */
  loading?: boolean;
  /** Se deve trancar o scroll da página */
  lockScroll?: boolean;
}

// ============================================================================
// TIPOS DE TOAST/NOTIFICAÇÃO
// ============================================================================

/**
 * Variantes de toast
 */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

/**
 * Props do componente Toast
 */
export interface ToastProps {
  /** ID único do toast */
  id: string;
  /** Título do toast */
  title?: string;
  /** Mensagem do toast */
  message: string;
  /** Variante do toast */
  variant: ToastVariant;
  /** Duração em milliseconds (0 para persistente) */
  duration?: number;
  /** Se pode ser fechado manualmente */
  dismissible?: boolean;
  /** Ação do toast */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Callback de fechamento */
  onClose?: () => void;
}

// ============================================================================
// TIPOS DE TABELA
// ============================================================================

/**
 * Configuração de coluna da tabela
 */
export interface TableColumn<T = unknown> {
  /** Chave da coluna */
  key: string;
  /** Título da coluna */
  title: string;
  /** Renderizador customizado */
  render?: (value: unknown, record: T) => ReactNode;
  /** Largura da coluna */
  width?: number;
  /** Se a coluna é ordenável */
  sortable?: boolean;
  /** Se a coluna é filtrável */
  filterable?: boolean;
  /** Alinhamento do texto */
  align?: 'left' | 'center' | 'right';
  /** Fixed position da coluna */
  fixed?: 'left' | 'right';
}

/**
 * Props do componente Table
 */
export interface TableProps<T = unknown> extends BaseComponentProps {
  /** Dados da tabela */
  data: T[];
  /** Configuração das colunas */
  columns: TableColumn<T>[];
  /** Chave única para cada linha */
  rowKey: keyof T | ((record: T) => string);
  /** Loading state */
  loading?: boolean;
  /** Estado vazio */
  empty?: {
    text: string;
    icon?: LucideIcon;
    action?: ReactNode;
  };
  /** Se a tabela é selecionável */
  selectable?: boolean;
  /** Linhas selecionadas */
  selectedRows?: T[];
  /** Callback de seleção */
  onSelectionChange?: (selected: T[]) => void;
  /** Paginação */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  /** Ordenação */
  sorting?: {
    column?: string;
    direction?: 'asc' | 'desc';
    onChange: (column: string, direction: 'asc' | 'desc') => void;
  };
  /** Filtros */
  filters?: Record<string, unknown>;
  /** Callback de clique na linha */
  onRowClick?: (record: T) => void;
}

// ============================================================================
// TIPOS DE FORMULÁRIO
// ============================================================================

/**
 * Estado de formulário
 */
export type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Configuração de campo de formulário
 */
export interface FormFieldConfig {
  /** Nome do campo */
  name: string;
  /** Label do campo */
  label: string;
  /** Tipo do campo */
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  /** Placeholder */
  placeholder?: string;
  /** Se é obrigatório */
  required?: boolean;
  /** Regras de validação */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
  };
  /** Opções para select/checkbox */
  options?: { label: string; value: string | number }[];
  /** Componente customizado */
  component?: ComponentType<any>;
  /** Props adicionais do campo */
  props?: Record<string, unknown>;
}

/**
 * Props do componente Form
 */
export interface FormProps extends BaseComponentProps {
  /** Campos do formulário */
  fields: FormFieldConfig[];
  /** Valor inicial do formulário */
  initialValues?: Record<string, unknown>;
  /** Callback de submissão */
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  /** Estado de carregamento */
  loading?: boolean;
  /** Texto do botão de submit */
  submitText?: string;
  /** Texto do botão de reset */
  resetText?: string;
  /** Layout do formulário */
  layout?: 'vertical' | 'horizontal' | 'inline';
  /** Número de colunas por linha (horizontal/inline) */
  columnsPerRow?: number;
  /** Se deve mostrar botões de ação */
  showActions?: boolean;
  /** Se deve resetar ao submeter com sucesso */
  resetOnSuccess?: boolean;
  /** ID do formulário */
  formId?: string;
}

// ============================================================================
// TIPOS DE ACESSIBILIDADE
// ============================================================================

/**
 * Roles ARIA
 */
export type AriaRole = 
  | 'button'
  | 'checkbox'
  | 'dialog'
  | 'grid'
  | 'gridcell'
  | 'link'
  | 'listbox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'scrollbar'
  | 'searchbox'
  | 'spinbutton'
  | 'status'
  | 'tab'
  | 'table'
  | 'tabpanel'
  | 'textbox'
  | 'timer'
  | 'tooltip'
  | 'tree'
  | 'treeitem';

/**
 * Props de acessibilidade
 */
export interface AriaProps {
  /** Role ARIA */
  role?: AriaRole;
  /** Label acessível */
  'aria-label'?: string;
  /** Described by */
  'aria-describedby'?: string;
  /** Expanded state */
  'aria-expanded'?: boolean;
  /** Selected state */
  'aria-selected'?: boolean;
  /** Disabled state */
  'aria-disabled'?: boolean;
  /** Required state */
  'aria-required'?: boolean;
  /** Invalid state */
  'aria-invalid'?: boolean;
  /** Live region */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Level (para headings) */
  'aria-level'?: number;
  /** Current (para navigation) */
  'aria-current'?: string | boolean;
  /** Labelled by */
  'aria-labelledby'?: string;
  /** Controls */
  'aria-controls'?: string;
  /** Has popup */
  'aria-haspopup'?: string | boolean;
  /** Hidden */
  'aria-hidden'?: boolean;
}

// ============================================================================
// TIPOS DE TEMA
// ============================================================================

/**
 * Cores do tema
 */
export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Espaçamentos do tema
 */
export interface ThemeSpacing {
  px: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

/**
 * Fontes do tema
 */
export interface ThemeFonts {
  sans: string;
  serif: string;
  mono: string;
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

/**
 * Configuração completa do tema
 */
export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  fonts: ThemeFonts;
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  transitions: {
    fast: string;
    base: string;
    slow: string;
  };
  zIndex: {
    dropdown: number;
    sticky: number;
    banner: number;
    overlay: number;
    modal: number;
    popover: number;
    skipLink: number;
    toast: number;
    tooltip: number;
  };
}

// ============================================================================
// TIPOS DE COMPONENTE REUTILIZÁVEIS
// ============================================================================

/**
 * Props do componente Loading
 */
export interface LoadingProps extends BaseComponentProps {
  /** Tamanho do loading */
  size?: 'sm' | 'md' | 'lg';
  /** Texto de loading */
  text?: string;
  /** Cor do loading */
  color?: string;
  /** Velocidade da animação */
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * Props do componente Avatar
 */
export interface AvatarProps extends BaseComponentProps {
  /** URL da imagem */
  src?: string;
  /** Texto alternativo */
  alt?: string;
  /** Tamanho do avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Forma do avatar */
  shape?: 'circle' | 'square' | 'rounded';
  /** Status do usuário */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** Fallback para quando não há imagem */
  fallback?: string;
}

/**
 * Props do componente Badge
 */
export interface BadgeProps extends BaseComponentProps {
  /** Variante do badge */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Se deve ser dismissível */
  dismissible?: boolean;
  /** Callback de dismiss */
  onDismiss?: () => void;
  /** Posição do badge */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Contagem numérica */
  count?: number;
  /** Se deve mostrar apenas a contagem */
  showCountOnly?: boolean;
}

// ============================================================================
// TIPOS DE HOOK PERSONALIZADOS
// ============================================================================

/**
 * Resultado do hook de estado
 */
export interface UseStateResult<T> {
  /** Valor atual */
  value: T;
  /** Setter do valor */
  setValue: (value: T) => void;
  /** Reset para valor inicial */
  reset: () => void;
  /** Se está carregando */
  loading: boolean;
  /** Se há erro */
  error: string | null;
  /** Se foi bem-sucedido */
  success: boolean;
}

/**
 * Configuração do hook de estado
 */
export interface UseStateConfig<T> {
  /** Valor inicial */
  initialValue: T;
  /** Timeout para reset automático */
  autoResetTimeout?: number;
  /** Callback de mudança */
  onChange?: (value: T) => void;
  /** Validação do valor */
  validate?: (value: T) => string | null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  BaseComponentProps,
  Breakpoint,
  ContainerConfig,
  GridConfig,
  ButtonProps,
  InputProps,
  CardProps,
  ModalProps,
  ToastProps,
  TableColumn,
  TableProps,
  FormFieldConfig,
  FormProps,
  AriaProps,
  ThemeConfig,
  LoadingProps,
  AvatarProps,
  BadgeProps,
  UseStateResult,
  UseStateConfig
};

export { ThemeColors, ThemeSpacing, ThemeFonts };

export default {};