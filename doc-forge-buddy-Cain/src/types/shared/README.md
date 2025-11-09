# Biblioteca de Tipos Compartilhados

Esta biblioteca centraliza todos os tipos TypeScript da aplicação Doc Forge Buddy, fornecendo uma base sólida e consistente para o desenvolvimento.

## 📁 Estrutura

```
src/types/shared/
├── base.ts          # Tipos fundamentais e entidades base
├── validation.ts    # Schemas Zod e validações
├── events.ts        # Tipos de eventos e interações
├── ui.ts            # Props de componentes e tema
├── database.ts      # Extensões Supabase e repositories
├── audit.ts         # Tipos de auditoria (existente)
├── user.ts          # Tipos de usuário (existente)
├── index.ts         # Barrel export principal
├── examples.ts      # Exemplos de uso
└── README.md        # Esta documentação
```

## 🚀 Como Usar

### Importando Tipos Específicos

```typescript
// Tipos base
import type { UserProfile, Contract, LoadingState } from '@/types/shared';

// Schemas de validação
import { createUserSchema, contractSchema } from '@/types/shared';

// Eventos
import { EventFactory } from '@/types/shared';

// Props de UI
import type { ButtonProps, InputProps } from '@/types/shared';

// Database types
import type { PaginatedResult, BaseRepository } from '@/types/shared';
```

### Usando Schemas de Validação

```typescript
import { createUserSchema, emailSchema } from '@/types/shared';

// Validação com Zod
const validateUser = (data: unknown) => {
  const result = createUserSchema.parse(data);
  return result; // Tipado como CreateUserInput
};

// Validação customizada
const emailValidation = emailSchema.safeParse('user@example.com');
if (emailValidation.success) {
  console.log('Email válido:', emailValidation.data);
}
```

### Criando Componentes com Tipos

```typescript
import type { ButtonProps } from '@/types/shared';

const CustomButton: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  loading, 
  children,
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
};
```

### Usando Tipos de Database

```typescript
import type { BaseRepository, UUID, PaginatedResult } from '@/types/shared';

interface UserRepository extends BaseRepository<UserProfile, ProfileInsert, ProfileUpdate> {
  findByEmail(email: string): Promise<UserProfile | null>;
  findByRole(role: UserRole): Promise<PaginatedResult<UserProfile>>;
}

class UserService implements UserRepository {
  async findById(id: UUID): Promise<UserProfile | null> {
    // Implementação
  }
}
```

## 🛠️ Módulos Detalhados

### base.ts - Tipos Fundamentais

**Tipos principais:**
- `BaseEntity` - Interface base para todas as entidades
- `UserOwnedEntity` - Entidades que pertencem a usuários
- `ApiResponse<T>` - Estrutura padrão de resposta da API
- `PaginationParams` - Parâmetros para paginação
- `AppError` - Interface para erros da aplicação

**Enums:**
- `AuditAction` - Ações de auditoria
- `UserRole` - Papéis de usuário
- `Status` - Status genéricos
- `Priority` - Níveis de prioridade

### validation.ts - Validação com Zod

**Schemas primitivos:**
- `uuidSchema` - Validação de UUID
- `emailSchema` - Validação de email
- `passwordSchema` - Validação de senha
- `phoneSchema` - Validação de telefone brasileiro

**Schemas de negócio:**
- `createUserSchema` - Criação de usuário
- `contractSchema` - Dados de contrato
- `vistoriaSchema` - Dados de vistoria
- `prestadorSchema` - Dados de prestador

**Validadores utilitários:**
- `validateCPF` - Validação de CPF
- `validateCNPJ` - Validação de CNPJ

### events.ts - Sistema de Eventos

**Tipos de eventos:**
- `AuthEvent` - Eventos de autenticação
- `UserActionEvent` - Ações do usuário
- `DataEvent` - Operações de dados
- `BusinessEvent` - Eventos de negócio

**Factory para criação:**
```typescript
import { EventFactory } from '@/types/shared';

const userAction = EventFactory.userAction('button_click', {
  elementText: 'Salvar',
  metadata: { formId: 'user-form' }
});

const dataOp = EventFactory.dataOperation('create', 'contract', {
  entityId: '123',
  success: true
});
```

### ui.ts - Interface do Usuário

**Props de componentes:**
- `ButtonProps` - Props do componente botão
- `InputProps` - Props do componente input
- `ModalProps` - Props do componente modal
- `TableProps` - Props do componente tabela

**Temas e acessibilidade:**
- `ThemeConfig` - Configuração completa de tema
- `AriaProps` - Propriedades ARIA
- `ThemeColors` - Paleta de cores

### database.ts - Supabase e Database

**Repository pattern:**
```typescript
interface ProfileRepository extends BaseRepository<Profile, ProfileInsert, ProfileUpdate> {
  findByEmail(email: string): Promise<Profile | null>;
  findByRole(role: UserRole): Promise<PaginatedResult<Profile>>;
}
```

**Query helpers:**
- `createPaginationParams` - Cria parâmetros de paginação
- `createQueryFilters` - Cria filtros de query
- `PaginatedResult<T>` - Resultado tipado com paginação

## 📊 Estatísticas e Monitoring

### Sistema de Performance

```typescript
import type { PerformanceMetric, HealthCheck } from '@/types/shared';

const trackPerformance = (name: string, value: number, unit: 'ms' | 'bytes') => {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: new Date().toISOString()
  };
  // Enviar para sistema de monitoring
};
```

### Health Checks

```typescript
const checkSystemHealth = (): HealthCheck[] => {
  return [
    {
      service: 'database',
      status: 'healthy',
      responseTime: 150,
      lastCheck: new Date().toISOString()
    }
  ];
};
```

## 🔄 Migração Gradual

### Passo 1: Importar Novos Tipos

```typescript
// Antes
import type { User } from '@/types/domain/user';

// Depois
import type { UserProfile } from '@/types/shared';
```

### Passo 2: Usar Schemas de Validação

```typescript
// Antes
const validateUser = (data: any) => {
  if (!data.email || !data.password) {
    throw new Error('Dados inválidos');
  }
};

// Depois
import { createUserSchema } from '@/types/shared';

const validateUser = (data: any) => {
  return createUserSchema.parse(data);
};
```

### Passo 3: Implementar Repository Pattern

```typescript
// Antes
const createUser = async (data: any) => {
  const { data: result, error } = await supabase
    .from('profiles')
    .insert(data)
    .select()
    .single();
  return result;
};

// Depois
import type { BaseRepository } from '@/types/shared';

class UserService implements BaseRepository<Profile, ProfileInsert, ProfileUpdate> {
  async create(data: ProfileInsert): Promise<Profile> {
    const { data: result, error } = await supabase
      .from('profiles')
      .insert(data)
      .select()
      .single();
    return result;
  }
}
```

## 🎯 Benefícios

1. **Consistência**: Tipos centralizados garantem consistência em toda aplicação
2. **Reutilização**: Evita duplicação de tipos e interfaces
3. **Validação**: Schemas Zod fornecem validação runtime
4. **Documentação**: Tipos auto-documentam o código
5. **Refatoração**: Mudanças centralizadas são propagadas automaticamente
6. **Performance**: Tree-shaking elimina código não utilizado

## 📝 Convenções

### Nomenclatura

- **Interfaces**: PascalCase com sufixo descritivo (`UserProfile`, `ContractData`)
- **Types**: PascalCase (`LoadingState`, `ApiResponse<T>`)
- **Enums**: PascalCase com valores em UPPER_CASE (`UserRole`, `AuditAction`)
- **Schemas**: camelCase com sufixo Schema (`createUserSchema`, `contractSchema`)

### Estrutura de Arquivos

- Um tipo por arquivo quando possível
- Agrupar tipos relacionados
- Usar barrel exports (`index.ts`)
- Documentar com JSDoc

### Testes de Tipos

```typescript
// Teste básico
const user: UserProfile = {
  id: '123',
  email: 'user@example.com',
  full_name: 'John Doe',
  role: 'user',
  is_active: true,
  exp: 0,
  level: 1,
  last_password_change: null,
  two_factor_enabled: false,
  two_factor_secret: null,
  two_factor_backup_codes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: '123'
};

// Teste de schema
const testValidation = () => {
  const validData = createUserSchema.parse({
    email: 'user@example.com',
    full_name: 'John Doe',
    role: 'user'
  });
  // validData é tipado como CreateUserInput
};
```

## 🤝 Contribuindo

1. Adicione novos tipos ao módulo apropriado
2. Documente com JSDoc
3. Crie schemas de validação quando aplicável
4. Atualize o `index.ts` com novos exports
5. Adicione exemplos ao `examples.ts`
6. Execute type-checking: `npm run type-check`

## 📚 Recursos Adicionais

- [Documentação do Zod](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Supabase TypeScript](https://supabase.com/docs/reference/javascript/typescript-support)

---

**Mantenha esta biblioteca atualizada e bem documentada para garantir desenvolvimento eficiente e consistente.**