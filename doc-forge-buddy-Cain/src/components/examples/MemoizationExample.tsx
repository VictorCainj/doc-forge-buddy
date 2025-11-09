import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  PieChart
} from '@/utils/iconMapper';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  usePerformanceMonitor, 
  useMemoizationAnalyzer, 
  useUnstableDependencyDetector,
  useMemoizationReporter 
} from '@/hooks/usePerformanceMonitor';
import { 
  useOptimizedMemo,
  useMemoizedCallback,
  useDebouncedMemoizedCallback,
  useMemoizedArray
} from '@/hooks/useAdvancedMemoization';
import { cn } from '@/lib/utils';

// ==================== TIPOS ====================

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  lastActive: Date;
  stats: {
    contracts: number;
    tasks: number;
    revenue: number;
  };
}

interface DashboardData {
  users: User[];
  metrics: {
    totalUsers: number;
    totalContracts: number;
    totalRevenue: number;
    growth: number;
  };
  charts: {
    userGrowth: Array<{ month: string; users: number }>;
    contractDistribution: Array<{ type: string; count: number }>;
  };
}

interface FilterOptions {
  search: string;
  role: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  sortBy: 'name' | 'lastActive' | 'stats.contracts';
  sortOrder: 'asc' | 'desc';
}

// ==================== COMPONENTES AUXILIARES ====================

// Componente simples para items da lista - memoizado
const UserListItem = memo<{
  user: User;
  index: number;
  onViewProfile: (user: User) => void;
  onEdit: (user: User) => void;
  isSelected: boolean;
}>(({ user, index, onViewProfile, onEdit, isSelected }) => {
  // Memoizar formatação de data
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(user.lastActive);
  }, [user.lastActive]);

  // Memoizar iniciais do avatar
  const initials = useMemo(() => {
    return user.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user.name]);

  // Handlers memoizados
  const handleViewProfile = useMemoizedCallback(() => {
    onViewProfile(user);
  }, [user, onViewProfile]);

  const handleEdit = useMemoizedCallback(() => {
    onEdit(user);
  }, [user, onEdit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-4 rounded-lg border transition-all duration-200",
        isSelected 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{user.name}</h4>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
              <span className="text-xs text-gray-400">
                {user.stats.contracts} contratos
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {formattedDate}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewProfile}
            className="h-8 w-8 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

UserListItem.displayName = 'UserListItem';

// Componente de filtro memoizado
const FilterPanel = memo<{
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  availableRoles: string[];
}>(({ filters, onFilterChange, availableRoles }) => {
  // Debounced search para melhor performance
  const debouncedSearch = useDebouncedMemoizedCallback(
    (searchTerm: string) => {
      onFilterChange({ ...filters, search: searchTerm });
    },
    [filters, onFilterChange],
    300
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const handleRoleChange = useCallback((role: string) => {
    onFilterChange({ ...filters, role });
  }, [filters, onFilterChange]);

  const handleSortChange = useCallback((sortBy: FilterOptions['sortBy']) => {
    onFilterChange({ 
      ...filters, 
      sortBy,
      sortOrder: filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  }, [filters, onFilterChange]);

  // Memoizar options de role
  const roleOptions = useMemoizedArray(availableRoles, {
    sortFn: (a, b) => a.localeCompare(b)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nome, email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={handleSearchChange}
              defaultValue={filters.search}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Função
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleRoleChange(e.target.value)}
            value={filters.role}
          >
            <option value="">Todas</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Ordenar por
          </label>
          <div className="flex gap-2">
            {[
              { key: 'name' as const, label: 'Nome' },
              { key: 'lastActive' as const, label: 'Última Atividade' },
              { key: 'stats.contracts' as const, label: 'Contratos' }
            ].map(option => (
              <Button
                key={option.key}
                variant={filters.sortBy === option.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange(option.key)}
                className="flex-1"
              >
                {option.label}
                {filters.sortBy === option.key && (
                  <span className="ml-1">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FilterPanel.displayName = 'FilterPanel';

// ==================== COMPONENTE PRINCIPAL ====================

/**
 * Componente de exemplo demonstrando memoization avançada
 * 
 * Principais otimizações implementadas:
 * 1. React.memo em componentes filhos
 * 2. useMemo para computações pesadas
 * 3. useCallback para handlers estáveis
 * 4. useMemoizedArray para processamento de listas
 * 5. Debounced callbacks para search
 * 6. Performance monitoring integrado
 * 7. Detecção automática de dependências instáveis
 */
const MemoizationExample = memo(() => {
  // Performance monitoring
  const { recordMetrics, renderCount } = usePerformanceMonitor('MemoizationExample');
  const { analysis, reRenderCount } = useMemoizationAnalyzer('MemoizationExample', {});
  const { report } = useMemoizationReporter('MemoizationExample');

  // Estado local
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    role: '',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
      end: new Date()
    },
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Simular carregamento de dados
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: DashboardData = {
        users: [
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@exemplo.com',
            role: 'admin',
            lastActive: new Date(),
            stats: { contracts: 45, tasks: 12, revenue: 15000 }
          },
          {
            id: '2',
            name: 'Maria Santos',
            email: 'maria@exemplo.com',
            role: 'user',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
            stats: { contracts: 23, tasks: 8, revenue: 8500 }
          },
          {
            id: '3',
            name: 'Pedro Costa',
            email: 'pedro@exemplo.com',
            role: 'viewer',
            lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
            stats: { contracts: 0, tasks: 3, revenue: 0 }
          }
        ],
        metrics: {
          totalUsers: 3,
          totalContracts: 68,
          totalRevenue: 23500,
          growth: 12.5
        },
        charts: {
          userGrowth: [
            { month: 'Jan', users: 45 },
            { month: 'Fev', users: 52 },
            { month: 'Mar', users: 61 }
          ],
          contractDistribution: [
            { type: 'Residencial', count: 45 },
            { type: 'Comercial', count: 23 }
          ]
        }
      };
      
      setData(mockData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Memoização de dados processados
  const processedData = useOptimizedMemo(() => {
    if (!data) return null;
    
    // Simular processamento pesado
    let filteredUsers = [...data.users];
    
    // Aplicar filtros
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }
    
    // Aplicar ordenação
    filteredUsers.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'lastActive':
          aValue = a.lastActive.getTime();
          bValue = b.lastActive.getTime();
          break;
        case 'stats.contracts':
          aValue = a.stats.contracts;
          bValue = b.stats.contracts;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return { ...data, users: filteredUsers };
  }, [data, filters], {
    timeout: 5000, // Cache por 5 segundos
    maxCacheSize: 10
  });

  // Memoização de options de role
  const availableRoles = useMemoizedArray(
    data?.users.map(user => user.role) || [],
    {
      filterFn: (role, index, array) => array.indexOf(role) === index,
      sortFn: (a, b) => a.localeCompare(b)
    }
  );

  // Detectar dependências instáveis
  const dependencyCheck = useUnstableDependencyDetector('MemoizationExample', [data, filters]);

  // Handlers memoizados
  const handleUserSelect = useMemoizedCallback((userId: string, selected: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleViewProfile = useMemoizedCallback((user: User) => {
    console.log('Visualizar perfil:', user.name);
    // Implementar modal de perfil
  }, []);

  const handleEditUser = useMemoizedCallback((user: User) => {
    console.log('Editar usuário:', user.name);
    // Implementar modal de edição
  }, []);

  const handleExportData = useMemoizedCallback(() => {
    if (processedData) {
      const dataStr = JSON.stringify(processedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [processedData]);

  // Reportar métricas periodicamente
  useEffect(() => {
    if (data) {
      const metrics = recordMetrics(JSON.stringify(filters).length, 0);
      report(metrics);
    }
  }, [data, filters, recordMetrics, report]);

  // Early returns otimizados
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Exemplo de Memoization
          </h1>
          <p className="text-gray-600 mt-1">
            Demonstração de otimizações avançadas de performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Render #{renderCount}
          </Badge>
          <Button onClick={handleExportData} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas de Performance */}
      {analysis && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-700">Score Performance</div>
                <div className="text-blue-600">{analysis.overallScore.toFixed(0)}/100</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Re-renders</div>
                <div className="text-blue-600">{reRenderCount}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Dependências</div>
                <div className="text-blue-600">
                  {dependencyCheck.isUnstable ? 'Instáveis!' : 'Estáveis ✓'}
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Usuários Filtrados</div>
                <div className="text-blue-600">{processedData.users.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processedData.metrics.totalUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processedData.metrics.totalContracts}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {processedData.metrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crescimento</p>
                <p className="text-2xl font-bold text-gray-900">
                  +{processedData.metrics.growth}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            availableRoles={availableRoles}
          />
        </div>

        {/* Lista de Usuários */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Usuários ({processedData.users.length})</span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <PieChart className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {processedData.users.map((user, index) => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      index={index}
                      onViewProfile={handleViewProfile}
                      onEdit={handleEditUser}
                      isSelected={selectedUsers.has(user.id)}
                    />
                  ))}
                </AnimatePresence>
                
                {processedData.users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum usuário encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

MemoizationExample.displayName = 'MemoizationExample';

export default MemoizationExample;