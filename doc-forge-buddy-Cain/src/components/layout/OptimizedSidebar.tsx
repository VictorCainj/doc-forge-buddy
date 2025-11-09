import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  LogOut,
  Circle,
  Search,
  Users,
  Settings,
  ClipboardList,
  BarChart,
  Sparkles,
} from '@/utils/iconMapper';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  AnimatedSidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/animated-sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useMemoizedCallback } from '@/hooks/useMemoizedCallback';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

// Memoização de função auxiliar
const getUserInitials = memo((email: string) => {
  return email
    ?.split('@')[0]
    .split('.')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'U';
});

getUserInitials.displayName = 'getUserInitials';

// Memoização de item de menu
const MenuItem = memo<{
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
  onHover?: () => void;
  onClick?: () => void;
}>(({ label, href, icon, isActive, onHover, onClick }) => {
  const handleMouseEnter = useMemoizedCallback(() => {
    onHover?.();
  }, [onHover]);

  return (
    <SidebarLink
      link={{
        label,
        href,
        icon,
      }}
      className={cn(
        'rounded-md px-2 transition-all duration-200',
        isActive && 'bg-neutral-200 dark:bg-neutral-700 shadow-sm'
      )}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    />
  );
});

MenuItem.displayName = 'MenuItem';

// Componente Logo memoizado
const Logo = memo(() => (
  <div className="flex items-center space-x-2 px-2">
    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
      <Circle className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col"
    >
      <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        DocForge
      </span>
      <span className="text-xs text-neutral-600 dark:text-neutral-400">
        Gestão Imobiliária
      </span>
    </motion.div>
  </div>
));

Logo.displayName = 'Logo';

// Componente Logo icon memoizado
const LogoIcon = memo(() => (
  <div className="flex items-center justify-center px-2">
    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
      <Circle className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
    </div>
  </div>
));

LogoIcon.displayName = 'LogoIcon';

// Componente de Estatísticas do Usuário memoizado
const UserStats = memo<{
  level: number;
  title: string;
  exp: number;
  progress: number;
  currentLevelExp: number;
  nextLevelExp: number;
}>(({ level, title, exp, progress, currentLevelExp, nextLevelExp }) => (
  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-neutral-700 dark:text-neutral-300">
        Nível {level} • {title}
      </span>
    </div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-neutral-600 dark:text-neutral-400">
        {currentLevelExp}/{nextLevelExp} EXP
      </span>
      <span className="text-xs text-neutral-500 dark:text-neutral-500">
        {Math.round(progress)}%
      </span>
    </div>
    <Progress value={progress} className="h-1.5" />
    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
      {exp} EXP total
    </p>
  </div>
));

UserStats.displayName = 'UserStats';

// Sidebar principal otimizado
const OptimizedSidebar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { title, level, exp, progress, currentLevelExp, nextLevelExp } =
    useUserLevel();
  const [open, setOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  // Memoização de handlers
  const handleSignOut = useMemoizedCallback(async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  }, [signOut, navigate]);

  const handleMenuHover = useMemoizedCallback((menuId: string) => {
    setHoveredMenu(menuId);
  }, []);

  // Memoização de menu items
  const menuItems = useMemo(() => [
    {
      id: 'contratos',
      label: 'Contratos',
      href: '/contratos',
      icon: (
        <FileText
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            location.pathname === '/contratos'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-700 dark:text-neutral-200'
          )}
        />
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard Desocupação',
      href: '/dashboard-desocupacao',
      icon: (
        <BarChart
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            location.pathname === '/dashboard-desocupacao'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-700 dark:text-neutral-200'
          )}
        />
      ),
    },
    {
      id: 'analise',
      label: 'Criar Análise',
      href: '/analise-vistoria',
      icon: (
        <Search
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            location.pathname === '/analise-vistoria'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-700 dark:text-neutral-200'
          )}
        />
      ),
    },
    {
      id: 'prompt',
      label: 'Construtor de Prompts',
      href: '/prompt',
      icon: (
        <Sparkles
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            location.pathname === '/prompt'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-700 dark:text-neutral-200'
          )}
        />
      ),
    },
    {
      id: 'tarefas',
      label: 'Tarefas',
      href: '/tarefas',
      icon: (
        <ClipboardList
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            location.pathname === '/tarefas'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-700 dark:text-neutral-200'
          )}
        />
      ),
    },
    {
      id: 'prestadores',
      label: 'Prestadores',
      href: '/prestadores',
      icon: (
        <Users
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            location.pathname === '/prestadores'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-700 dark:text-neutral-200'
          )}
        />
      ),
    },
  ], [location.pathname]);

  // Admin menu item memoizado
  const adminMenuItem = useMemo(() => ({
    id: 'admin',
    label: 'Administrador',
    href: '/admin',
    icon: (
      <Settings
        className={cn(
          'h-5 w-5 flex-shrink-0 transition-colors',
          location.pathname === '/admin'
            ? 'text-neutral-900 dark:text-neutral-100'
            : 'text-neutral-700 dark:text-neutral-200'
        )}
      />
    ),
  }), [location.pathname]);

  // Todos os menu items memoizado
  const allMenuItems = useMemo(() => {
    return isAdmin ? [...menuItems, adminMenuItem] : menuItems;
  }, [menuItems, adminMenuItem, isAdmin]);

  // Early return para não usuários
  if (!user) {
    return null;
  }

  // Memoização do componente de perfil
  const UserProfile = useMemo(() => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
        >
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-medium">
              {getUserInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
          <motion.div
            className="flex flex-col items-start text-left flex-1 min-w-0 ml-2"
            animate={{
              display: open ? 'flex' : 'none',
              opacity: open ? 1 : 0,
            }}
          >
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate w-full">
              {profile?.full_name ||
                user.email?.split('@')[0] ||
                'Usuário'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                Nv.{level}
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {title}
              </span>
            </div>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 ml-2"
        align="end"
        side="right"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div>
              <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs leading-none text-neutral-500 dark:text-neutral-400 mt-1">
                {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
            <UserStats
              level={level}
              title={title}
              exp={exp}
              progress={progress}
              currentLevelExp={currentLevelExp}
              nextLevelExp={nextLevelExp}
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ), [open, profile, user, level, title, exp, progress, currentLevelExp, nextLevelExp, handleSignOut]);

  return (
    <AnimatedSidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        {/* Seção Superior: Logo e Menu */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="mb-8">
            {open ? <Logo /> : <LogoIcon />}
          </div>

          {/* Notificações */}
          <div className="mb-4 px-2">
            <NotificationBell />
          </div>

          {/* Menu Items Otimizado */}
          <div className="flex flex-col gap-1">
            {allMenuItems.map((item) => (
              <MenuItem
                key={item.id}
                label={item.label}
                href={item.href}
                icon={item.icon}
                isActive={location.pathname === item.href}
                onHover={() => handleMenuHover(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Seção Inferior: Perfil do Usuário */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
          {UserProfile}
        </div>
      </SidebarBody>
    </AnimatedSidebar>
  );
});

OptimizedSidebar.displayName = 'OptimizedSidebar';

export default OptimizedSidebar;