import * as React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
  FileX, 
  Inbox, 
  Search, 
  UserX, 
  AlertCircle, 
  CheckCircle, 
  Info,
  LucideIcon
} from 'lucide-react';

export interface EmptyStateProps {
  /**
   * Título principal do estado vazio
   */
  title?: string;
  
  /**
   * Descrição do estado vazio
   */
  description?: string;
  
  /**
   * Ícone a ser exibido
   */
  icon?: LucideIcon;
  
  /**
   * Variante do ícone
   */
  iconVariant?: 'default' | 'warning' | 'error' | 'success' | 'info';
  
  /**
   * Ação principal (botão)
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'outline' | 'secondary' | 'ghost';
  };
  
  /**
   * Ação secundária (link)
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  /**
   * Conteúdo personalizado
   */
  children?: React.ReactNode;
  
  /**
   * Classe CSS adicional
   */
  className?: string;
  
  /**
   * Tamanho do componente
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Se deve centralizar o conteúdo
   */
  centered?: boolean;
}

const iconMap = {
  default: FileX,
  warning: AlertCircle,
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const sizeMap = {
  sm: {
    container: 'p-6',
    icon: 'h-8 w-8',
    title: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'p-8',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'p-12',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
  },
};

const iconColorMap = {
  default: 'text-muted-foreground',
  warning: 'text-amber-500',
  error: 'text-destructive',
  success: 'text-green-500',
  info: 'text-blue-500',
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    title = 'Nada encontrado',
    description = 'Não há conteúdo disponível no momento.',
    icon: IconComponent = Inbox,
    iconVariant = 'default',
    action,
    secondaryAction,
    children,
    className,
    size = 'md',
    centered = true,
    ...props
  }, ref) => {
    const sizes = sizeMap[size];
    const Icon = IconComponent || iconMap[iconVariant];
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center text-center',
          centered && 'justify-center',
          sizes.container,
          className
        )}
        {...props}
      >
        <div className="mb-4">
          <Icon 
            className={cn(sizes.icon, iconColorMap[iconVariant])} 
          />
        </div>
        
        {title && (
          <h3 className={cn('font-semibold text-foreground mb-2', sizes.title)}>
            {title}
          </h3>
        )}
        
        {description && (
          <p className={cn('text-muted-foreground mb-4 max-w-sm', sizes.description)}>
            {description}
          </p>
        )}
        
        {children}
        
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {action && (
              <Button
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="ghost"
                onClick={secondaryAction.onClick}
                className="text-muted-foreground"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// Presets para diferentes tipos de estado vazio
export const EmptyStatePresets = {
  noData: (props: Partial<EmptyStateProps> = {}) => ({
    title: 'Nenhum dado encontrado',
    description: 'Não há dados para exibir no momento.',
    icon: Inbox,
    iconVariant: 'default' as const,
    ...props,
  }),
  
  noResults: (props: Partial<EmptyStateProps> = {}) => ({
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os filtros ou termos de busca.',
    icon: Search,
    iconVariant: 'info' as const,
    ...props,
  }),
  
  noUsers: (props: Partial<EmptyStateProps> = {}) => ({
    title: 'Nenhum usuário encontrado',
    description: 'Não há usuários cadastrados no sistema.',
    icon: UserX,
    iconVariant: 'warning' as const,
    ...props,
  }),
  
  noFiles: (props: Partial<EmptyStateProps> = {}) => ({
    title: 'Nenhum arquivo encontrado',
    description: 'Não há arquivos para exibir.',
    icon: FileX,
    iconVariant: 'default' as const,
    ...props,
  }),
  
  error: (props: Partial<EmptyStateProps> = {}) => ({
    title: 'Algo deu errado',
    description: 'Ocorreu um erro ao carregar o conteúdo. Tente novamente.',
    icon: AlertCircle,
    iconVariant: 'error' as const,
    ...props,
  }),
  
  success: (props: Partial<EmptyStateProps> = {}) => ({
    title: 'Operação concluída',
    description: 'A operação foi realizada com sucesso.',
    icon: CheckCircle,
    iconVariant: 'success' as const,
    ...props,
  }),
};

export default EmptyState;