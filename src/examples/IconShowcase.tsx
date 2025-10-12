/**
 * COMPONENTE DE DEMONSTRAÇÃO - Sistema de Ícones Lucide React
 * Estilo Profissional Google Material Design
 * 
 * Este componente demonstra todos os ícones disponíveis e seus estilos
 */

import React from 'react';
import {
  // Documentos
  FileText,
  File,
  FolderOpen,
  Folder,
  FileCheck,
  ClipboardList,
  Archive,
  
  // Ações Positivas
  Check,
  CheckCircle,
  Save,
  Download,
  Upload,
  Send,
  ThumbsUp,
  
  // Ações Negativas
  Trash,
  Trash2,
  X,
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
  Home,
  Menu,
  
  // Usuários
  User,
  Users,
  UserPlus,
  UserCircle,
  
  // Sistema
  Settings,
  Database,
  Shield,
  Lock,
  Key,
  Power,
  
  // Comunicação
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  Bot,
  Brain,
  Info,
  
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
  Pencil,
  NotebookPen,
  
  // Pesquisa
  Search,
  SearchCheck,
  Filter,
  
  // Mídia
  Camera,
  Images,
  Image,
  Play,
  
  // Ícones COLORIDOS (Cards de Contrato)
  FileTextColored,
  CalendarColored,
  UserColored,
  User2Colored,
  MapPinColored,
  EditColored,
  SearchCheckColored,
} from '@/utils/iconMapper';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IconDemoProps {
  icon: React.ComponentType<any>;
  name: string;
}

const IconDemo: React.FC<IconDemoProps> = ({ icon: Icon, name }) => (
  <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
    <Icon className="h-6 w-6" />
    <span className="text-xs text-gray-600">{name}</span>
  </div>
);

export const IconShowcase: React.FC = () => {
  const iconGroups = [
    {
      title: '📄 Documentos e Arquivos',
      description: 'Ícones para representar documentos, pastas e arquivos',
      icons: [
        { icon: FileText, name: 'FileText' },
        { icon: File, name: 'File' },
        { icon: FolderOpen, name: 'FolderOpen' },
        { icon: Folder, name: 'Folder' },
        { icon: FileCheck, name: 'FileCheck' },
        { icon: ClipboardList, name: 'ClipboardList' },
        { icon: Archive, name: 'Archive' },
      ],
    },
    {
      title: '✅ Ações Positivas',
      description: 'Ícones para sucesso, confirmação e ações positivas',
      icons: [
        { icon: Check, name: 'Check' },
        { icon: CheckCircle, name: 'CheckCircle' },
        { icon: Save, name: 'Save' },
        { icon: Download, name: 'Download' },
        { icon: Upload, name: 'Upload' },
        { icon: Send, name: 'Send' },
        { icon: ThumbsUp, name: 'ThumbsUp' },
      ],
    },
    {
      title: '❌ Ações Negativas',
      description: 'Ícones para exclusão, alertas e ações negativas',
      icons: [
        { icon: Trash, name: 'Trash' },
        { icon: Trash2, name: 'Trash2' },
        { icon: X, name: 'X' },
        { icon: AlertTriangle, name: 'AlertTriangle' },
        { icon: AlertCircle, name: 'AlertCircle' },
        { icon: ThumbsDown, name: 'ThumbsDown' },
      ],
    },
    {
      title: '🧭 Navegação',
      description: 'Ícones para navegação, setas e menus',
      icons: [
        { icon: ArrowLeft, name: 'ArrowLeft' },
        { icon: ArrowRight, name: 'ArrowRight' },
        { icon: ChevronLeft, name: 'ChevronLeft' },
        { icon: ChevronRight, name: 'ChevronRight' },
        { icon: ChevronDown, name: 'ChevronDown' },
        { icon: ChevronUp, name: 'ChevronUp' },
        { icon: Home, name: 'Home' },
        { icon: Menu, name: 'Menu' },
      ],
    },
    {
      title: '👥 Usuários',
      description: 'Ícones para usuários, pessoas e perfis',
      icons: [
        { icon: User, name: 'User' },
        { icon: Users, name: 'Users' },
        { icon: UserPlus, name: 'UserPlus' },
        { icon: UserCircle, name: 'UserCircle' },
      ],
    },
    {
      title: '⚙️ Sistema',
      description: 'Ícones para configurações, sistema e ferramentas',
      icons: [
        { icon: Settings, name: 'Settings' },
        { icon: Database, name: 'Database' },
        { icon: Shield, name: 'Shield' },
        { icon: Lock, name: 'Lock' },
        { icon: Key, name: 'Key' },
        { icon: Power, name: 'Power' },
      ],
    },
    {
      title: '💬 Comunicação',
      description: 'Ícones para mensagens, comunicação e informação',
      icons: [
        { icon: MessageSquare, name: 'MessageSquare' },
        { icon: MessageCircle, name: 'MessageCircle' },
        { icon: Mail, name: 'Mail' },
        { icon: Phone, name: 'Phone' },
        { icon: Bot, name: 'Bot' },
        { icon: Brain, name: 'Brain' },
        { icon: Info, name: 'Info' },
      ],
    },
    {
      title: '🕐 Tempo',
      description: 'Ícones para calendário, relógio e tempo',
      icons: [
        { icon: Calendar, name: 'Calendar' },
        { icon: CalendarDays, name: 'CalendarDays' },
        { icon: Clock, name: 'Clock' },
        { icon: Timer, name: 'Timer' },
      ],
    },
    {
      title: '📍 Localização',
      description: 'Ícones para localização, endereços e construções',
      icons: [
        { icon: MapPin, name: 'MapPin' },
        { icon: Building, name: 'Building' },
        { icon: Building2, name: 'Building2' },
      ],
    },
    {
      title: '✏️ Edição',
      description: 'Ícones para edição e escrita',
      icons: [
        { icon: Edit, name: 'Edit' },
        { icon: Pencil, name: 'Pencil' },
        { icon: NotebookPen, name: 'NotebookPen' },
      ],
    },
    {
      title: '🔍 Pesquisa',
      description: 'Ícones para pesquisa e filtros',
      icons: [
        { icon: Search, name: 'Search' },
        { icon: SearchCheck, name: 'SearchCheck' },
        { icon: Filter, name: 'Filter' },
      ],
    },
    {
      title: '📷 Mídia',
      description: 'Ícones para mídia e imagens',
      icons: [
        { icon: Camera, name: 'Camera' },
        { icon: Images, name: 'Images' },
        { icon: Image, name: 'Image' },
        { icon: Play, name: 'Play' },
      ],
    },
  ];

  const coloredIcons = {
    title: '🎨 Ícones Coloridos (Cards de Contrato)',
    description: 'Versões coloridas para uso em cards de contrato com paleta Material Design',
    icons: [
      { icon: FileTextColored, name: 'FileTextColored' },
      { icon: CalendarColored, name: 'CalendarColored' },
      { icon: UserColored, name: 'UserColored' },
      { icon: User2Colored, name: 'User2Colored' },
      { icon: MapPinColored, name: 'MapPinColored' },
      { icon: EditColored, name: 'EditColored' },
      { icon: SearchCheckColored, name: 'SearchCheckColored' },
    ],
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Cabeçalho */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          🎨 Sistema de Ícones Lucide React
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Biblioteca completa de ícones profissionais estilo Google Material Design.
          Todos os ícones são consistentes, modernos e otimizados para performance.
        </p>
      </div>

      {/* Ícones Neutros */}
      {iconGroups.map((group, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <p className="text-sm text-gray-600">{group.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {group.icons.map((iconItem, iconIndex) => (
                <IconDemo
                  key={iconIndex}
                  icon={iconItem.icon}
                  name={iconItem.name}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Ícones Coloridos */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>{coloredIcons.title}</CardTitle>
          <p className="text-sm text-gray-700">{coloredIcons.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {coloredIcons.icons.map((iconItem, iconIndex) => (
              <IconDemo
                key={iconIndex}
                icon={iconItem.icon}
                name={iconItem.name}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guia de Uso */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>📖 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Importar Ícones Neutros (Padrão)
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{`import { FileText, Calendar, User } from '@/utils/iconMapper';

// Usar no componente
<FileText className="h-5 w-5" />
<Calendar className="h-4 w-4" />
<User size={20} />`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Importar Ícones Coloridos (Cards)
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{`import { 
  FileTextColored, 
  CalendarColored, 
  UserColored 
} from '@/utils/iconMapper';

// Usar nos cards de contrato
<FileTextColored className="h-5 w-5" />
<CalendarColored className="h-4 w-4" />
<UserColored size={20} />`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Props Disponíveis
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><code>className</code> - Classes CSS (Tailwind)</li>
              <li><code>size</code> - Tamanho do ícone (number)</li>
              <li><code>color</code> - Cor customizada (hex)</li>
              <li><code>strokeWidth</code> - Espessura da linha (default: 2)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconShowcase;
