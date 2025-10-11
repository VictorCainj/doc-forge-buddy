import { IconCategory } from '@/types/icons';

/**
 * Esquema de cores para ícones por categoria
 */
export const iconColors: Record<IconCategory, string> = {
  document: '#3B82F6', // Azul - Documentos/Arquivos
  success: '#10B981', // Verde - Ações positivas/sucesso
  danger: '#EF4444', // Vermelho - Ações negativas/exclusão
  navigation: '#6B7280', // Cinza neutro - Navegação
  user: '#8B5CF6', // Roxo - Usuários/Pessoas
  system: '#374151', // Cinza escuro - Configurações/Sistema
  communication: '#06B6D4', // Azul claro - Chat/Comunicação
  time: '#F59E0B', // Laranja - Calendário/Tempo
  location: '#DC2626', // Vermelho escuro - Localização
  edit: '#FBBF24', // Amarelo - Edição
  loading: '#9CA3AF', // Cinza - Carregamento/Progresso
  neutral: '#6B7280', // Cinza neutro - Padrão
};

/**
 * Mapeamento de nomes de ícones para categorias
 * Usado para aplicar cores automaticamente
 */
export const iconCategories: Record<string, IconCategory> = {
  // Documentos/Arquivos
  FileText: 'document',
  File: 'document',
  FolderOpen: 'document',
  Folder: 'document',
  FileCheck: 'document',
  FileBarChart: 'document',
  ClipboardList: 'document',

  // Ações Positivas/Sucesso
  Check: 'success',
  CheckCircle: 'success',
  CheckCircle2: 'success',
  Save: 'success',
  Download: 'success',
  CircleCheck: 'success',

  // Ações Negativas/Exclusão
  Trash: 'danger',
  Trash2: 'danger',
  X: 'danger',
  AlertTriangle: 'danger',
  AlertCircle: 'danger',

  // Navegação
  ArrowLeft: 'navigation',
  ArrowRight: 'navigation',
  ChevronLeft: 'navigation',
  ChevronRight: 'navigation',
  ChevronDown: 'navigation',
  ChevronUp: 'navigation',
  Home: 'navigation',
  Menu: 'navigation',
  MoreVertical: 'navigation',

  // Usuários/Pessoas
  User: 'user',
  User2: 'user',
  Users: 'user',
  UserPlus: 'user',

  // Configurações/Sistema
  Settings: 'system',
  Database: 'system',
  Shield: 'system',
  Lock: 'system',
  Key: 'system',
  Power: 'system',

  // Chat/Comunicação
  MessageSquare: 'communication',
  MessageCircle: 'communication',
  Mail: 'communication',
  Phone: 'communication',

  // Calendário/Tempo
  Calendar: 'time',
  Clock: 'time',

  // Localização
  MapPin: 'location',
  Building: 'location',
  Building2: 'location',

  // Edição
  Edit: 'edit',
  SquarePen: 'edit',
  Pencil: 'edit',

  // Carregamento/Progresso
  Loader: 'loading',
  Loader2: 'loading',

  // Outros (categoria padrão: neutral)
  Search: 'neutral',
  SearchCheck: 'success',
  NotebookPen: 'edit',
  DollarSign: 'neutral',
  Brain: 'communication',
  ZoomIn: 'neutral',
  ZoomOut: 'neutral',
  RotateCcw: 'neutral',
  Filter: 'neutral',
  Plus: 'success',
  Minus: 'danger',
  Eye: 'neutral',
  EyeOff: 'neutral',
  LogOut: 'danger',
  Archive: 'document',
  Briefcase: 'system',
  Calculator: 'neutral',
  Camera: 'neutral',
  Images: 'document',
  Image: 'document',
  Package: 'neutral',
  Wrench: 'neutral',
  Maximize2: 'neutral',
  Minimize2: 'neutral',
  RefreshCw: 'neutral',
  Sparkles: 'success',
  Bot: 'communication',
  TrendingUp: 'success',
  TrendingDown: 'danger',
  BarChart3: 'neutral',
  Info: 'communication',
  HelpCircle: 'communication',
  ThumbsUp: 'success',
  ThumbsDown: 'danger',
  Mic: 'communication',
  Upload: 'success',
  Droplets: 'system',
  Zap: 'system',
  Flame: 'danger',
  Play: 'success',
};

/**
 * Obtém a cor de um ícone baseado no seu nome
 */
export function getIconColor(iconName: string): string {
  const category = iconCategories[iconName] || 'neutral';
  return iconColors[category];
}

/**
 * Obtém a categoria de um ícone baseado no seu nome
 */
export function getIconCategory(iconName: string): IconCategory {
  return iconCategories[iconName] || 'neutral';
}

/**
 * Obtém a classe CSS Tailwind de cor para um ícone
 */
export function getIconColorClass(iconName: string): string {
  const category = getIconCategory(iconName);

  const colorClasses: Record<IconCategory, string> = {
    document: 'text-blue-500',
    success: 'text-green-500',
    danger: 'text-red-500',
    navigation: 'text-gray-500',
    user: 'text-purple-500',
    system: 'text-gray-700',
    communication: 'text-cyan-500',
    time: 'text-orange-500',
    location: 'text-red-700',
    edit: 'text-yellow-500',
    loading: 'text-gray-400',
    neutral: 'text-gray-500',
  };

  return colorClasses[category];
}
