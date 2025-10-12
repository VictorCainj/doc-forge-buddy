import { IconCategory } from '@/types/icons';

/**
 * SISTEMA DE CORES PARA ÍCONES LUCIDE REACT
 * Estilo Profissional Google Material Design
 * 
 * CONCEITO:
 * - Ícones NEUTROS (cinza) por padrão em toda aplicação
 * - Ícones COLORIDOS apenas nos cards de contrato para destaque
 */

/**
 * Esquema de cores NEUTRAS (padrão global)
 * Usado em 99% da aplicação
 */
export const iconColors: Record<IconCategory, string> = {
  document: '#6B7280',      // Cinza neutro
  success: '#6B7280',       // Cinza neutro
  danger: '#6B7280',        // Cinza neutro
  navigation: '#6B7280',    // Cinza neutro
  user: '#6B7280',          // Cinza neutro
  system: '#374151',        // Cinza escuro
  communication: '#6B7280', // Cinza neutro
  time: '#6B7280',          // Cinza neutro
  location: '#6B7280',      // Cinza neutro
  edit: '#6B7280',          // Cinza neutro
  loading: '#9CA3AF',       // Cinza claro
  neutral: '#6B7280',       // Cinza neutro
};

/**
 * Esquema de cores COLORIDAS (cards de contrato)
 * Paleta inspirada no Google Material Design 3
 */
export const iconColorsColored: Record<IconCategory, string> = {
  document: '#1976D2',      // 🔵 Azul Material - Documentos
  success: '#2E7D32',       // 🟢 Verde Material - Sucesso
  danger: '#D32F2F',        // 🔴 Vermelho Material - Perigo
  navigation: '#6B7280',    // ⚫ Cinza - Navegação
  user: '#7B1FA2',          // 🟣 Roxo Material - Usuários
  system: '#455A64',        // ⚫ Cinza Azulado - Sistema
  communication: '#0288D1', // 🔵 Ciano Material - Comunicação
  time: '#F57C00',          // 🟠 Laranja Material - Tempo
  location: '#C62828',      // 🔴 Vermelho Escuro - Localização
  edit: '#FBC02D',          // 🟡 Amarelo Material - Edição
  loading: '#9E9E9E',       // ⚫ Cinza - Loading
  neutral: '#616161',       // ⚫ Cinza Médio - Neutro
};

/**
 * Mapeamento completo de ícones Lucide para categorias
 * Organizado por contexto de uso
 */
export const iconCategories: Record<string, IconCategory> = {
  // ===== DOCUMENTOS E ARQUIVOS =====
  FileText: 'document',
  File: 'document',
  FolderOpen: 'document',
  Folder: 'document',
  FileCheck: 'document',
  FileBarChart: 'document',
  ClipboardList: 'document',
  Archive: 'document',
  
  // ===== AÇÕES POSITIVAS / SUCESSO =====
  Check: 'success',
  CheckCircle: 'success',
  CheckCircle2: 'success',
  CircleCheck: 'success',
  Save: 'success',
  Download: 'success',
  Upload: 'success',
  Send: 'success',
  ThumbsUp: 'success',
  PlusCircle: 'success',
  SearchCheck: 'success',
  Star: 'success',
  Heart: 'success',
  TrendingUp: 'success',
  Play: 'success',
  
  // ===== AÇÕES NEGATIVAS / PERIGO =====
  Trash: 'danger',
  Trash2: 'danger',
  X: 'danger',
  XCircle: 'danger',
  AlertTriangle: 'danger',
  AlertCircle: 'danger',
  ThumbsDown: 'danger',
  MinusCircle: 'danger',
  TrendingDown: 'danger',
  Flame: 'danger',
  
  // ===== NAVEGAÇÃO =====
  ArrowLeft: 'navigation',
  ArrowRight: 'navigation',
  ChevronLeft: 'navigation',
  ChevronRight: 'navigation',
  ChevronDown: 'navigation',
  ChevronUp: 'navigation',
  ChevronsUpDown: 'navigation',
  Home: 'navigation',
  Menu: 'navigation',
  MoreVertical: 'navigation',
  MoreHorizontal: 'navigation',
  
  // ===== USUÁRIOS E PESSOAS =====
  User: 'user',
  User2: 'user',
  Users: 'user',
  UserPlus: 'user',
  UserCheck: 'user',
  UserCircle: 'user',
  UserCog: 'user',
  
  // ===== SISTEMA E CONFIGURAÇÕES =====
  Settings: 'system',
  Database: 'system',
  Shield: 'system',
  Lock: 'system',
  Unlock: 'system',
  Key: 'system',
  Power: 'system',
  Briefcase: 'system',
  Wrench: 'system',
  Package: 'system',
  
  // ===== COMUNICAÇÃO =====
  MessageSquare: 'communication',
  MessageCircle: 'communication',
  Mail: 'communication',
  Phone: 'communication',
  Bot: 'communication',
  Brain: 'communication',
  Info: 'communication',
  HelpCircle: 'communication',
  Mic: 'communication',
  
  // ===== TEMPO E CALENDÁRIO =====
  Calendar: 'time',
  CalendarDays: 'time',
  Clock: 'time',
  Timer: 'time',
  
  // ===== LOCALIZAÇÃO =====
  MapPin: 'location',
  Building: 'location',
  Building2: 'location',
  
  // ===== EDIÇÃO =====
  Edit: 'edit',
  Edit2: 'edit',
  Edit3: 'edit',
  SquarePen: 'edit',
  Pencil: 'edit',
  NotebookPen: 'edit',
  
  // ===== CARREGAMENTO / PROGRESSO =====
  Loader: 'loading',
  Loader2: 'loading',
  
  // ===== NEUTROS / OUTROS =====
  Search: 'neutral',
  Filter: 'neutral',
  Plus: 'success',
  Minus: 'danger',
  Copy: 'neutral',
  Eye: 'neutral',
  EyeOff: 'neutral',
  LogOut: 'danger',
  LogIn: 'success',
  Camera: 'neutral',
  Images: 'document',
  Image: 'document',
  ImageIcon: 'document',
  Pause: 'neutral',
  Video: 'neutral',
  Maximize2: 'neutral',
  Minimize2: 'neutral',
  Printer: 'neutral',
  RefreshCw: 'neutral',
  RotateCcw: 'neutral',
  Calculator: 'neutral',
  Droplets: 'system',
  Zap: 'system',
  Sparkles: 'success',
  Wand2: 'success',
  BarChart3: 'neutral',
  BarChart: 'neutral',
  LineChart: 'neutral',
  PieChart: 'neutral',
  DollarSign: 'neutral',
  CreditCard: 'neutral',
  Wallet: 'neutral',
  ZoomIn: 'neutral',
  ZoomOut: 'neutral',
};

/**
 * Obtém a cor de um ícone baseado no seu nome
 * @param iconName Nome do ícone (ex: 'FileText', 'Calendar')
 * @param colored Se true, retorna cor colorida; se false, retorna cinza neutro
 * @returns Código hexadecimal da cor
 */
export function getIconColor(
  iconName: string,
  colored: boolean = false
): string {
  const category = iconCategories[iconName] || 'neutral';
  return colored ? iconColorsColored[category] : iconColors[category];
}

/**
 * Obtém a cor COLORIDA de um ícone
 * Atalho para getIconColor(iconName, true)
 * @param iconName Nome do ícone
 * @returns Código hexadecimal da cor colorida
 */
export function getIconColorColored(iconName: string): string {
  const category = iconCategories[iconName] || 'neutral';
  return iconColorsColored[category];
}

/**
 * Obtém a categoria semântica de um ícone
 * @param iconName Nome do ícone
 * @returns Categoria do ícone
 */
export function getIconCategory(iconName: string): IconCategory {
  return iconCategories[iconName] || 'neutral';
}

/**
 * Obtém a classe CSS Tailwind de cor para um ícone
 * Útil para estilização direta com Tailwind
 * @param iconName Nome do ícone
 * @returns Classe Tailwind (ex: 'text-blue-600')
 */
export function getIconColorClass(iconName: string): string {
  const category = getIconCategory(iconName);

  const colorClasses: Record<IconCategory, string> = {
    document: 'text-blue-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    navigation: 'text-gray-500',
    user: 'text-purple-600',
    system: 'text-gray-700',
    communication: 'text-cyan-600',
    time: 'text-orange-600',
    location: 'text-red-700',
    edit: 'text-yellow-600',
    loading: 'text-gray-400',
    neutral: 'text-gray-600',
  };

  return colorClasses[category];
}

/**
 * Verifica se um ícone existe no mapeamento
 * @param iconName Nome do ícone a verificar
 * @returns true se o ícone existe, false caso contrário
 */
export function iconExists(iconName: string): boolean {
  return iconName in iconCategories;
}
