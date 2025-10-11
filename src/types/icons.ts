import { IconType } from 'react-icons';

/**
 * Tipo base para ícones da aplicação
 * Utilizado em toda a aplicação para garantir consistência
 */
export type AppIcon = IconType;

/**
 * Categorias de ícones para aplicação de cores
 */
export type IconCategory =
  | 'document'
  | 'success'
  | 'danger'
  | 'navigation'
  | 'user'
  | 'system'
  | 'communication'
  | 'time'
  | 'location'
  | 'edit'
  | 'loading'
  | 'neutral';

/**
 * Props para componente de ícone colorido
 */
export interface ColoredIconProps {
  icon: AppIcon;
  category?: IconCategory;
  size?: number | string;
  className?: string;
  color?: string; // Cor customizada que sobrescreve a categoria
}

