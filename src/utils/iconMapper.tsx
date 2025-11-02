/**
 * Sistema de Ícones Profissionais - Lucide React (Estilo Google Material Design)
 *
 * Características:
 * - Ícones limpos e profissionais estilo Google
 * - Sistema de cores: neutro (padrão) e colorido (cards de contrato)
 * - Totalmente compatível com React e TypeScript
 * - Performance otimizada com tree-shaking
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getIconColor, getIconColorColored } from './iconConfig';

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
export const FileText = withNeutralColor(LucideIcons.FileText, 'FileText');
export const File = withNeutralColor(LucideIcons.File, 'File');
export const FolderOpen = withNeutralColor(
  LucideIcons.FolderOpen,
  'FolderOpen'
);
export const Folder = withNeutralColor(LucideIcons.Folder, 'Folder');
export const FileCheck = withNeutralColor(LucideIcons.FileCheck, 'FileCheck');
export const FileBarChart = withNeutralColor(
  LucideIcons.FileBarChart,
  'FileBarChart'
);
export const ClipboardList = withNeutralColor(
  LucideIcons.ClipboardList,
  'ClipboardList'
);
export const Archive = withNeutralColor(LucideIcons.Archive, 'Archive');

// Ações Positivas
export const Check = withNeutralColor(LucideIcons.Check, 'Check');
export const CheckCheck = withNeutralColor(
  LucideIcons.CheckCheck,
  'CheckCheck'
);
export const CheckCircle = withNeutralColor(
  LucideIcons.CheckCircle,
  'CheckCircle'
);
export const CheckCircle2 = withNeutralColor(
  LucideIcons.CheckCircle2,
  'CheckCircle2'
);
export const CircleCheck = withNeutralColor(
  LucideIcons.CircleCheck,
  'CircleCheck'
);
export const Save = withNeutralColor(LucideIcons.Save, 'Save');
export const Download = withNeutralColor(LucideIcons.Download, 'Download');
export const Upload = withNeutralColor(LucideIcons.Upload, 'Upload');
export const Send = withNeutralColor(LucideIcons.Send, 'Send');
export const ThumbsUp = withNeutralColor(LucideIcons.ThumbsUp, 'ThumbsUp');

// Ações Negativas
export const Trash = withNeutralColor(LucideIcons.Trash, 'Trash');
export const Trash2 = withNeutralColor(LucideIcons.Trash2, 'Trash2');
export const X = withNeutralColor(LucideIcons.X, 'X');
export const XCircle = withNeutralColor(LucideIcons.XCircle, 'XCircle');
export const AlertTriangle = withNeutralColor(
  LucideIcons.AlertTriangle,
  'AlertTriangle'
);
export const AlertCircle = withNeutralColor(
  LucideIcons.AlertCircle,
  'AlertCircle'
);
export const ThumbsDown = withNeutralColor(
  LucideIcons.ThumbsDown,
  'ThumbsDown'
);

// Navegação
export const ArrowLeft = withNeutralColor(LucideIcons.ArrowLeft, 'ArrowLeft');
export const ArrowRight = withNeutralColor(
  LucideIcons.ArrowRight,
  'ArrowRight'
);
export const ChevronLeft = withNeutralColor(
  LucideIcons.ChevronLeft,
  'ChevronLeft'
);
export const ChevronRight = withNeutralColor(
  LucideIcons.ChevronRight,
  'ChevronRight'
);
export const ChevronDown = withNeutralColor(
  LucideIcons.ChevronDown,
  'ChevronDown'
);
export const ChevronUp = withNeutralColor(LucideIcons.ChevronUp, 'ChevronUp');
export const ChevronsUpDown = withNeutralColor(
  LucideIcons.ChevronsUpDown,
  'ChevronsUpDown'
);
export const Home = withNeutralColor(LucideIcons.Home, 'Home');
export const Menu = withNeutralColor(LucideIcons.Menu, 'Menu');
export const MoreVertical = withNeutralColor(
  LucideIcons.MoreVertical,
  'MoreVertical'
);
export const MoreHorizontal = withNeutralColor(
  LucideIcons.MoreHorizontal,
  'MoreHorizontal'
);

// Usuários e Pessoas
export const User = withNeutralColor(LucideIcons.User, 'User');
export const User2 = withNeutralColor(LucideIcons.User2, 'User2');
export const Users = withNeutralColor(LucideIcons.Users, 'Users');
export const UserPlus = withNeutralColor(LucideIcons.UserPlus, 'UserPlus');
export const UserCheck = withNeutralColor(LucideIcons.UserCheck, 'UserCheck');
export const UserCircle = withNeutralColor(
  LucideIcons.UserCircle,
  'UserCircle'
);
export const UserCog = withNeutralColor(LucideIcons.UserCog, 'UserCog');

// Sistema e Configurações
export const Settings = withNeutralColor(LucideIcons.Settings, 'Settings');
export const Database = withNeutralColor(LucideIcons.Database, 'Database');
export const Shield = withNeutralColor(LucideIcons.Shield, 'Shield');
export const Lock = withNeutralColor(LucideIcons.Lock, 'Lock');
export const Unlock = withNeutralColor(LucideIcons.Unlock, 'Unlock');
export const Key = withNeutralColor(LucideIcons.Key, 'Key');
export const Power = withNeutralColor(LucideIcons.Power, 'Power');
export const Briefcase = withNeutralColor(LucideIcons.Briefcase, 'Briefcase');
export const Wrench = withNeutralColor(LucideIcons.Wrench, 'Wrench');
export const Package = withNeutralColor(LucideIcons.Package, 'Package');

// Comunicação
export const MessageSquare = withNeutralColor(
  LucideIcons.MessageSquare,
  'MessageSquare'
);
export const MessageCircle = withNeutralColor(
  LucideIcons.MessageCircle,
  'MessageCircle'
);
export const Mail = withNeutralColor(LucideIcons.Mail, 'Mail');
export const Phone = withNeutralColor(LucideIcons.Phone, 'Phone');
export const Bot = withNeutralColor(LucideIcons.Bot, 'Bot');
export const Brain = withNeutralColor(LucideIcons.Brain, 'Brain');
export const Info = withNeutralColor(LucideIcons.Info, 'Info');
export const HelpCircle = withNeutralColor(
  LucideIcons.HelpCircle,
  'HelpCircle'
);
export const Mic = withNeutralColor(LucideIcons.Mic, 'Mic');
export const MicOff = withNeutralColor(LucideIcons.MicOff, 'MicOff');
export const Square = withNeutralColor(LucideIcons.Square, 'Square');
export const Bell = withNeutralColor(LucideIcons.Bell, 'Bell');

// Tempo e Calendário
export const Calendar = withNeutralColor(LucideIcons.Calendar, 'Calendar');
export const CalendarDays = withNeutralColor(
  LucideIcons.CalendarDays,
  'CalendarDays'
);
export const Clock = withNeutralColor(LucideIcons.Clock, 'Clock');
export const Timer = withNeutralColor(LucideIcons.Timer, 'Timer');

// Localização
export const MapPin = withNeutralColor(LucideIcons.MapPin, 'MapPin');
export const Building = withNeutralColor(LucideIcons.Building, 'Building');
export const Building2 = withNeutralColor(LucideIcons.Building2, 'Building2');

// Edição
export const Edit = withNeutralColor(LucideIcons.Edit, 'Edit');
export const Edit2 = withNeutralColor(LucideIcons.Edit2, 'Edit2');
export const Edit3 = withNeutralColor(LucideIcons.Edit3, 'Edit3');
export const SquarePen = withNeutralColor(LucideIcons.SquarePen, 'SquarePen');
export const Pencil = withNeutralColor(LucideIcons.Pencil, 'Pencil');
export const NotebookPen = withNeutralColor(
  LucideIcons.NotebookPen,
  'NotebookPen'
);

// Pesquisa e Filtros
export const Search = withNeutralColor(LucideIcons.Search, 'Search');
export const SearchCheck = withNeutralColor(
  LucideIcons.SearchCheck,
  'SearchCheck'
);
export const Filter = withNeutralColor(LucideIcons.Filter, 'Filter');
export const ZoomIn = withNeutralColor(LucideIcons.ZoomIn, 'ZoomIn');
export const ZoomOut = withNeutralColor(LucideIcons.ZoomOut, 'ZoomOut');
export const Tag = withNeutralColor(LucideIcons.Tag, 'Tag');

// Ações Gerais
export const Plus = withNeutralColor(LucideIcons.Plus, 'Plus');
export const PlusCircle = withNeutralColor(
  LucideIcons.PlusCircle,
  'PlusCircle'
);
export const Minus = withNeutralColor(LucideIcons.Minus, 'Minus');
export const MinusCircle = withNeutralColor(
  LucideIcons.MinusCircle,
  'MinusCircle'
);
export const Copy = withNeutralColor(LucideIcons.Copy, 'Copy');
export const Eye = withNeutralColor(LucideIcons.Eye, 'Eye');
export const EyeOff = withNeutralColor(LucideIcons.EyeOff, 'EyeOff');
export const LogOut = withNeutralColor(LucideIcons.LogOut, 'LogOut');
export const LogIn = withNeutralColor(LucideIcons.LogIn, 'LogIn');

// Mídia
export const Camera = withNeutralColor(LucideIcons.Camera, 'Camera');
export const Images = withNeutralColor(LucideIcons.Images, 'Images');
export const Image = withNeutralColor(LucideIcons.Image, 'Image');
export const ImageIcon = withNeutralColor(LucideIcons.Image, 'ImageIcon');
export const Play = withNeutralColor(LucideIcons.Play, 'Play');
export const PlayCircle = withNeutralColor(
  LucideIcons.PlayCircle,
  'PlayCircle'
);
export const Pause = withNeutralColor(LucideIcons.Pause, 'Pause');
export const Video = withNeutralColor(LucideIcons.Video, 'Video');
export const Circle = withNeutralColor(LucideIcons.Circle, 'Circle');

// Utilitários
export const Maximize2 = withNeutralColor(LucideIcons.Maximize2, 'Maximize2');
export const Minimize2 = withNeutralColor(LucideIcons.Minimize2, 'Minimize2');
export const Printer = withNeutralColor(LucideIcons.Printer, 'Printer');
export const RefreshCw = withNeutralColor(LucideIcons.RefreshCw, 'RefreshCw');
export const RotateCcw = withNeutralColor(LucideIcons.RotateCcw, 'RotateCcw');
export const Calculator = withNeutralColor(
  LucideIcons.Calculator,
  'Calculator'
);
export const Droplets = withNeutralColor(LucideIcons.Droplets, 'Droplets');
export const Zap = withNeutralColor(LucideIcons.Zap, 'Zap');
export const Flame = withNeutralColor(LucideIcons.Flame, 'Flame');

// Indicadores Visuais
export const Sparkles = withNeutralColor(LucideIcons.Sparkles, 'Sparkles');
export const Wand2 = withNeutralColor(LucideIcons.Wand2, 'Wand2');
export const Star = withNeutralColor(LucideIcons.Star, 'Star');
export const Heart = withNeutralColor(LucideIcons.Heart, 'Heart');

// Gráficos e Estatísticas
export const TrendingUp = withNeutralColor(
  LucideIcons.TrendingUp,
  'TrendingUp'
);
export const TrendingDown = withNeutralColor(
  LucideIcons.TrendingDown,
  'TrendingDown'
);
export const BarChart3 = withNeutralColor(LucideIcons.BarChart3, 'BarChart3');
export const BarChart = withNeutralColor(LucideIcons.BarChart, 'BarChart');
export const LineChart = withNeutralColor(LucideIcons.LineChart, 'LineChart');
export const PieChart = withNeutralColor(LucideIcons.PieChart, 'PieChart');

// Financeiro
export const DollarSign = withNeutralColor(
  LucideIcons.DollarSign,
  'DollarSign'
);
export const CreditCard = withNeutralColor(
  LucideIcons.CreditCard,
  'CreditCard'
);
export const Wallet = withNeutralColor(LucideIcons.Wallet, 'Wallet');

// Loading e Estados
export const Loader = withNeutralColor(LucideIcons.Loader, 'Loader');
export const Loader2 = withNeutralColor(LucideIcons.Loader2, 'Loader2');

// ====================================
// ÍCONES COLORIDOS (CARDS DE CONTRATO)
// ====================================

export const FileTextColored = withColoredStyle(
  LucideIcons.FileText,
  'FileText'
);
export const CalendarColored = withColoredStyle(
  LucideIcons.Calendar,
  'Calendar'
);
export const CalendarDaysColored = withColoredStyle(
  LucideIcons.CalendarDays,
  'CalendarDays'
);
export const UserColored = withColoredStyle(LucideIcons.User, 'User');
export const User2Colored = withColoredStyle(LucideIcons.User2, 'User2');
export const UsersColored = withColoredStyle(LucideIcons.Users, 'Users');
export const MapPinColored = withColoredStyle(LucideIcons.MapPin, 'MapPin');
export const BuildingColored = withColoredStyle(
  LucideIcons.Building,
  'Building'
);
export const Building2Colored = withColoredStyle(
  LucideIcons.Building2,
  'Building2'
);
export const EditColored = withColoredStyle(LucideIcons.Edit, 'Edit');
export const Edit2Colored = withColoredStyle(LucideIcons.Edit2, 'Edit2');
export const SearchCheckColored = withColoredStyle(
  LucideIcons.SearchCheck,
  'SearchCheck'
);
export const CheckCircleColored = withColoredStyle(
  LucideIcons.CheckCircle,
  'CheckCircle'
);
export const MessageSquareColored = withColoredStyle(
  LucideIcons.MessageSquare,
  'MessageSquare'
);
export const ClockColored = withColoredStyle(LucideIcons.Clock, 'Clock');
export const DollarSignColored = withColoredStyle(
  LucideIcons.DollarSign,
  'DollarSign'
);

// ====================================
// MAPEAMENTO PARA LOOKUP DINÂMICO
// ====================================

export type IconName = keyof typeof iconMapper;

export const iconMapper = {
  // Documentos
  FileText,
  File,
  FolderOpen,
  Folder,
  FileCheck,
  FileBarChart,
  ClipboardList,
  Archive,

  // Ações Positivas
  Check,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  CircleCheck,
  Save,
  Download,
  Upload,
  Send,
  ThumbsUp,

  // Ações Negativas
  Trash,
  Trash2,
  X,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ThumbsDown,

  // Navegação
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Home,
  Menu,
  MoreVertical,
  MoreHorizontal,

  // Usuários
  User,
  User2,
  Users,
  UserPlus,
  UserCheck,
  UserCircle,
  UserCog,

  // Sistema
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

  // Comunicação
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

  // Tempo
  Calendar,
  CalendarDays,
  Clock,
  Timer,

  // Localização
  MapPin,
  Building,
  Building2,

  // Edição
  Edit,
  Edit2,
  Edit3,
  SquarePen,
  Pencil,
  NotebookPen,

  // Pesquisa
  Search,
  SearchCheck,
  Filter,
  ZoomIn,
  ZoomOut,
  Tag,

  // Ações Gerais
  Plus,
  PlusCircle,
  Minus,
  MinusCircle,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  LogIn,

  // Mídia
  Camera,
  Images,
  Image,
  ImageIcon,
  Play,
  PlayCircle,
  Pause,
  Video,
  Circle,

  // Utilitários
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  RotateCcw,
  Calculator,
  Droplets,
  Zap,
  Flame,

  // Indicadores
  Sparkles,
  Wand2,
  Star,
  Heart,

  // Gráficos
  TrendingUp,
  TrendingDown,
  BarChart3,
  BarChart,
  LineChart,
  PieChart,

  // Financeiro
  DollarSign,
  CreditCard,
  Wallet,

  // Loading
  Loader,
  Loader2,
};

// ====================================
// HELPER PARA OBTER ÍCONE POR NOME
// ====================================

export function getIconByName(name: IconName) {
  return iconMapper[name] || File;
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
