# Padrões de Código - Doc Forge Buddy

Este documento descreve os padrões de código, convenções e práticas recomendadas para o desenvolvimento no projeto.

## Estrutura de Arquivos

### Organização de Diretórios

```
src/
├── components/          # Componentes React reutilizáveis
├── features/            # Features organizadas por domínio
│   ├── contracts/
│   ├── documents/
│   └── vistoria/
├── hooks/               # Custom hooks
├── lib/                 # Bibliotecas e configurações
├── pages/               # Páginas/rotas
├── services/            # Serviços e lógica de negócio
├── types/               # TypeScript types e interfaces
├── utils/               # Funções utilitárias
└── __tests__/           # Testes unitários
```

## Convenções de Nomenclatura

### Arquivos e Diretórios

- **Componentes:** PascalCase - `UserProfile.tsx`
- **Hooks:** camelCase com prefixo `use` - `useAuth.ts`
- **Utilitários:** camelCase - `dateHelpers.ts`
- **Types:** camelCase - `contract.ts`
- **Serviços:** PascalCase - `ImageService.ts`

### Variáveis e Funções

```typescript
// ✅ Bom
const userName = 'John';
const isAuthenticated = true;
const handleSubmit = () => {};
const fetchUserData = async () => {};

// ❌ Ruim
const user_name = 'John';
const IsAuthenticated = true;
const SubmitHandler = () => {};
```

### Constantes

```typescript
// ✅ Bom - Constantes em UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;
```

### Componentes

```typescript
// ✅ Bom
export const UserProfile: React.FC<Props> = ({ user }) => {
  return <div>{user.name}</div>;
};

// ✅ Ou melhor ainda - sem React.FC
export const UserProfile = ({ user }: Props) => {
  return <div>{user.name}</div>;
};
```

### Interfaces e Types

```typescript
// ✅ Bom - Interface para objetos extensíveis
export interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Bom - Type para união ou interseção
export type Status = 'pending' | 'approved' | 'rejected';
export type FormData = Record<string, unknown>;
```

## Padrões de Componentes

### Estrutura Padrão

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';

// Types e interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const Component = ({ title, onAction }: ComponentProps) => {
  // 1. Hooks
  const [state, setState] = React.useState<Type>();
  
  // 2. Handlers
  const handleClick = () => {
    // lógica
  };
  
  // 3. Effects
  React.useEffect(() => {
    // side effects
  }, []);
  
  // 4. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
};
```

### Componentes com Children

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card = ({ title, children }: CardProps) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="content">{children}</div>
    </div>
  );
};
```

## Padrões de Hooks

### Custom Hooks

```typescript
// ✅ Bom - Nome descritivo, retorna interface clara
export const useContractData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    // lógica
  }, []);
  
  return {
    loading,
    error,
    fetchData,
  };
};

// ✅ Bom - Hook específico com tipos
export const useFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ...
  
  return { data, loading };
};
```

### useCallback e useMemo

```typescript
// ✅ Use useCallback para funções passadas como props
const handleClick = useCallback(() => {
  // lógica
}, [dependencies]);

// ✅ Use useMemo para cálculos custosos
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.id - b.id);
}, [items]);
```

## Padrões de Funções

### Funções Puras

```typescript
// ✅ Bom - Função pura, previsível
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

// ❌ Ruim - Side effect
export const formatDate = (date: Date): string => {
  console.log(date); // side effect
  return date.toLocaleDateString('pt-BR');
};
```

### Error Handling

```typescript
// ✅ Bom - Try-catch com mensagens específicas
export const fetchData = async (id: string) => {
  try {
    const response = await api.get(`/data/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Falha ao buscar dados: ${error.message}`);
    }
    throw new Error('Erro desconhecido ao buscar dados');
  }
};

// ✅ Bom - Result pattern
export const fetchData = async (id: string): Promise<Result<Data>> => {
  try {
    const response = await api.get(`/data/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};
```

## Padrões de Async/Await

```typescript
// ✅ Bom - Async/await
export const getUserData = async (id: string) => {
  const user = await api.getUser(id);
  const profile = await api.getProfile(user.profileId);
  return { user, profile };
};

// ✅ Bom - Promise.all para operações paralelas
export const getUserData = async (id: string) => {
  const [user, settings] = await Promise.all([
    api.getUser(id),
    api.getSettings(id),
  ]);
  return { user, settings };
};

// ✅ Bom - Error handling
export const saveData = async (data: Data) => {
  try {
    await api.save(data);
  } catch (error) {
    console.error('Erro ao salvar:', error);
    throw new Error('Falha ao salvar dados');
  }
};
```

## TypeScript

### Tipos Específicos

```typescript
// ✅ Bom - Tipos específicos
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Ruim - any
const user: any = { id: '1', name: 'John' };

// ✅ Bom - Unknown quando necessário
const data: unknown = fetchData();
if (typeof data === 'string') {
  console.log(data.toUpperCase());
}
```

### Generics

```typescript
// ✅ Bom - Use generics para reutilização
export const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  return response.json();
};

// Uso
const users = await fetchData<User[]>('/api/users');
```

### Optional e Nullable

```typescript
// ✅ Bom - Use ? para opcionais
interface User {
  id: string;
  name: string;
  email?: string; // opcional
}

// ✅ Bom - Explicit null
interface Config {
  apiKey: string | null; // explicit nullable
}
```

## Imports e Exports

### Ordenação de Imports

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Bibliotecas externas
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// 3. Imports internos (features, components, hooks, utils)
import { UserProfile } from '@/components/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateHelpers';

// 4. Types
import type { User } from '@/types/user';
```

### Barrel Exports

```typescript
// services/index.ts
export { ImageService } from './ImageService';
export { UserService } from './UserService';
export type { ServiceConfig } from './types';
```

## Estilização (Tailwind CSS)

### Classes Utilitárias

```typescript
// ✅ Bom - Classes agrupadas logicamente
<div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-md">

// ✅ Bom - Variantes com cn()
import { cn } from '@/lib/utils';

<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-blue-500",
  size === 'lg' && "text-lg"
)}>
```

### Componentes UI

```typescript
// ✅ Bom - Reutilizar componentes do shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
</Card>
```

## Comentários e Documentação

### JSDoc para Funções

```typescript
/**
 * Formata uma data para o padrão brasileiro
 * @param date - Data a ser formatada
 * @returns String formatada (dd/mm/yyyy)
 * @example
 * formatDate(new Date()) // "27/01/2025"
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};
```

### Comentários Inline

```typescript
// ✅ Bom - Explica o "porquê", não o "o quê"
// Usamos setTimeout para evitar race condition durante navegação
setTimeout(() => {
  navigate('/destination');
}, 800);

// ❌ Ruim - Comenta o óbvio
// Incrementa o contador
counter++;
```

## Boas Práticas

### 1. DRY (Don't Repeat Yourself)

```typescript
// ❌ Ruim - Duplicação
const users = data.map(item => item.user.name);
const emails = data.map(item => item.user.email);

// ✅ Bom - Função reutilizável
const extractField = <T,>(data: T[], field: keyof T) => 
  data.map(item => item[field]);

const names = extractField(data, 'name');
const emails = extractField(data, 'email');
```

### 2. Single Responsibility

```typescript
// ❌ Ruim - Faz muitas coisas
const handleSubmit = async (data) => {
  validate(data);
  format(data);
  await save(data);
  notify();
  redirect();
};

// ✅ Bom - Responsabilidade única
const processForm = async (data) => {
  const validData = validateData(data);
  const formattedData = formatData(validData);
  return await saveData(formattedData);
};
```

### 3. Early Returns

```typescript
// ❌ Ruim - Nested conditions
const getValue = (data) => {
  if (data) {
    if (data.value) {
      return data.value;
    }
  }
  return null;
};

// ✅ Bom - Early return
const getValue = (data) => {
  if (!data?.value) return null;
  return data.value;
};
```

### 4. Desestruturação

```typescript
// ✅ Bom - Desestruturação clara
const { id, name, email } = user;

// ✅ Bom - Renomear durante desestruturação
const { name: userName, email: userEmail } = user;

// ✅ Bom - Rest operator
const { password, ...publicUser } = user;
```

## Checklist de Code Review

- [ ] Código segue padrões de nomenclatura
- [ ] Funções têm responsabilidade única
- [ ] Erros são tratados adequadamente
- [ ] Não há código duplicado
- [ ] Imports estão ordenados
- [ ] Tipos TypeScript são específicos (sem `any`)
- [ ] Comentários explicam o "porquê"
- [ ] Nenhum console.log deixado no código
- [ ] Performance otimizada (useMemo, useCallback)
- [ ] Acessibilidade considerada

---

**Última Atualização:** 27/01/2025
