/**
 * Sidebar Acessível com Navegação por Teclado
 * Implementa padrões WCAG para navegação
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  LogOut,
  Shield,
  SearchCheck,
  Archive,
} from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';
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
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { cn } from '@/lib/utils';

export const AccessibleSidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  // ✅ Navegação por teclado para itens do menu
  const { containerRef } = useKeyboardNavigation({
    focusableSelector: 'a[role="menuitem"], button[role="menuitem"]',
    circular: true,
    onFocusChange: (element, index) => {
      // Anunciar item focado para screen readers
      const announcement = `Item ${index + 1} de ${menuItems.length}: ${element.textContent}`;
      announceToScreenReader(announcement);
    },
  });

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      announceToScreenReader('Logout realizado com sucesso');
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
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      active: location.pathname === '/',
      description: 'Visão geral do sistema',
    },
    {
      name: 'Contratos',
      icon: FileText,
      path: '/contratos',
      active: location.pathname === '/contratos',
      description: 'Gerenciar contratos imobiliários',
    },
    {
      name: 'Chat IA',
      icon: MessageSquare,
      path: '/chat',
      active: location.pathname === '/chat',
      description: 'Assistente inteligente',
    },
    {
      name: 'Análise de Vistoria',
      icon: SearchCheck,
      path: '/analise-vistoria',
      active: location.pathname === '/analise-vistoria',
      description: 'Análises de vistoria',
    },
    {
      name: 'Relatórios de Vistoria',
      icon: Archive,
      path: '/vistoria-analises',
      active: location.pathname === '/vistoria-analises',
      description: 'Histórico de vistorias',
    },
  ];

  return (
    <aside
      className="w-64 bg-card border-r border-border flex flex-col h-screen"
      role="navigation"
      aria-label="Menu principal"
    >
      {/* ✅ Cabeçalho da sidebar */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">ContractPro</h2>
            <p className="text-sm text-muted-foreground">Gestão Imobiliária</p>
          </div>
        </div>
      </div>

      {/* ✅ Menu de navegação */}
      <nav 
        ref={containerRef}
        className="flex-1 p-4"
        role="menu"
        aria-label="Menu de navegação"
      >
        <ul className="space-y-2" role="none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} role="none">
                <Link
                  to={item.path}
                  role="menuitem"
                  aria-current={item.active ? 'page' : undefined}
                  aria-describedby={`${item.name.toLowerCase().replace(' ', '-')}-desc`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon 
                    className="h-4 w-4" 
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                  {item.active && (
                    <Badge variant="secondary" className="ml-auto">
                      Atual
                    </Badge>
                  )}
                </Link>
                
                {/* ✅ Descrição oculta para screen readers */}
                <span 
                  id={`${item.name.toLowerCase().replace(' ', '-')}-desc`}
                  className="sr-only"
                >
                  {item.description}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ✅ Perfil do usuário */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AccessibleButton
              variant="ghost"
              className="w-full justify-start gap-3 p-3"
              aria-label={`Menu do usuário: ${user?.email || 'Usuário'}`}
              aria-expanded={false}
              aria-haspopup="menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getUserInitials(user?.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
            </AccessibleButton>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-56"
            role="menu"
            aria-label="Menu do usuário"
          >
            <DropdownMenuLabel role="none">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleSignOut}
              role="menuitem"
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

// ✅ Função utilitária para anúncios de screen reader
const announceToScreenReader = (message: string) => {
  const announcement = document.getElementById('announcements');
  if (announcement) {
    announcement.textContent = message;
    // Limpar após um tempo para não acumular mensagens
    setTimeout(() => {
      announcement.textContent = '';
    }, 1000);
  }
};
