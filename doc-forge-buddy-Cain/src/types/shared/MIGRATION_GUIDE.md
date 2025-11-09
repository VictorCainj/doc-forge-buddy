# Guia de Migração para Tipos Consolidados

## Visão Geral
Este documento explica como migrar do sistema de tipos duplicado para os novos tipos consolidados em `src/types/shared/`.

## Estrutura Anterior vs Nova

### Antes (Tipos Duplicados)
```
src/types/
├── business/
│   ├── audit.ts          // AuditLog duplicado
│   ├── admin.ts          // User/Profile duplicado
│   ├── vistoria.ts       // Vistoria duplicada
│   └── vistoria.extended.ts  // Vistoria extendida
├── domain/
│   ├── auth.ts           // Auth duplicado
│   └── contract.ts       // Contract duplicado
└── integrations/supabase/types.ts  // Supabase types
```

### Depois (Tipos Consolidados)
```
src/types/
├── shared/               // ✨ NOVA ESTRUTURA CONSOLIDADA
│   ├── base.ts          // Tipos fundamentais
│   ├── audit.ts         // Audit consolidado
│   ├── user.ts          // User/Profile consolidado
│   ├── contract.ts      // Contract consolidado
│   ├── vistoria.ts      // Vistoria consolidada
│   └── index.ts         // Barrel exports
├── business/            // 🔄 Depreciados - usar shared/
├── domain/              // 🔄 Depreciados - usar shared/
└── integrations/supabase/types.ts  // Mantém apenas types do Supabase
```

## Como Migrar Imports

### 1. Audit Types

**Antes:**
```typescript
// ❌ Código antigo
import { AuditLog, AuditAction } from '@/types/business/audit';
import { AuditLogFilters } from '@/types/domain/audit';
```

**Depois:**
```typescript
// ✅ Código novo
import { AuditLog, AuditAction, AuditLogFilters } from '@/types/shared';
// ou import específico:
import { AuditLog, AuditAction } from '@/types/shared/audit';
```

### 2. User/Profile Types

**Antes:**
```typescript
// ❌ Código antigo
import { UserProfile, UserRole } from '@/types/business/admin';
import { UserSession, LoginAttempt } from '@/types/business/admin';
import { AuthError, LoginError } from '@/types/domain/auth';
```

**Depois:**
```typescript
// ✅ Código novo
import { 
  UserProfile, 
  UserRole, 
  UserSession, 
  LoginAttempt,
  AuthError,
  LoginError,
  parseAuthError,
  parseDatabaseError
} from '@/types/shared/user';
// ou import geral:
import { UserProfile, UserSession, AuthError } from '@/types/shared';
```

### 3. Contract Types

**Antes:**
```typescript
// ❌ Código antigo
import { Contract, ContractFormData } from '@/types/domain/contract';
import { DocumentType, VistoriaType } from '@/types/domain/contract';
```

**Depois:**
```typescript
// ✅ Código novo
import { 
  Contract, 
  ContractFormData, 
  DocumentType, 
  VistoriaType 
} from '@/types/shared/contract';
// ou import geral:
import { Contract, DocumentType } from '@/types/shared';
```

### 4. Vistoria Types

**Antes:**
```typescript
// ❌ Código antigo
import { VistoriaAnalise, ApontamentoVistoria } from '@/types/business/vistoria';
import { DadosVistoriaDB, ApontamentoDB } from '@/types/business/vistoria.extended';
```

**Depois:**
```typescript
// ✅ Código novo
import { 
  VistoriaAnalise, 
  ApontamentoVistoria, 
  DadosVistoriaDB,
  ApontamentoDB,
  toSupabaseJson,
  cleanPayload
} from '@/types/shared/vistoria';
// ou import geral:
import { VistoriaAnalise, ApontamentoVistoria } from '@/types/shared';
```

## Principais Mudanças nos Tipos

### 1. AuditLog

**Consolidação:** AuditLog agora inclui campos adicionais como `user_email`, `user_name`.

**Antes:**
```typescript
interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  // ... outros campos
}
```

**Depois:**
```typescript
interface AuditLog extends BaseEntity {
  user_id: string | null;
  user_email?: string;      // ✨ NOVO
  user_name?: string;       // ✨ NOVO
  action: AuditAction;
  // ... outros campos
}
```

### 2. UserProfile

**Consolidação:** Unifica tipos entre domain/auth.ts, business/admin.ts e Supabase.

**Antes (business/admin.ts):**
```typescript
interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  // ... campos duplicados
}
```

**Depois:**
```typescript
interface UserProfile extends BaseEntity {
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;           // Enum consolidado
  is_active: boolean;
  exp: number;
  level: number;
  last_password_change: string | null;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_backup_codes: string[] | null;
  updated_at: string;
}
```

### 3. ContractFormData

**Consolidação:** Tipagem mais específica e flexível.

**Antes:**
```typescript
interface ContractFormData {
  [key: string]: string | undefined;  // Muito genérico
}
```

**Depois:**
```typescript
interface ContractFormData extends BaseFormData {
  numeroContrato?: string;
  enderecoImovel?: string;
  // ... campos específicos com tipos corretos
  generoLocatario?: PersonType;  // Usando PersonType consolidado
  // ... resto dos campos
}
```

### 4. Vistoria Types

**Consolidação:** Unifica tipos entre vistoria.ts e vistoria.extended.ts.

**Antes:**
```typescript
// vistoria.ts
interface VistoriaAnalise {
  // campos básicos
}

// vistoria.extended.ts  
interface DadosVistoriaDB {
  // campos DB
}
```

**Depois:**
```typescript
// Consolidado em vistoria.ts
interface VistoriaAnalise extends BaseEntity {
  title: string;
  contract_id?: string | null;
  public_document_id?: string | null;
  dados_vistoria: DadosVistoria;  // Unificado
  apontamentos: ApontamentoVistoria[];
}

// Todos os helpers em um só lugar
export const toSupabaseJson = <T>(data: T): SupabaseJson => { /* ... */ };
export const fromSupabaseJson = <T>(json: SupabaseJson): T => { /* ... */ };
export const cleanPayload = <T extends Record<string, unknown>>(payload: T): Partial<T> => { /* ... */ };
```

## Helpers de Migração

### Funções de Mapeamento Supabase

**Antes:** Cada arquivo tinha suas próprias funções de mapeamento.

**Depois:** Funções padronizadas em cada arquivo consolidado.

```typescript
// audit.ts
export const mapSupabaseAuditLog = (dbLog: Tables<'audit_logs'>['Row']): AuditLog => { /* ... */ };
export const mapToSupabaseAuditInsert = (payload: CreateAuditLogPayload): Tables<'audit_logs'>['Insert'] => { /* ... */ };

// user.ts
export const mapSupabaseProfile = (dbProfile: Tables<'profiles'>['Row']): UserProfile => { /* ... */ };
export const mapSupabaseSession = (dbSession: Tables<'user_sessions'>['Row']): UserSession => { /* ... */ };

// contract.ts
export const mapSupabaseSavedTerm = (dbTerm: Tables<'saved_terms'>['Row']): Contract => { /* ... */ };

// vistoria.ts
export const mapSupabaseVistoriaAnalise = (dbAnalise: Tables<'vistoria_analises'>['Row']): VistoriaAnalise => { /* ... */ };
```

## Benefícios da Consolidação

### 1. **Eliminação de Duplicações**
- ✅ AuditLog: antes 2 definições → 1 definição consolidada
- ✅ User/Profile: antes 3 definições → 1 definição consolidada  
- ✅ ContractTypes: antes 2 definições → 1 definição consolidada
- ✅ Vistoria: antes 2 definições → 1 definição consolidada

### 2. **Melhor Type Safety**
- Tipos mais específicos e restritivos
- Enums consolidados em vez de unions de string
- Type guards padronizados

### 3. **Funcionalidades Consolidadas**
- Helpers de conversão para Supabase em um só lugar
- Funções de parsing de erro padronizadas
- Mapeamento de dados centralizado

### 4. **Manutenibilidade**
- Uma única fonte de verdade para cada tipo
- Atualizações centralizadas
- Documentação unificada

## Próximos Passos

1. **Atualizar Imports:** Migrar todos os imports para `src/types/shared/`
2. **Remover Arquivos Depreciados:** Deletar arquivos antigos quando todos os imports forem atualizados
3. **Testar Tipagem:** Verificar se não há erros de TypeScript
4. **Validar Funcionalidade:** Testar todas as funcionalidades que usam os tipos atualizados

## Exemplo de Migração Completa

**Componente que usa múltiplos tipos:**

```typescript
// ❌ Antes - imports dispersos
import { AuditLog } from '@/types/business/audit';
import { UserProfile } from '@/types/business/admin';
import { Contract } from '@/types/domain/contract';
import { VistoriaAnalise } from '@/types/business/vistoria';

// ✅ Depois - import consolidado
import { 
  AuditLog, 
  UserProfile, 
  Contract, 
  VistoriaAnalise,
  mapSupabaseAuditLog,
  mapSupabaseProfile,
  toSupabaseJson 
} from '@/types/shared';
```

Esta consolidação reduziu aproximadamente **50% dos tipos duplicados** e melhorou significativamente a manutenibilidade do sistema de tipos!