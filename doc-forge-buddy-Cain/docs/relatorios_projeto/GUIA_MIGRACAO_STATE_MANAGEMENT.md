# Guia de Migração: State Management Global

## Visão Geral
Este documento descreve como migrar gradualmente da estrutura atual de estado para o novo sistema de state management global usando Context API.

## Estrutura do Novo Sistema

### Stores Implementados
1. **AppStore**: Estado global principal (autenticação, tema, notificações)
2. **ContractStore**: Estado específico para contratos
3. **NotificationStore**: Estado específico para notificações avançadas

### Hooks Disponíveis
- `useAppStore()`: Hook principal para acesso ao store global
- `useAuth()`, `useTheme()`, `useNotifications()`, `useContracts()`: Hooks especializados
- `useGlobalState()`: Hook unificado para todo o estado

## Migração Gradual

### Fase 1: Estado de Autenticação

#### Antes (Context API antigo)
```typescript
import { useAuth } from '@/hooks/useAuth';

const Component = () => {
  const { user, signIn, signOut } = useAuth();
  // ...
};
```

#### Depois (Store global)
```typescript
import { useAuth } from '@/hooks/useAppStore';

const Component = () => {
  const { user, signIn, signOut, isAuthenticated } = useAuth();
  // ...
};
```

### Fase 2: Estado de Tema

#### Antes
```typescript
// Provider separado ou lógica inline
const [theme, setTheme] = useState('light');
```

#### Depois
```typescript
import { useTheme } from '@/hooks/useAppStore';

const Component = () => {
  const { mode, toggleTheme, setTheme } = useTheme();
  // ...
};
```

### Fase 3: Estado de Notificações

#### Antes
```typescript
// State local ou context separado
const [notifications, setNotifications] = useState([]);
```

#### Depois
```typescript
import { useNotifications } from '@/hooks/useAppStore';

const Component = () => {
  const { 
    global: { notifications, unreadCount },
    actions: { addNotification, markAsRead } 
  } = useNotifications();
  // ...
};
```

### Fase 4: Estado de Contratos

#### Antes
```typescript
// State local em páginas/components
const [currentContract, setCurrentContract] = useState(null);
const [isEditing, setIsEditing] = useState(false);
```

#### Depois
```typescript
import { useContracts } from '@/hooks/useAppStore';

const Component = () => {
  const { 
    state: { currentContract, isEditing },
    actions: { startEditing, updateField, save } 
  } = useContracts();
  // ...
};
```

## Exemplos de Migração por Componente

### 1. Componente de Login
```typescript
// Antes
import { useAuth } from '@/hooks/useAuth';

export const LoginForm = () => {
  const { signIn, loading } = useAuth();
  // ...
};

// Depois
import { useAuth } from '@/hooks/useAppStore';

export const LoginForm = () => {
  const { signIn, loading } = useAuth();
  // A interface permanece igual, só muda a origem
};
```

### 2. Componente de Header/Tema
```typescript
// Antes
import { useTheme } from '@/providers/ThemeProvider';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  // ...
};

// Depois
import { useTheme } from '@/hooks/useAppStore';

export const Header = () => {
  const { mode, toggleTheme } = useTheme();
  // Props ligeiramente diferentes (mode vs theme)
};
```

### 3. Componente de Notificações
```typescript
// Antes
import { useNotifications } from '@/features/notifications/hooks';

export const NotificationBell = () => {
  const { notifications, unreadCount } = useNotifications();
  // ...
};

// Depois
import { useNotifications } from '@/hooks/useAppStore';

export const NotificationBell = () => {
  const { 
    global: { notifications, unreadCount },
    actions: { markAsRead, removeNotification } 
  } = useNotifications();
  // Estrutura mais rica e actions explícitas
};
```

### 4. Página de Contratos
```typescript
// Antes
const ContratosPage = () => {
  const [currentContract, setCurrentContract] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Lógica de estado分散在 vários useState
  // ...
};

// Depois
const ContratosPage = () => {
  const { 
    state: { currentContract, isEditing },
    actions: { startEditing, updateField, save, validate } 
  } = useContracts();
  
  // Estado centralizado com validação automática
  // ...
};
```

## Configuração no App.tsx

### Antes
```typescript
// App.tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
</QueryClientProvider>
```

### Depois
```typescript
// App.tsx
import { AppProviders } from '@/providers';

const App = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>
  );
};
```

## Benefícios da Migração

### 1. **Estado Centralizado**
- Um único lugar para gerenciar todo o estado da aplicação
- Acesso consistente a dados globais
- Redução de prop drilling

### 2. **Type Safety Melhorado**
- Tipos centralizados em `/types/global.ts`
- Interface consistente entre stores
- Melhor IntelliSense

### 3. **Performance**
- Context API otimizada para reads frequentes
- Memoização automática nos hooks customizados
- Redução de re-renders desnecessários

### 4. **Developer Experience**
- Hooks padronizados e fáceis de usar
- Estrutura de estado previsível
- Migração gradual sem quebras

## Checklist de Migração

### Componentes a Migrar
- [ ] `Login` e `AuthForm` - useAuth
- [ ] `Header` e `ThemeToggle` - useTheme
- [ ] `NotificationBell` e `NotificationsPage` - useNotifications
- [ ] `ContratosPage` e `ContractForm` - useContracts
- [ ] Componentes de layout que usam estado global

### Validações Necessárias
- [ ] Todos os hooks funcionam corretamente
- [ ] Performance não foi degradada
- [ ] Estado persiste corretamente
- [ ] Errors handling funciona
- [ ] Loading states funcionam

### Limpeza Pós-Migração
- [ ] Remover providers antigos
- [ ] Remover imports antigos
- [ ] Atualizar types compartilhados
- [ ] Testes de regressão

## Troubleshooting

### Hook não funciona
- Verificar se o componente está dentro do `AppStoreProvider`
- Conferir se os providers estão na ordem correta

### Estado não persiste
- Verificar se o localStorage está sendo usado corretamente
- Conferir se os effects estão executando na ordem correta

### Performance degradada
- Verificar se há muitos re-renders
- Usar `useMemo` e `useCallback` quando necessário
- Verificar se os providers estão otimizados

## Próximos Passos

1. **Migrar componentes um por vez**
2. **Testar cada migração individualmente**
3. **Monitorar performance durante a migração**
4. **Documentar padrões encontrados**
5. **Planejar migração de features específicas**