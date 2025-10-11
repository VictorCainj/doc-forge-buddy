import React from 'react';
import { ColoredIconProps } from '@/types/icons';
import { getIconColor } from '@/utils/iconConfig';
import { cn } from '@/lib/utils';

/**
 * Componente wrapper para ícones coloridos
 * Aplica cores automaticamente baseado na categoria do ícone
 * ou permite customização via props
 */
export const ColoredIcon: React.FC<ColoredIconProps> = ({
  icon: Icon,
  category,
  size = 20,
  className,
  color,
}) => {
  // Tentar obter a cor pela categoria ou pelo nome do componente
  const iconName = Icon.displayName || Icon.name || '';
  const defaultColor = color || (category ? getIconColor(category) : getIconColor(iconName));

  return (
    <Icon
      size={size}
      className={cn(className)}
      style={{ color: defaultColor }}
    />
  );
};

/**
 * HOC para criar ícones pré-coloridos
 */
export function withIconColor(
  Icon: ColoredIconProps['icon'],
  category?: ColoredIconProps['category']
) {
  return (props: Omit<ColoredIconProps, 'icon'>) => (
    <ColoredIcon icon={Icon} category={category} {...props} />
  );
}

