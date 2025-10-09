import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  LogOut,
  Home,
  Search,
  FolderOpen,
  Users,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const getUserInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const menuItems = [
    {
      name: 'Contratos',
      icon: FileText,
      path: '/contratos',
      active: location.pathname === '/contratos',
    },
    {
      name: 'Criar Análise',
      icon: Search,
      path: '/analise-vistoria',
      active: location.pathname === '/analise-vistoria',
    },
    {
      name: 'Análises Salvas',
      icon: FolderOpen,
      path: '/vistoria-analises',
      active: location.pathname === '/vistoria-analises',
    },
    {
      name: 'Prestadores',
      icon: Users,
      path: '/prestadores',
      active: location.pathname === '/prestadores',
    },
    {
      name: 'Chat IA',
      icon: MessageSquare,
      path: '/chat',
      active: location.pathname === '/chat',
    },
  ];

  // Adicionar item Admin apenas para administradores
  const adminMenuItem = {
    name: 'Administrador',
    icon: Settings,
    path: '/admin',
    active: location.pathname === '/admin',
  };

  const allMenuItems = isAdmin ? [...menuItems, adminMenuItem] : menuItems;

  if (!user) return null;

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-white border-r border-neutral-200">
      {/* Minimalista Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">DocForge</h1>
            <p className="text-xs text-neutral-500">Gestão Imobiliária</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Minimalista */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3 px-3">
            Menu
          </h3>
          <ul className="space-y-1">
            {allMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md transition-all duration-200 group',
                      item.active
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 mr-3',
                        item.active
                          ? 'text-neutral-700'
                          : 'text-neutral-400 group-hover:text-neutral-600'
                      )}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.active && (
                      <ChevronRight className="h-3 w-3 ml-auto text-neutral-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Profile Section - Minimalista */}
      <div className="p-4 border-t border-neutral-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-2 hover:bg-neutral-50 rounded-md transition-all duration-200"
            >
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-medium">
                  {getUserInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-neutral-900">
                  {profile?.full_name || user.email?.split('@')[0] || 'Usuário'}
                </span>
                <span className="text-xs text-neutral-500">
                  {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-xs leading-none text-neutral-500">
                  {profile?.role === 'admin'
                    ? 'Administrador do Sistema'
                    : 'Usuário'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-neutral-700 hover:text-neutral-900"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default Sidebar;
