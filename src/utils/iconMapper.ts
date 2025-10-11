/**
 * Mapeamento completo de ícones lucide-react → react-icons
 * Usando principalmente Phosphor Icons (duotone) para ícones coloridos
 */

import React from 'react';

// Phosphor Icons (Duotone para cores) - Apenas ícones que existem
import {
  PiFileTextDuotone as PiFileText,
  PiFileDuotone as PiFile,
  PiFolderOpenDuotone as PiFolderOpen,
  PiFolderDuotone as PiFolder,
  PiCheckDuotone as PiCheck,
  PiCheckCircleDuotone as PiCheckCircle,
  PiFloppyDiskDuotone as PiFloppyDisk,
  PiPaperPlaneRightDuotone as PiPaperPlaneRight,
  PiDownloadDuotone as PiDownload,
  PiTrashDuotone as PiTrash,
  PiXDuotone as PiX,
  PiWarningDuotone as PiWarning,
  PiWarningCircleDuotone as PiWarningCircle,
  PiArrowLeftDuotone as PiArrowLeft,
  PiArrowRightDuotone as PiArrowRight,
  PiCaretLeftDuotone as PiCaretLeft,
  PiCaretRightDuotone as PiCaretRight,
  PiCaretDownDuotone as PiCaretDown,
  PiCaretUpDuotone as PiCaretUp,
  PiHouseDuotone as PiHouse,
  PiListDuotone as PiList,
  PiDotsThreeVerticalDuotone as PiDotsThreeVertical,
  PiUserDuotone as PiUser,
  PiUsersDuotone as PiUsers,
  PiUserPlusDuotone as PiUserPlus,
  PiUserCircleDuotone as PiUserCircle,
  PiGearDuotone as PiGear,
  PiDatabaseDuotone as PiDatabase,
  PiShieldDuotone as PiShield,
  PiLockDuotone as PiLock,
  PiKeyDuotone as PiKey,
  PiPowerDuotone as PiPower,
  PiChatCircleDuotone as PiChatCircle,
  PiChatCircleDotsDuotone as PiChatCircleDots,
  PiEnvelopeDuotone as PiEnvelope,
  PiPhoneDuotone as PiPhone,
  PiCalendarDuotone as PiCalendar,
  PiClockDuotone as PiClock,
  PiTimerDuotone as PiTimer,
  PiMapPinDuotone as PiMapPin,
  PiBuildingDuotone as PiBuilding,
  PiBuildingsDuotone as PiBuildings,
  PiPencilSimpleDuotone as PiPencilSimple,
  PiCircleNotchDuotone as PiCircleNotch,
  PiMagnifyingGlassDuotone as PiMagnifyingGlass,
  PiFunnelDuotone as PiFunnel,
  PiPlusDuotone as PiPlus,
  PiMinusDuotone as PiMinus,
  PiEyeDuotone as PiEye,
  PiEyeClosedDuotone as PiEyeClosed,
  PiSignOutDuotone as PiSignOut,
  PiArchiveDuotone as PiArchive,
  PiBriefcaseDuotone as PiBriefcase,
  PiCalculatorDuotone as PiCalculator,
  PiCameraDuotone as PiCamera,
  PiImagesDuotone as PiImages,
  PiImageDuotone as PiImage,
  PiPackageDuotone as PiPackage,
  PiWrenchDuotone as PiWrench,
  PiArrowsOutDuotone as PiArrowsOut,
  PiArrowsInDuotone as PiArrowsIn,
  PiPrinterDuotone as PiPrinter,
  PiArrowClockwiseDuotone as PiArrowClockwise,
  PiSparkleDuotone as PiSparkle,
  PiMagicWandDuotone as PiMagicWand,
  PiRobotDuotone as PiRobot,
  PiTrendUpDuotone as PiTrendUp,
  PiTrendDownDuotone as PiTrendDown,
  PiChartBarDuotone as PiChartBar,
  PiInfoDuotone as PiInfo,
  PiQuestionDuotone as PiQuestion,
  PiThumbsUpDuotone as PiThumbsUp,
  PiThumbsDownDuotone as PiThumbsDown,
  PiMicrophoneDuotone as PiMicrophone,
  PiUploadDuotone as PiUpload,
  PiDropDuotone as PiDrop,
  PiLightningDuotone as PiLightning,
  PiFlameDuotone as PiFlame,
  PiPlayDuotone as PiPlay,
  PiPenNibDuotone as PiPenNib,
  PiClipboardTextDuotone as PiClipboardText,
  PiChartLineUpDuotone as PiChartLineUp,
  PiCopyDuotone as PiCopy,
  PiNotebookDuotone as PiNotebook,
  PiCurrencyDollarDuotone as PiCurrencyDollar,
  PiBrainDuotone as PiBrain,
  PiMagnifyingGlassPlusDuotone as PiMagnifyingGlassPlus,
  PiMagnifyingGlassMinusDuotone as PiMagnifyingGlassMinus,
  PiArrowsClockwiseDuotone as PiArrowsClockwise,
  PiCheckCircleDuotone as PiCircleCheck,
} from 'react-icons/pi';

// Hero Icons como fallback para ícones que não existem no Phosphor
import {
  HiOutlineDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

// Importar função de cores
import { getIconColor } from './iconConfig';

// Função helper para criar ícone com cor (sem JSX)
const withColor = (Icon: any, name: string) => {
  const ColoredIcon = (props: any) => {
    const color = getIconColor(name);
    return React.createElement(Icon, {
      ...props,
      style: { color, ...props.style },
    });
  };
  ColoredIcon.displayName = name;
  return ColoredIcon;
};

// Exportar com aliases para compatibilidade e cores aplicadas
export const FileText = withColor(PiFileText, 'FileText');
export const File = withColor(PiFile, 'File');
export const FolderOpen = withColor(PiFolderOpen, 'FolderOpen');
export const Folder = withColor(PiFolder, 'Folder');
export const FileCheck = withColor(HiOutlineDocumentCheck, 'FileCheck');
export const Check = withColor(PiCheck, 'Check');
export const CheckCircle = withColor(PiCheckCircle, 'CheckCircle');
export const CheckCircle2 = withColor(PiCheckCircle, 'CheckCircle2');
export const Save = withColor(PiFloppyDisk, 'Save');
export const Send = withColor(PiPaperPlaneRight, 'Send');
export const Download = withColor(PiDownload, 'Download');
export const Trash = withColor(PiTrash, 'Trash');
export const Trash2 = withColor(PiTrash, 'Trash2');
export const X = withColor(PiX, 'X');
export const AlertTriangle = withColor(PiWarning, 'AlertTriangle');
export const AlertCircle = withColor(PiWarningCircle, 'AlertCircle');
export const ArrowLeft = withColor(PiArrowLeft, 'ArrowLeft');
export const ArrowRight = withColor(PiArrowRight, 'ArrowRight');
export const ChevronLeft = withColor(PiCaretLeft, 'ChevronLeft');
export const ChevronRight = withColor(PiCaretRight, 'ChevronRight');
export const ChevronDown = withColor(PiCaretDown, 'ChevronDown');
export const ChevronUp = withColor(PiCaretUp, 'ChevronUp');
export const Home = withColor(PiHouse, 'Home');
export const Menu = withColor(PiList, 'Menu');
export const MoreVertical = withColor(PiDotsThreeVertical, 'MoreVertical');
export const User = withColor(PiUser, 'User');
export const Users = withColor(PiUsers, 'Users');
export const UserPlus = withColor(PiUserPlus, 'UserPlus');
export const UserCheck = withColor(PiUserCircle, 'UserCheck');
export const Settings = withColor(PiGear, 'Settings');
export const Database = withColor(PiDatabase, 'Database');
export const Shield = withColor(PiShield, 'Shield');
export const Lock = withColor(PiLock, 'Lock');
export const Key = withColor(PiKey, 'Key');
export const Power = withColor(PiPower, 'Power');
export const MessageSquare = withColor(PiChatCircle, 'MessageSquare');
export const MessageCircle = withColor(PiChatCircleDots, 'MessageCircle');
export const Mail = withColor(PiEnvelope, 'Mail');
export const Phone = withColor(PiPhone, 'Phone');
export const Calendar = withColor(PiCalendar, 'Calendar');
export const CalendarDays = withColor(PiCalendar, 'CalendarDays');
export const Clock = withColor(PiClock, 'Clock');
export const Timer = withColor(PiTimer, 'Timer');
export const MapPin = withColor(PiMapPin, 'MapPin');
export const Building = withColor(PiBuilding, 'Building');
export const Building2 = withColor(PiBuildings, 'Building2');
export const Edit = withColor(PiPencilSimple, 'Edit');
export const Loader = withColor(PiCircleNotch, 'Loader');
export const Search = withColor(PiMagnifyingGlass, 'Search');
export const Filter = withColor(PiFunnel, 'Filter');
export const Plus = withColor(PiPlus, 'Plus');
export const Minus = withColor(PiMinus, 'Minus');
export const Eye = withColor(PiEye, 'Eye');
export const EyeOff = withColor(PiEyeClosed, 'EyeOff');
export const LogOut = withColor(PiSignOut, 'LogOut');
export const Archive = withColor(PiArchive, 'Archive');
export const Briefcase = withColor(PiBriefcase, 'Briefcase');
export const Calculator = withColor(PiCalculator, 'Calculator');
export const Camera = withColor(PiCamera, 'Camera');
export const Images = withColor(PiImages, 'Images');
export const Image = withColor(PiImage, 'Image');
export const ImageIcon = withColor(PiImage, 'ImageIcon');
export const Package = withColor(PiPackage, 'Package');
export const Wrench = withColor(PiWrench, 'Wrench');
export const Maximize2 = withColor(PiArrowsOut, 'Maximize2');
export const Minimize2 = withColor(PiArrowsIn, 'Minimize2');
export const Printer = withColor(PiPrinter, 'Printer');
export const RefreshCw = withColor(PiArrowClockwise, 'RefreshCw');
export const Sparkles = withColor(PiSparkle, 'Sparkles');
export const Wand2 = withColor(PiMagicWand, 'Wand2');
export const Bot = withColor(PiRobot, 'Bot');
export const TrendingUp = withColor(PiTrendUp, 'TrendingUp');
export const TrendingDown = withColor(PiTrendDown, 'TrendingDown');
export const BarChart3 = withColor(PiChartBar, 'BarChart3');
export const Info = withColor(PiInfo, 'Info');
export const HelpCircle = withColor(PiQuestion, 'HelpCircle');
export const ThumbsUp = withColor(PiThumbsUp, 'ThumbsUp');
export const ThumbsDown = withColor(PiThumbsDown, 'ThumbsDown');
export const Mic = withColor(PiMicrophone, 'Mic');
export const Upload = withColor(PiUpload, 'Upload');
export const Droplets = withColor(PiDrop, 'Droplets');
export const Zap = withColor(PiLightning, 'Zap');
export const Flame = withColor(PiFlame, 'Flame');
export const Play = withColor(PiPlay, 'Play');
export const SquarePen = withColor(PiPenNib, 'SquarePen');
export const ClipboardList = withColor(PiClipboardText, 'ClipboardList');
export const FileBarChart = withColor(PiChartLineUp, 'FileBarChart');
export const User2 = withColor(PiUserCircle, 'User2');
export const SearchCheck = withColor(HiOutlineCheckCircle, 'SearchCheck');
export const Loader2 = withColor(HiOutlineArrowPath, 'Loader2');
export const Copy = withColor(PiCopy, 'Copy');
export const NotebookPen = withColor(PiNotebook, 'NotebookPen');
export const DollarSign = withColor(PiCurrencyDollar, 'DollarSign');
export const Brain = withColor(PiBrain, 'Brain');
export const ZoomIn = withColor(PiMagnifyingGlassPlus, 'ZoomIn');
export const ZoomOut = withColor(PiMagnifyingGlassMinus, 'ZoomOut');
export const RotateCcw = withColor(PiArrowsClockwise, 'RotateCcw');
export const CircleCheck = withColor(PiCircleCheck, 'CircleCheck');

// Tipo para mapeamento de ícones
export type IconName = keyof typeof iconMapper;

// Objeto de mapeamento para lookup dinâmico
export const iconMapper = {
  FileText,
  File,
  FolderOpen,
  Folder,
  FileCheck,
  Check,
  CheckCircle,
  CheckCircle2,
  Save,
  Send,
  Download,
  Trash,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Menu,
  MoreVertical,
  User,
  Users,
  UserPlus,
  UserCheck,
  Settings,
  Database,
  Shield,
  Lock,
  Key,
  Power,
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  MapPin,
  Building,
  Building2,
  Edit,
  Loader,
  Search,
  Filter,
  Plus,
  Minus,
  Eye,
  EyeOff,
  LogOut,
  Archive,
  Briefcase,
  Calculator,
  Camera,
  Images,
  Image,
  ImageIcon,
  Package,
  Wrench,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  Sparkles,
  Wand2,
  Bot,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Upload,
  Droplets,
  Zap,
  Flame,
  Play,
  SquarePen,
  ClipboardList,
  FileBarChart,
  User2,
  SearchCheck,
  Loader2,
  Copy,
  NotebookPen,
  DollarSign,
  Brain,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CircleCheck,
};
