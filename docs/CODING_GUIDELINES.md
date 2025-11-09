# Guia de Desenvolvimento e Convenções de Código

## Índice

1. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
2. [Estrutura de Arquivos e Organização](#estrutura-de-arquivos-e-organização)
3. [Padrões de Código](#padrões-de-código)
4. [Melhores Práticas de Performance](#melhores-práticas-de-performance)
5. [Segurança](#segurança)
6. [Fluxo de Trabalho de Desenvolvimento](#fluxo-de-trabalho-de-desenvolvimento)
7. [Exemplos Práticos](#exemplos-práticos)

---

## Convenções de Nomenclatura

### 1.1 Componentes React

```typescript
// ✅ Bom: PascalCase para componentes
const UserProfile = () => { ... }
const ProductCard = () => { ... }
const AuthButton = () => { ... }

// ❌ Ruim: camelCase ou nomes genéricos
const userProfile = () => { ... }
const button = () => { ... }
```

### 1.2 Variáveis e Funções

```typescript
// ✅ Bom: camelCase, nomes descritivos
const userName = 'João Silva'
const isLoading = true
const fetchUserData = async () => { ... }
const handleSubmit = () => { ... }

// ❌ Ruim: nomes vagos ou inconsistentes
const name = 'João Silva'
const loading = true
const getData = async () => { ... }
const submit = () => { ... }
```

### 1.3 Constantes

```typescript
// ✅ Bom: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.exemplo.com'
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_TIMEOUT = 5000

// ❌ Ruim: camelCase para constantes
const apiBaseUrl = 'https://api.exemplo.com'
```

### 1.4 Arquivos e Pastas

```bash
# ✅ Bom: kebab-case para arquivos, PascalCase para componentes
user-profile.component.tsx
product-card.component.tsx
api.service.ts
utils.helper.ts

# ❌ Ruim: camelCase, PascalCase inconsistente
userProfile.tsx
ProductCard.tsx
apiService.ts
```

### 1.5 Types e Interfaces

```typescript
// ✅ Bom: PascalCase, sufijos claros
interface User {
  id: number
  name: string
  email: string
}

type UserRole = 'admin' | 'user' | 'guest'

interface UserProfileProps {
  user: User
  onEdit: (user: User) => void
}

// ❌ Ruim: nomes genéricos sem sufixos
interface Props {
  user: any
}
```

---

## Estrutura de Arquivos e Organização

### 2.1 Estrutura de Pastas

```
src/
├── components/           # Componentes reutilizáveis
│   ├── common/          # Componentes genéricos
│   │   ├── Button/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── Button.types.ts
│   │   └── Form/
│   ├── layout/          # Componentes de layout
│   └── ui/              # Componentes de interface
├── pages/               # Páginas (Next.js) ou telas
├── hooks/               # Custom hooks
├── services/            # Serviços (APIs, storage)
├── utils/               # Funções utilitárias
├── types/               # Definições de tipos
├── constants/           # Constantes da aplicação
├── assets/              # Recursos estáticos
└── styles/              # Estilos globais
```

### 2.2 Organização de Arquivos

#### Componentes
```typescript
// components/common/Button/index.ts - Exporta tudo
export { default } from './Button'

// components/common/Button/Button.types.ts
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

// components/common/Button/Button.tsx
import React from 'react'
import { ButtonProps } from './Button.types'

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  ...props
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## Padrões de Código

### 3.1 Custom Hooks

```typescript
// hooks/useFetch.ts
import { useState, useEffect, useCallback } from 'react'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

### 3.2 Services

```typescript
// services/api.service.ts
class ApiService {
  private baseURL: string
  private headers: Record<string, string>

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.headers = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: { ...this.headers, ...options.headers },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T, D = any>(endpoint: string, data: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T, D = any>(endpoint: string, data: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiService = new ApiService(API_BASE_URL)
```

### 3.3 Context API

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await apiService.post<{ user: User; token: string }>(
        '/auth/login',
        { email, password }
      )
      
      localStorage.setItem('token', response.token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user })
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  // Verificar token na inicialização
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Validar token com backend
      apiService.get<User>('/auth/me')
        .then(user => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        })
        .catch(() => {
          localStorage.removeItem('token')
          dispatch({ type: 'LOGOUT' })
        })
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
```

### 3.4 Types e Interfaces

```typescript
// types/api.types.ts
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

// types/user.types.ts
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'user' | 'moderator' | 'guest'

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string
}

// types/component.types.ts
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface FormState<T> {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isDirty: boolean
}
```

---

## Melhores Práticas de Performance

### 4.1 Otimização de Componentes

```typescript
// ✅ Bom: useMemo para cálculos pesados
const ProductList = ({ products, filter }: ProductListProps) => {
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(filter.toLowerCase())
    )
  }, [products, filter])

  return (
    <ul>
      {filteredProducts.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  )
}

// ✅ Bom: useCallback para funções passadas como props
const Parent = () => {
  const handleItemClick = useCallback((id: string) => {
    console.log('Item clicked:', id)
  }, [])

  return <Child onItemClick={handleItemClick} />
}

// ✅ Bom: lazy loading para componentes grandes
const LazyComponent = lazy(() => import('./LazyComponent'))

const App = () => (
  <Suspense fallback={<div>Carregando...</div>}>
    <LazyComponent />
  </Suspense>
)
```

### 4.2 Otimização de Hooks

```typescript
// ✅ Bom: debounce em hooks de input
import { useState, useEffect, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [value, delay])

  return debouncedValue
}

// Uso
const SearchBox = () => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)

  const { data } = useSearchProducts(debouncedQuery)

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Buscar produtos..."
    />
  )
}
```

### 4.3 Otimização de API

```typescript
// ✅ Bom: cache e stale-while-revalidate
import { useQuery } from '@tanstack/react-query'

const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.get<Product[]>('/products'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  })
}

// ✅ Bom: paginação infinita
const useInfiniteProducts = () => {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      apiService.get<PaginatedResponse<Product[]>>(`/products?page=${pageParam}`),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  })
}
```

---

## Segurança

### 5.1 Validação de Dados

```typescript
// ✅ Bom: validação com Zod
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(120).optional(),
  role: z.enum(['admin', 'user', 'guest']),
})

const validateUser = (data: unknown): User => {
  try {
    return UserSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Dados inválidos: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}
```

### 5.2 Sanitização de Inputs

```typescript
// ✅ Bom: sanitize HTML
import DOMPurify from 'dompurify'

const sanitizeInput = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

// ✅ Bom: escaping de dados
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
```

### 5.3 Autenticação e Autorização

```typescript
// ✅ Bom: verificação de token e roles
const useAuth = () => {
  const { user } = useAuthContext()
  
  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false
    
    const roleHierarchy = {
      guest: 0,
      user: 1,
      moderator: 2,
      admin: 3,
    }
    
    return roleHierarchy[user.role as keyof typeof roleHierarchy] >= 
           roleHierarchy[requiredRole as keyof typeof roleHierarchy]
  }

  return { user, hasRole, isAuthenticated: !!user }
}

// ✅ Bom: protected routes
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode
  requiredRole?: string 
}) => {
  const { user, isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
```

### 5.4 Prevenção de XSS e CSRF

```typescript
// ✅ Bom: Content Security Policy
const CSP = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https:"],
  "connect-src": ["'self'", "https://api.exemplo.com"],
}

// ✅ Bom: CSRF token
const useCSRFToken = () => {
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    if (token) {
      setCsrfToken(token)
    }
  }, [])

  const postData = async (url: string, data: any) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
  }

  return { postData, csrfToken }
}
```

---

## Fluxo de Trabalho de Desenvolvimento

### 6.1 Git Branching Strategy

```bash
# Branch principal
main (produção)
│
├── develop (desenvolvimento)
│   ├── feature/user-authentication
│   ├── feature/product-search
│   ├── bugfix/login-error
│   └── hotfix/critical-security-patch
```

### 6.2 Estrutura de Branches

```bash
# ✅ Convenções de nomenclatura
feature/descriptive-name     # Novas funcionalidades
bugfix/issue-description     # Correções de bugs
hotfix/critical-issue        # Correções críticas
release/version-number       # Releases
```

### 6.3 Conventional Commits

```bash
# ✅ Formato: tipo(scope): descrição

feat(auth): add user login functionality
fix(api): resolve timeout issue in user service
refactor(ui): simplify button component structure
docs(readme): update installation instructions
test(user): add unit tests for login component
style(button): fix code formatting issues
perf(api): optimize database queries
```

### 6.4 Pull Request Template

```markdown
## Descrição
Breve descrição das mudanças propostas.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um issue)
- [ ] New feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (fix ou feature que causa breaking change)
- [ ] Documentation update

## Checklist
- [ ] Código foi testado localmente
- [ ] Adicionados testes unitários
- [ ] Atualizada documentação
- [ ] Passou em CI/CD
- [ ] Código revisado

## Screenshots (se aplicável)

## Testes
- [ ] Unitários
- [ ] Integração
- [ ] E2E (se aplicável)
```

---

## Exemplos Práticos

### 7.1 Componente Completo

```typescript
// components/common/UserCard/index.ts
export { UserCard } from './UserCard'

// components/common/UserCard/UserCard.types.ts
export interface UserCardProps {
  user: User
  showActions?: boolean
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
  className?: string
}

// components/common/UserCard/UserCard.tsx
import React, { memo } from 'react'
import { UserCardProps } from './UserCard.types'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'

export const UserCard: React.FC<UserCardProps> = memo(({
  user,
  showActions = false,
  onEdit,
  onDelete,
  className = '',
}) => {
  const { hasRole } = useAuth()
  const canEdit = hasRole('admin') || hasRole('moderator')

  const handleEdit = () => {
    if (onEdit) {
      onEdit(user)
    }
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Tem certeza que deseja excluir este usuário?')) {
      onDelete(user.id)
    }
  }

  return (
    <div className={`user-card ${className}`} data-testid="user-card">
      <div className="user-card__avatar">
        <img 
          src={user.avatar || '/default-avatar.png'} 
          alt={`Avatar de ${user.name}`}
          loading="lazy"
        />
      </div>
      
      <div className="user-card__info">
        <h3 className="user-card__name">{user.name}</h3>
        <p className="user-card__email">{user.email}</p>
        <span className={`user-card__role user-card__role--${user.role}`}>
          {user.role}
        </span>
      </div>

      {showActions && canEdit && (
        <div className="user-card__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            data-testid="edit-user-btn"
          >
            Editar
          </Button>
          {hasRole('admin') && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              data-testid="delete-user-btn"
            >
              Excluir
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

UserCard.displayName = 'UserCard'
```

### 7.2 Hook Completo

```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((val: T) => T)

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Função para setar o valor
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Permitir que value seja uma função para updates como useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Salvar estado
      setStoredValue(valueToStore)
      
      // Salvar no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Função para remover o valor
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Erro ao remover localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Sincronizar com mudanças de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Erro ao parsear localStorage value:`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue]
}
```

### 7.3 Service Completo com Error Handling

```typescript
// services/user.service.ts
import { ApiService } from './api.service'
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest,
  PaginatedResponse 
} from '@/types'

class UserService extends ApiService {
  async getUsers(page: number = 1, limit: number = 20): Promise<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`)
  }

  async getUserById(id: string): Promise<User> {
    try {
      return await this.get<User>(`/users/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Usuário não encontrado')
      }
      throw new Error('Erro ao buscar usuário')
    }
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      return await this.post<User, CreateUserRequest>('/users', userData)
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        throw new Error('Email já está em uso')
      }
      throw new Error('Erro ao criar usuário')
    }
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      return await this.put<User, UpdateUserRequest>(`/users/${id}`, userData)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Usuário não encontrado para atualização')
      }
      throw new Error('Erro ao atualizar usuário')
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.delete(`/users/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Usuário não encontrado para exclusão')
      }
      throw new Error('Erro ao excluir usuário')
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`)
  }
}

export const userService = new UserService()
```

### 7.4 Testes Unitários

```typescript
// tests/hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  test('deve inicializar com valor padrão', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default-value')
    )
    
    expect(result.current[0]).toBe('default-value')
  })

  test('deve ler valor do localStorage se disponível', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default-value')
    )
    
    expect(result.current[0]).toBe('stored-value')
  })

  test('deve salvar valor no localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default-value')
    )
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('new-value')
    )
    expect(result.current[0]).toBe('new-value')
  })

  test('deve remover valor do localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))
    localStorageMock.removeItem.mockImplementation(() => {})
    
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'default-value')
    )
    
    act(() => {
      result.current[2]() // removeValue
    })
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })
})
```

---

## Checklist de Code Review

### Estrutura e Organização
- [ ] Código está bem estruturado e organizado
- [ ] Nomes são descritivos e seguem convenções
- [ ] Arquivos estão nas pastas corretas
- [ ] Componentes são reutilizáveis e modulares

### Qualidade do Código
- [ ] Não há código duplicado
- [ ] Funções são pequenas e focadas
- [ ] Imports/exports estão corretos
- [ ] Tratamento de erros adequado

### Performance
- [ ] Componentes otimizados com memo/useMemo/useCallback
- [ ] Lazy loading quando apropriado
- [ ] Imagens otimizadas
- [ ] Queries otimizadas

### Segurança
- [ ] Validação de inputs
- [ ] Sanitização de dados
- [ ] Autenticação/autorização implementadas
- [ ] Não há exposição de dados sensíveis

### Testes
- [ ] Testes unitários escritos
- [ ] Testes cobrem casos principais
- [ ] Testes passam localmente
- [ ] Coverage adequado

### Documentação
- [ ] Comentários em código complexo
- [ ] Props e interfaces documentadas
- [ ] README atualizado se necessário
- [ ] Changelog atualizado

---

## Recursos e Ferramentas

### Ferramentas Recomendadas
- **ESLint** - Linting de código
- **Prettier** - Formatação automática
- **Husky** - Git hooks
- **Commitlint** - Validação de commits
- **Jest/Testing Library** - Testes unitários
- **Cypress/Playwright** - Testes E2E

### Extensões VS Code
- ESLint
- Prettier
- TypeScript Hero
- GitLens
- Error Lens
- Auto Rename Tag
- Bracket Pair Colorizer

---

*Última atualização: Novembro 2025*
*Versão: 1.0*