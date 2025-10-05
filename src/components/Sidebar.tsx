import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  LogOut,
  Building2,
  SearchCheck,
  FolderArchive,
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
// import { useSearchContext } from '@/hooks/useSearchContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
      badge: null,
    },
    {
      name: 'Criar Análise',
      icon: SearchCheck,
      path: '/analise-vistoria',
      active: location.pathname === '/analise-vistoria',
      badge: null,
    },
    {
      name: 'Análises Salvas',
      icon: FolderArchive,
      path: '/vistoria-analises',
      active: location.pathname === '/vistoria-analises',
      badge: null,
    },
    {
      name: 'Chat IA',
      icon: MessageSquare,
      path: '/chat',
      active: location.pathname === '/chat',
      badge: null,
    },
  ];

  if (!user) return null;

  return (
    <aside className="w-72 min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 border-r border-white/10">
      {/* Professional Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              DocForge
            </h1>
            <p className="text-sm text-blue-200">Gestão Imobiliária</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4">
            Principal
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      item.active
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-white border border-blue-400/30 shadow-lg'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`h-5 w-5 ${item.active ? 'text-blue-400' : 'text-blue-300 group-hover:text-white'}`}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={
                          item.badge === 'Pro' ? 'secondary' : 'destructive'
                        }
                        className="text-xs px-2 py-0.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Professional Profile Section */}
      <div className="p-6 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <Avatar className="h-10 w-10 mr-3 ring-2 ring-blue-400/30">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                  {getUserInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-white">
                  {user.email?.split('@')[0] || 'Usuário'}
                </span>
                <span className="text-xs text-blue-200">
                  Administrador
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Administrador do Sistema
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da Sessão</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default Sidebar;
