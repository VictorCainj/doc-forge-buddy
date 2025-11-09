import React from 'react';

/**
 * Tipos de Ícones - Sistema Lucide React
 * Estilo Profissional Google Material Design
 */

/**
 * Tipo base para ícones da aplicação
 * Utilizado em toda a aplicação para garantir consistência
 */
export type AppIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * Categorias de ícones para aplicação de cores
 * Cada categoria possui um esquema de cores específico
 */
export type IconCategory =
  | 'document'      // Arquivos, documentos, pastas
  | 'success'       // Ações positivas, confirmações
  | 'danger'        // Ações negativas, alertas, exclusões
  | 'navigation'    // Navegação, setas, menus
  | 'user'          // Usuários, pessoas, perfis
  | 'system'        // Configurações, sistema, ferramentas
  | 'communication' // Chat, mensagens, comunicação
  | 'time'          // Calendário, relógio, tempo
  | 'location'      // Localização, endereços, mapas
  | 'edit'          // Edição, lápis, canetas
  | 'loading'       // Carregamento, progresso
  | 'neutral';      // Padrão, neutro

/**
 * Props para componente de ícone colorido
 */
export interface ColoredIconProps {
  icon: AppIcon;
  category?: IconCategory;
  size?: number | string;
  className?: string;
  color?: string; // Cor customizada que sobrescreve a categoria
  strokeWidth?: number;
}

/**
 * Props para ícone padrão (Lucide React)
 */
export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}
