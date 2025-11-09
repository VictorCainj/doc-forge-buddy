/**
 * Exemplo de Uso da Biblioteca de Tipos Compartilhados
 * 
 * Este arquivo demonstra como utilizar os tipos compartilhados em diferentes
 * cenários da aplicação Doc Forge Buddy.
 */

import { z } from 'zod';
import type { 
  UserProfile, 
  Contract, 
  VistoriaAnalise, 
  LoadingState,
  PaginatedResult,
  ApiResponse,
  AppEvent,
  ThemeConfig
} from '@/types/shared';

import { 
  createUserSchema, 
  contractSchema, 
  userRoleSchema,
  EventFactory,
  createPaginationParams,
  uuidSchema
} from '@/types/shared';

// =============================================================================
// EXEMPLO 1: CRIANDO UM COMPONENTE COM TIPOS DE UI
// =============================================================================

/**
 * Exemplo de componente Button com tipos compartilhados
 */
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/types/shared';

interface UserCardProps {
  user: UserProfile;
  onEdit: (userId: string) => void;
  loading?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, loading }) => {
  const handleEdit = () => {
    onEdit(user.id);
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{user.full_name}</h3>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <p className="text-xs">Role: {user.role}</p>
      
      <Button
        variant="default"
        size="sm"
        onClick={handleEdit}
        disabled={loading}
        loading={loading}
        className="mt-2"
      >
        Editar
      </Button>
    </div>
  );
};

// =============================================================================
// EXEMPLO 2: VALIDAÇÃO COM ZOD SCHEMAS
// =============================================================================

/**
 * Exemplo de formulário com validação usando schemas compartilhados
 */
interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
}

const createUserWithValidation = async (data: CreateUserFormData) => {
  try {
    // Validação usando schema compartilhado
    const validatedData = createUserSchema.parse({
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      role: data.role
    });

    // Se chegou até aqui, os dados são válidos
    console.log('Dados válidos:', validatedData);
    
    // Chamar API para criar usuário
    const result = await createUserAPI(validatedData);
    return { success: true, data: result };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Erros de validação tipados
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      return { 
        success: false, 
        errors: fieldErrors 
      };
    }
    
    return { 
      success: false, 
      errors: ['Erro inesperado'] 
    };
  }
};

// =============================================================================
// EXEMPLO 3: REPOSITORY COM TIPOS DE DATABASE
// =============================================================================

/**
 * Exemplo de repository usando tipos de database
 */
import type { 
  BaseRepository, 
  ProfileRepository, 
  ContractRepository,
  UUID 
} from '@/types/shared';

class UserService implements ProfileRepository {
  
  async findById(id: UUID): Promise<UserProfile | null> {
    // Implementação usando Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
    
    return data;
  }

  async findMany(params?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, unknown>;
  }): Promise<PaginatedResult<UserProfile>> {
    // Implementação com paginação
    const pagination = createPaginationParams(1, params?.limit || 20);
    
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);
      
    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }
    
    return {
      data: data || [],
      pagination: {
        page: 1,
        pageSize: params?.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (params?.limit || 20)),
        hasNext: (count || 0) > pagination.offset + (params?.limit || 20),
        hasPrev: pagination.offset > 0
      }
    };
  }

  // ... implement other methods
}

// =============================================================================
// EXEMPLO 4: EVENTOS E ANALYTICS
// =============================================================================

/**
 * Exemplo de sistema de eventos com tipos compartilhados
 */
class EventTracker {
  
  trackUserAction(action: string, metadata?: Record<string, unknown>) {
    const event = EventFactory.userAction('button_click', {
      elementText: action,
      metadata
    });
    
    // Disparar evento
    this.dispatchEvent(event);
  }
  
  trackDataOperation(type: 'create' | 'update' | 'delete', entity: string, entityId: string) {
    const event = EventFactory.dataOperation(type, entity, {
      entityId,
      success: true
    });
    
    this.dispatchEvent(event);
  }
  
  private dispatchEvent(event: AppEvent) {
    // Implementação do dispatcher
    console.log('Event dispatched:', event);
  }
}

// =============================================================================
// EXEMPLO 5: HOOKS PERSONALIZADOS COM TIPOS
// =============================================================================

/**
 * Exemplo de hook personalizado usando tipos compartilhados
 */
import { useState, useEffect } from 'react';
import type { LoadingState, ApiResponse } from '@/types/shared';

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    try {
      setLoading('loading');
      setError(null);
      
      const response = await apiCall();
      
      if (response.status === 'success' && response.data) {
        setData(response.data);
        setLoading('success');
        options.onSuccess?.(response.data);
      } else {
        const errorMessage = response.message || 'Erro desconhecido';
        setError(errorMessage);
        setLoading('error');
        options.onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro de rede';
      setError(errorMessage);
      setLoading('error');
      options.onError?.(errorMessage);
    }
  };

  const reset = () => {
    setData(options.initialData || null);
    setLoading('idle');
    setError(null);
  };

  return { data, loading, error, execute, reset };
}

// =============================================================================
// EXEMPLO 6: THEME E ESTILIZAÇÃO
// =============================================================================

/**
 * Exemplo de configuração de tema usando tipos compartilhados
 */
const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#64748b',
    secondaryForeground: '#ffffff',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    input: '#f8fafc',
    ring: '#3b82f6',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  spacing: {
    px: '1px',
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem'
  },
  fonts: {
    sans: 'system-ui, sans-serif',
    serif: 'Georgia, serif',
    mono: 'Monaco, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out'
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    toast: 1080,
    tooltip: 1090
  }
};

// =============================================================================
// EXPORT DOS EXEMPLOS
// =============================================================================

export {
  UserCard,
  createUserWithValidation,
  UserService,
  EventTracker,
  useApi,
  lightTheme
};

// Exemplo de uso dos tipos em exportação
export type {
  UserCardProps,
  CreateUserFormData,
  UseApiOptions,
  UseApiReturn
};