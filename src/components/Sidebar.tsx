import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Search,
  LogOut,
  Shield,
  SearchCheck,
  Archive,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { useState } from 'react';

interface SidebarProps {
  onSearchChange?: (searchTerm: string) => void;
}

const Sidebar = ({ onSearchChange }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
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
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      active: location.pathname === '/',
      badge: null,
    },
    {
      name: 'Contratos',
      icon: FileText,
      path: '/contratos',
      active: location.pathname === '/contratos',
      badge: null,
    },
    {
      name: 'Análise',
      icon: SearchCheck,
      path: '/analise-vistoria',
      active: location.pathname === '/analise-vistoria',
      badge: null,
    },
    {
      name: 'Análises Salvas',
      icon: Archive,
      path: '/vistoria-analises',
      active: location.pathname === '/vistoria-analises',
      badge: null,
    },
    {
      name: 'Chat',
      icon: MessageSquare,
      path: '/chat',
      active: location.pathname === '/chat',
      badge: null,
    },
  ];

  if (!user) return null;

  return (
    <aside className="w-72 sidebar-professional min-h-screen flex flex-col">
      {/* Professional Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">
              DocForge
            </h1>
            <p className="text-sm text-muted-foreground">Enterprise Suite</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar contratos, documentos..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-full h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary rounded-xl"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Principal
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`nav-item flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      item.active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`h-5 w-5 ${item.active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
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
      <div className="p-6 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-sidebar-accent/50 rounded-xl transition-all duration-200"
            >
              <Avatar className="h-10 w-10 mr-3 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-semibold">
                  {getUserInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  {user.email?.split('@')[0] || 'Usuário'}
                </span>
                <span className="text-xs text-muted-foreground">
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
