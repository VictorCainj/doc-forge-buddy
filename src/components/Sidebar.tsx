import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  LogOut,
  Home,
  Search,
  Users,
  ChevronRight,
  Settings,
  Menu,
  X,
  ClipboardList,
} from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useUserLevel } from '@/hooks/useUserLevel';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { title, level, exp, progress, currentLevelExp, nextLevelExp } =
    useUserLevel();
  const [isExpanded, setIsExpanded] = useState(false);

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
      name: 'Tarefas',
      icon: ClipboardList,
      path: '/tarefas',
      active: location.pathname === '/tarefas',
    },
    {
      name: 'Prestadores',
      icon: Users,
      path: '/prestadores',
      active: location.pathname === '/prestadores',
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
    <>
      {/* Botão de Toggle - Sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'fixed top-4 z-50 p-2 bg-neutral-900 text-white rounded-r-lg shadow-lg hover:bg-neutral-800 transition-all duration-300',
          isExpanded ? 'left-64' : 'left-0'
        )}
        aria-label={isExpanded ? 'Fechar menu' : 'Abrir menu'}
      >
        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay quando expandido */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col bg-white border-r border-neutral-200 z-40 transition-transform duration-300 ease-in-out',
          isExpanded ? 'translate-x-0' : '-translate-x-full',
          'w-64'
        )}
      >
        {/* Minimalista Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">
                DocForge
              </h1>
              <p className="text-xs text-neutral-500">Gestão Imobiliária</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Minimalista */}
        <nav
          role="navigation"
          aria-label="Menu principal"
          className="flex-1 px-4 py-6 overflow-y-auto"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-neutral-600 uppercase tracking-wider mb-3 px-3">
              Menu
            </h3>
            <ul className="space-y-1">
              {allMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={() => setIsExpanded(false)}
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
                <div className="flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-900 truncate w-full">
                    {profile?.full_name ||
                      user.email?.split('@')[0] ||
                      'Usuário'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-neutral-500">Nv.{level}</span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">{title}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div>
                    <p className="text-sm font-medium leading-none text-neutral-900">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs leading-none text-neutral-500 mt-1">
                      {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-600">
                        Nível {level} • {title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-neutral-500">
                        {currentLevelExp}/{nextLevelExp} EXP
                      </span>
                      <span className="text-xs text-neutral-400">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-neutral-400 mt-1">
                      {exp} EXP total
                    </p>
                  </div>
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
    </>
  );
};

export default Sidebar;
