import React from 'react';
import { getIconColor, getIconColorColored } from './iconConfig';

// Importação direta dos ícones centralizados
import * as Icons from '@/lib/icons';

// Re-export para compatibilidade
export * from '@/lib/icons';

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Cria um ícone com cor NEUTRA (padrão global)
 * Usado em toda a aplicação exceto cards de contrato
 */
const withNeutralColor = (Icon: any, name: string) => {
  const NeutralIcon = (props: any) => {
    // Permitir sobrescrita via props.color
    const defaultColor = getIconColor(name, false);
    const finalColor = props.color || defaultColor;

    return (
      <Icon
        {...props}
        color={finalColor}
        strokeWidth={props.strokeWidth || 2}
        style={{
          ...props.style,
          // Forçar a cor quando especificada
          ...(props.color && { color: props.color, stroke: props.color }),
        }}
      />
    );
  };
  NeutralIcon.displayName = name;
  return NeutralIcon;
};

/**
 * Cria um ícone com cor COLORIDA (cards de contrato)
 * Usa cores específicas por categoria semântica
 */
const withColoredStyle = (Icon: any, name: string) => {
  const ColoredIcon = (props: any) => {
    const color = getIconColorColored(name);
    return (
      <Icon
        {...props}
        color={color}
        strokeWidth={props.strokeWidth || 2.5}
        fill={props.fill}
        style={{ ...props.style }}
      />
    );
  };
  ColoredIcon.displayName = `${name}Colored`;
  return ColoredIcon;
};

// ====================================
// ÍCONES NEUTROS (PADRÃO GLOBAL)
// ====================================

// Documentos e Arquivos
export const FileTextIcon = withNeutralColor(Icons.FileText, 'FileText');
export const FileIcon = withNeutralColor(Icons.File, 'File');
export const FolderOpenIcon = withNeutralColor(Icons.FolderOpen, 'FolderOpen');
export const FolderIcon = withNeutralColor(Icons.Folder, 'Folder');
export const FileCheckIcon = withNeutralColor(Icons.FileCheck, 'FileCheck');
export const FileBarChartIcon = withNeutralColor(Icons.FileBarChart, 'FileBarChart');
export const ClipboardListIcon = withNeutralColor(Icons.ClipboardList, 'ClipboardList');
export const ArchiveIcon = withNeutralColor(Icons.Archive, 'Archive');

// Ações Positivas
export const CheckIcon = withNeutralColor(Icons.Check, 'Check');
export const CheckCheckIcon = withNeutralColor(Icons.CheckCheck, 'CheckCheck');
export const CheckCircleIcon = withNeutralColor(Icons.CheckCircle, 'CheckCircle');
export const CheckCircle2Icon = withNeutralColor(Icons.CheckCircle2, 'CheckCircle2');
export const CircleCheckIcon = withNeutralColor(Icons.CircleCheck, 'CircleCheck');
export const SaveIcon = withNeutralColor(Icons.Save, 'Save');
export const DownloadIcon = withNeutralColor(Icons.Download, 'Download');
export const UploadIcon = withNeutralColor(Icons.Upload, 'Upload');
export const SendIcon = withNeutralColor(Icons.Send, 'Send');
export const ThumbsUpIcon = withNeutralColor(Icons.ThumbsUp, 'ThumbsUp');

// Ações Negativas
export const TrashIcon = withNeutralColor(Icons.Trash, 'Trash');
export const Trash2Icon = withNeutralColor(Icons.Trash2, 'Trash2');
export const XIcon = withNeutralColor(Icons.X, 'X');
export const XCircleIcon = withNeutralColor(Icons.XCircle, 'XCircle');
export const AlertTriangleIcon = withNeutralColor(Icons.AlertTriangle, 'AlertTriangle');
export const AlertCircleIcon = withNeutralColor(Icons.AlertCircle, 'AlertCircle');
export const ThumbsDownIcon = withNeutralColor(Icons.ThumbsDown, 'ThumbsDown');

// Navegação
export const ArrowLeftIcon = withNeutralColor(Icons.ArrowLeft, 'ArrowLeft');
export const ArrowRightIcon = withNeutralColor(Icons.ArrowRight, 'ArrowRight');
export const ChevronLeftIcon = withNeutralColor(Icons.ChevronLeft, 'ChevronLeft');
export const ChevronRightIcon = withNeutralColor(Icons.ChevronRight, 'ChevronRight');
export const ChevronDownIcon = withNeutralColor(Icons.ChevronDown, 'ChevronDown');
export const ChevronUpIcon = withNeutralColor(Icons.ChevronUp, 'ChevronUp');
export const ChevronsUpDownIcon = withNeutralColor(Icons.ChevronsUpDown, 'ChevronsUpDown');
export const HomeIcon = withNeutralColor(Icons.Home, 'Home');
export const MenuIcon = withNeutralColor(Icons.Menu, 'Menu');
export const MoreVerticalIcon = withNeutralColor(Icons.MoreVertical, 'MoreVertical');
export const MoreHorizontalIcon = withNeutralColor(Icons.MoreHorizontal, 'MoreHorizontal');

// Usuários e Pessoas
export const UserIcon = withNeutralColor(Icons.User, 'User');
export const User2Icon = withNeutralColor(Icons.User2, 'User2');
export const UsersIcon = withNeutralColor(Icons.Users, 'Users');
export const UserPlusIcon = withNeutralColor(Icons.UserPlus, 'UserPlus');
export const UserCheckIcon = withNeutralColor(Icons.UserCheck, 'UserCheck');
export const UserCircleIcon = withNeutralColor(Icons.UserCircle, 'UserCircle');
export const UserCogIcon = withNeutralColor(Icons.UserCog, 'UserCog');

// Sistema e Configurações
export const SettingsIcon = withNeutralColor(Icons.Settings, 'Settings');
export const DatabaseIcon = withNeutralColor(Icons.Database, 'Database');
export const ShieldIcon = withNeutralColor(Icons.Shield, 'Shield');
export const LockIcon = withNeutralColor(Icons.Lock, 'Lock');
export const UnlockIcon = withNeutralColor(Icons.Unlock, 'Unlock');
export const KeyIcon = withNeutralColor(Icons.Key, 'Key');
export const PowerIcon = withNeutralColor(Icons.Power, 'Power');
export const BriefcaseIcon = withNeutralColor(Icons.Briefcase, 'Briefcase');
export const WrenchIcon = withNeutralColor(Icons.Wrench, 'Wrench');
export const PackageIcon = withNeutralColor(Icons.Package, 'Package');

// Comunicação
export const MessageSquareIcon = withNeutralColor(Icons.MessageSquare, 'MessageSquare');
export const MessageCircleIcon = withNeutralColor(Icons.MessageCircle, 'MessageCircle');
export const MailIcon = withNeutralColor(Icons.Mail, 'Mail');
export const PhoneIcon = withNeutralColor(Icons.Phone, 'Phone');
export const BotIcon = withNeutralColor(Icons.Bot, 'Bot');
export const BrainIcon = withNeutralColor(Icons.Brain, 'Brain');
export const InfoIcon = withNeutralColor(Icons.Info, 'Info');
export const HelpCircleIcon = withNeutralColor(Icons.HelpCircle, 'HelpCircle');
export const MicIcon = withNeutralColor(Icons.Mic, 'Mic');
export const MicOffIcon = withNeutralColor(Icons.MicOff, 'MicOff');
export const SquareIcon = withNeutralColor(Icons.Square, 'Square');
export const BellIcon = withNeutralColor(Icons.Bell, 'Bell');

// Tempo e Calendário
export const CalendarIcon = withNeutralColor(Icons.Calendar, 'Calendar');
export const CalendarDaysIcon = withNeutralColor(Icons.CalendarDays, 'CalendarDays');
export const ClockIcon = withNeutralColor(Icons.Clock, 'Clock');
export const TimerIcon = withNeutralColor(Icons.Timer, 'Timer');

// Localização
export const MapPinIcon = withNeutralColor(Icons.MapPin, 'MapPin');
export const BuildingIcon = withNeutralColor(Icons.Building, 'Building');
export const Building2Icon = withNeutralColor(Icons.Building2, 'Building2');

// Edição
export const EditIcon = withNeutralColor(Icons.Edit, 'Edit');
export const Edit2Icon = withNeutralColor(Icons.Edit2, 'Edit2');
export const Edit3Icon = withNeutralColor(Icons.Edit3, 'Edit3');
export const SquarePenIcon = withNeutralColor(Icons.SquarePen, 'SquarePen');
export const PencilIcon = withNeutralColor(Icons.Pencil, 'Pencil');
export const NotebookPenIcon = withNeutralColor(Icons.NotebookPen, 'NotebookPen');

// Pesquisa e Filtros
export const SearchIcon = withNeutralColor(Icons.Search, 'Search');
export const SearchCheckIcon = withNeutralColor(Icons.SearchCheck, 'SearchCheck');
export const FilterIcon = withNeutralColor(Icons.Filter, 'Filter');
export const ZoomInIcon = withNeutralColor(Icons.ZoomIn, 'ZoomIn');
export const ZoomOutIcon = withNeutralColor(Icons.ZoomOut, 'ZoomOut');
export const TagIcon = withNeutralColor(Icons.Tag, 'Tag');

// Ações Gerais
export const PlusIcon = withNeutralColor(Icons.Plus, 'Plus');
export const PlusCircleIcon = withNeutralColor(Icons.PlusCircle, 'PlusCircle');
export const MinusIcon = withNeutralColor(Icons.Minus, 'Minus');
export const MinusCircleIcon = withNeutralColor(Icons.MinusCircle, 'MinusCircle');
export const CopyIcon = withNeutralColor(Icons.Copy, 'Copy');
export const EyeIcon = withNeutralColor(Icons.Eye, 'Eye');
export const EyeOffIcon = withNeutralColor(Icons.EyeOff, 'EyeOff');
export const LogOutIcon = withNeutralColor(Icons.LogOut, 'LogOut');
export const LogInIcon = withNeutralColor(Icons.LogIn, 'LogIn');

// Mídia
export const CameraIcon = withNeutralColor(Icons.Camera, 'Camera');
export const ImagesIcon = withNeutralColor(Icons.Images, 'Images');
export const ImageIcon = withNeutralColor(Icons.Image, 'Image');
export const PlayIcon = withNeutralColor(Icons.Play, 'Play');
export const PlayCircleIcon = withNeutralColor(Icons.PlayCircle, 'PlayCircle');
export const PauseIcon = withNeutralColor(Icons.Pause, 'Pause');
export const VideoIcon = withNeutralColor(Icons.Video, 'Video');
export const CircleIcon = withNeutralColor(Icons.Circle, 'Circle');

// Utilitários
export const Maximize2Icon = withNeutralColor(Icons.Maximize2, 'Maximize2');
export const Minimize2Icon = withNeutralColor(Icons.Minimize2, 'Minimize2');
export const PrinterIcon = withNeutralColor(Icons.Printer, 'Printer');
export const RefreshCwIcon = withNeutralColor(Icons.RefreshCw, 'RefreshCw');
export const RotateCcwIcon = withNeutralColor(Icons.RotateCcw, 'RotateCcw');
export const CalculatorIcon = withNeutralColor(Icons.Calculator, 'Calculator');
export const DropletsIcon = withNeutralColor(Icons.Droplets, 'Droplets');
export const ZapIcon = withNeutralColor(Icons.Zap, 'Zap');
export const FlameIcon = withNeutralColor(Icons.Flame, 'Flame');

// Indicadores Visuais
export const SparklesIcon = withNeutralColor(Icons.Sparkles, 'Sparkles');
export const Wand2Icon = withNeutralColor(Icons.Wand2, 'Wand2');
export const StarIcon = withNeutralColor(Icons.Star, 'Star');
export const HeartIcon = withNeutralColor(Icons.Heart, 'Heart');

// Gráficos e Estatísticas
export const TrendingUpIcon = withNeutralColor(Icons.TrendingUp, 'TrendingUp');
export const TrendingDownIcon = withNeutralColor(Icons.TrendingDown, 'TrendingDown');
export const BarChart3Icon = withNeutralColor(Icons.BarChart3, 'BarChart3');
export const BarChartIcon = withNeutralColor(Icons.BarChart, 'BarChart');
export const LineChartIcon = withNeutralColor(Icons.LineChart, 'LineChart');
export const PieChartIcon = withNeutralColor(Icons.PieChart, 'PieChart');

// Financeiro
export const DollarSignIcon = withNeutralColor(Icons.DollarSign, 'DollarSign');
export const CreditCardIcon = withNeutralColor(Icons.CreditCard, 'CreditCard');
export const WalletIcon = withNeutralColor(Icons.Wallet, 'Wallet');

// Loading e Estados
export const LoaderIcon = withNeutralColor(Icons.Loader, 'Loader');
export const Loader2Icon = withNeutralColor(Icons.Loader2, 'Loader2');

// ====================================
// ÍCONES COLORIDOS (CARDS DE CONTRATO)
// ====================================

export const FileTextColored = withColoredStyle(Icons.FileText, 'FileText');
export const CalendarColored = withColoredStyle(Icons.Calendar, 'Calendar');
export const CalendarDaysColored = withColoredStyle(Icons.CalendarDays, 'CalendarDays');
export const UserColored = withColoredStyle(Icons.User, 'User');
export const User2Colored = withColoredStyle(Icons.User2, 'User2');
export const UsersColored = withColoredStyle(Icons.Users, 'Users');
export const MapPinColored = withColoredStyle(Icons.MapPin, 'MapPin');
export const BuildingColored = withColoredStyle(Icons.Building, 'Building');
export const Building2Colored = withColoredStyle(Icons.Building2, 'Building2');
export const EditColored = withColoredStyle(Icons.Edit, 'Edit');
export const Edit2Colored = withColoredStyle(Icons.Edit2, 'Edit2');
export const SearchCheckColored = withColoredStyle(Icons.SearchCheck, 'SearchCheck');
export const CheckCircleColored = withColoredStyle(Icons.CheckCircle, 'CheckCircle');
export const MessageSquareColored = withColoredStyle(Icons.MessageSquare, 'MessageSquare');
export const ClockColored = withColoredStyle(Icons.Clock, 'Clock');
export const DollarSignColored = withColoredStyle(Icons.DollarSign, 'DollarSign');

// ====================================
// MAPEAMENTO PARA LOOKUP DINÂMICO
// ====================================

export type IconName = 
  | 'FileText' | 'File' | 'FolderOpen' | 'Folder' | 'FileCheck' | 'FileBarChart' | 'ClipboardList' | 'Archive'
  | 'Check' | 'CheckCheck' | 'CheckCircle' | 'CheckCircle2' | 'CircleCheck' | 'Save' | 'Download' | 'Upload' | 'Send' | 'ThumbsUp'
  | 'Trash' | 'Trash2' | 'X' | 'XCircle' | 'AlertTriangle' | 'AlertCircle' | 'ThumbsDown'
  | 'ArrowLeft' | 'ArrowRight' | 'ChevronLeft' | 'ChevronRight' | 'ChevronDown' | 'ChevronUp' | 'ChevronsUpDown' | 'Home' | 'Menu' | 'MoreVertical' | 'MoreHorizontal'
  | 'User' | 'User2' | 'Users' | 'UserPlus' | 'UserCheck' | 'UserCircle' | 'UserCog'
  | 'Settings' | 'Database' | 'Shield' | 'Lock' | 'Unlock' | 'Key' | 'Power' | 'Briefcase' | 'Wrench' | 'Package'
  | 'MessageSquare' | 'MessageCircle' | 'Mail' | 'Phone' | 'Bot' | 'Brain' | 'Info' | 'HelpCircle' | 'Mic' | 'MicOff' | 'Square' | 'Bell'
  | 'Calendar' | 'CalendarDays' | 'Clock' | 'Timer'
  | 'MapPin' | 'Building' | 'Building2'
  | 'Edit' | 'Edit2' | 'Edit3' | 'SquarePen' | 'Pencil' | 'NotebookPen'
  | 'Search' | 'SearchCheck' | 'Filter' | 'ZoomIn' | 'ZoomOut' | 'Tag'
  | 'Plus' | 'PlusCircle' | 'Minus' | 'MinusCircle' | 'Copy' | 'Eye' | 'EyeOff' | 'LogOut' | 'LogIn'
  | 'Camera' | 'Images' | 'Image' | 'Play' | 'PlayCircle' | 'Pause' | 'Video' | 'Circle'
  | 'Maximize2' | 'Minimize2' | 'Printer' | 'RefreshCw' | 'RotateCcw' | 'Calculator' | 'Droplets' | 'Zap' | 'Flame'
  | 'Sparkles' | 'Wand2' | 'Star' | 'Heart'
  | 'TrendingUp' | 'TrendingDown' | 'BarChart3' | 'BarChart' | 'LineChart' | 'PieChart'
  | 'DollarSign' | 'CreditCard' | 'Wallet'
  | 'Loader' | 'Loader2';

export const iconMapper: Record<IconName, React.ComponentType<any>> = {
  // Documentos
  FileText: FileTextIcon,
  File: FileIcon,
  FolderOpen: FolderOpenIcon,
  Folder: FolderIcon,
  FileCheck: FileCheckIcon,
  FileBarChart: FileBarChartIcon,
  ClipboardList: ClipboardListIcon,
  Archive: ArchiveIcon,

  // Ações Positivas
  Check: CheckIcon,
  CheckCheck: CheckCheckIcon,
  CheckCircle: CheckCircleIcon,
  CheckCircle2: CheckCircle2Icon,
  CircleCheck: CircleCheckIcon,
  Save: SaveIcon,
  Download: DownloadIcon,
  Upload: UploadIcon,
  Send: SendIcon,
  ThumbsUp: ThumbsUpIcon,

  // Ações Negativas
  Trash: TrashIcon,
  Trash2: Trash2Icon,
  X: XIcon,
  XCircle: XCircleIcon,
  AlertTriangle: AlertTriangleIcon,
  AlertCircle: AlertCircleIcon,
  ThumbsDown: ThumbsDownIcon,

  // Navegação
  ArrowLeft: ArrowLeftIcon,
  ArrowRight: ArrowRightIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  ChevronDown: ChevronDownIcon,
  ChevronUp: ChevronUpIcon,
  ChevronsUpDown: ChevronsUpDownIcon,
  Home: HomeIcon,
  Menu: MenuIcon,
  MoreVertical: MoreVerticalIcon,
  MoreHorizontal: MoreHorizontalIcon,

  // Usuários
  User: UserIcon,
  User2: User2Icon,
  Users: UsersIcon,
  UserPlus: UserPlusIcon,
  UserCheck: UserCheckIcon,
  UserCircle: UserCircleIcon,
  UserCog: UserCogIcon,

  // Sistema
  Settings: SettingsIcon,
  Database: DatabaseIcon,
  Shield: ShieldIcon,
  Lock: LockIcon,
  Unlock: UnlockIcon,
  Key: KeyIcon,
  Power: PowerIcon,
  Briefcase: BriefcaseIcon,
  Wrench: WrenchIcon,
  Package: PackageIcon,

  // Comunicação
  MessageSquare: MessageSquareIcon,
  MessageCircle: MessageCircleIcon,
  Mail: MailIcon,
  Phone: PhoneIcon,
  Bot: BotIcon,
  Brain: BrainIcon,
  Info: InfoIcon,
  HelpCircle: HelpCircleIcon,
  Mic: MicIcon,
  MicOff: MicOffIcon,
  Square: SquareIcon,
  Bell: BellIcon,

  // Tempo
  Calendar: CalendarIcon,
  CalendarDays: CalendarDaysIcon,
  Clock: ClockIcon,
  Timer: TimerIcon,

  // Localização
  MapPin: MapPinIcon,
  Building: BuildingIcon,
  Building2: Building2Icon,

  // Edição
  Edit: EditIcon,
  Edit2: Edit2Icon,
  Edit3: Edit3Icon,
  SquarePen: SquarePenIcon,
  Pencil: PencilIcon,
  NotebookPen: NotebookPenIcon,

  // Pesquisa
  Search: SearchIcon,
  SearchCheck: SearchCheckIcon,
  Filter: FilterIcon,
  ZoomIn: ZoomInIcon,
  ZoomOut: ZoomOutIcon,
  Tag: TagIcon,

  // Ações Gerais
  Plus: PlusIcon,
  PlusCircle: PlusCircleIcon,
  Minus: MinusIcon,
  MinusCircle: MinusCircleIcon,
  Copy: CopyIcon,
  Eye: EyeIcon,
  EyeOff: EyeOffIcon,
  LogOut: LogOutIcon,
  LogIn: LogInIcon,

  // Mídia
  Camera: CameraIcon,
  Images: ImagesIcon,
  Image: ImageIcon,
  Play: PlayIcon,
  PlayCircle: PlayCircleIcon,
  Pause: PauseIcon,
  Video: VideoIcon,
  Circle: CircleIcon,

  // Utilitários
  Maximize2: Maximize2Icon,
  Minimize2: Minimize2Icon,
  Printer: PrinterIcon,
  RefreshCw: RefreshCwIcon,
  RotateCcw: RotateCcwIcon,
  Calculator: CalculatorIcon,
  Droplets: DropletsIcon,
  Zap: ZapIcon,
  Flame: FlameIcon,

  // Indicadores
  Sparkles: SparklesIcon,
  Wand2: Wand2Icon,
  Star: StarIcon,
  Heart: HeartIcon,

  // Gráficos
  TrendingUp: TrendingUpIcon,
  TrendingDown: TrendingDownIcon,
  BarChart3: BarChart3Icon,
  BarChart: BarChartIcon,
  LineChart: LineChartIcon,
  PieChart: PieChartIcon,

  // Financeiro
  DollarSign: DollarSignIcon,
  CreditCard: CreditCardIcon,
  Wallet: WalletIcon,

  // Loading
  Loader: LoaderIcon,
  Loader2: Loader2Icon,
};

// ====================================
// HELPER PARA OBTER ÍCONE POR NOME
// ====================================

export function getIconByName(name: IconName) {
  return iconMapper[name] || FileTextIcon;
}

// ====================================
// WRAPPER PARA ÍCONES EM FUNDOS ESCUROS
// ====================================

/**
 * Wrapper para ícones em fundos escuros
 * Garante máxima visibilidade com branco forte
 */
export const withDarkBackground = (IconComponent: any) => {
  return (props: any) => (
    <IconComponent
      {...props}
      color="#FFFFFF"
      strokeWidth={props.strokeWidth || 2.5}
      style={{
        ...props.style,
        color: '#FFFFFF',
        stroke: '#FFFFFF',
        fill: props.fill || 'none',
        shapeRendering: 'geometricPrecision',
      }}
    />
  );
};

// ====================================
// LAZY LOADING PARA ÍCONES NÃO CRÍTICOS
// ====================================

/**
 * Lazy loading para ícones que não são críticos para o carregamento inicial
 * Reduz ainda mais o bundle size para páginas não imediatamente visíveis
 */
export const lazyIcons = {
  Chart: () => import('lucide-react').then(module => module.BarChart3),
  Analytics: () => import('lucide-react').then(module => module.TrendingUp),
  Report: () => import('lucide-react').then(module => module.FileBarChart),
  Settings: () => import('lucide-react').then(module => module.Settings),
  Help: () => import('lucide-react').then(module => module.HelpCircle),
  Feedback: () => import('lucide-react').then(module => module.MessageSquare),
};

// ====================================
// EXPORTAÇÕES DIRETAS PARA COMPATIBILIDADE
// ====================================

// Exportar FileText diretamente para evitar "FileText is not defined"
export const FileText = Icons.FileText;

// Exportar outros ícones principais para compatibilidade
export {
  File,
  FolderOpen,
  Folder,
  FileCheck,
  FileBarChart,
  ClipboardList,
  Archive,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckCheck,
  CircleCheck,
  Save,
  ThumbsUp,
  Download,
  Upload,
  Send,
  X,
  XCircle,
  Trash,
  Trash2,
  AlertTriangle,
  AlertCircle,
  ThumbsDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Menu,
  Home,
  MoreVertical,
  MoreHorizontal,
  User,
  User2,
  Users,
  UserPlus,
  UserCheck,
  UserCircle,
  UserCog,
  Settings,
  Database,
  Shield,
  Lock,
  Unlock,
  Key,
  Power,
  Briefcase,
  Wrench,
  Package,
  Eye,
  EyeOff,
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  Bot,
  Brain,
  Info,
  HelpCircle,
  Mic,
  MicOff,
  Square,
  Bell,
  Sparkles,
  Wand2,
  Lightbulb,
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  MapPin,
  Building,
  Building2,
  Edit,
  Edit2,
  Edit3,
  SquarePen,
  Pencil,
  NotebookPen,
  Copy,
  Search,
  SearchCheck,
  Filter,
  ZoomIn,
  ZoomOut,
  Tag,
  Plus,
  PlusCircle,
  Minus,
  MinusCircle,
  LogOut,
  LogIn,
  Camera,
  Images,
  Image,
  Play,
  PlayCircle,
  Pause,
  Video,
  Circle,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  RotateCcw,
  Calculator,
  Droplets,
  Zap,
  Flame,
  Loader,
  Loader2,
  Star,
  Heart,
  Activity,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  BarChart,
  LineChart,
  PieChart,
  DollarSign,
  CreditCard,
  Wallet,
  Cpu,
  Hash,
  Share2,
  Monitor,
  ShoppingCart,
  Palette,
  BookOpen,
  Grid3X3,
  Code,
  WifiOff,
  HardDrive,
  Wifi,
  Smartphone,
  Globe
} from '@/lib/icons';