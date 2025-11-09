# Guia de Boas Práticas - Imports de Tipos

## 📋 Objetivo
Este documento estabelece as melhores práticas para importação de tipos no projeto, garantindo consistência, performance e manutenibilidade.

## 🎯 Princípios Fundamentais

### 1. **Barrel Exports (Preferido)**
Use barrel exports para importar múltiplos tipos relacionados:

```typescript
// ✅ BOM - Barrel export
import { User, Contract, Task } from '@/types';

// ❌ RUIM - Imports individuais
import { User } from '@/types/domain/user';
import { Contract } from '@/types/domain/contract';
import { Task } from '@/types/domain/task';
```

### 2. **Imports Específicos (Quando Necessário)**
Use imports específicos apenas para tipos únicos ou não relacionados:

```typescript
// ✅ BOM - Tipo específico
import { UniqueId } from '@/types/common';

// ❌ RUIM - Múltiplos tipos do mesmo módulo
import { TypeA } from '@/types/specific';
import { TypeB } from '@/types/specific';
import { TypeC } from '@/types/specific';
```

### 3. **Agrupamento de Imports**
Agrupar imports relacionados no mesmo módulo:

```typescript
// ✅ BOM - Agrupado
import { 
  UserProfile, 
  UserPermissions, 
  UserStatus 
} from '@/types/admin';

// ❌ RUIM - Separados
import { UserProfile } from '@/types/admin';
import { UserPermissions } from '@/types/admin';
import { UserStatus } from '@/types/admin';
```

## 📁 Estrutura de Tipos

### Barrel Exports Principais
```
src/types/
├── index.ts           # Export principal
├── domain/            # Tipos de domínio (auth, contract, task)
│   ├── index.ts       # Barrel export do domínio
│   ├── auth.ts
│   ├── contract.ts
│   └── task.ts
├── business/          # Tipos de negócio
│   ├── index.ts
│   ├── admin.ts
│   ├── audit.ts
│   └── ...
├── features/          # Tipos específicos de features
│   ├── index.ts
│   ├── chat.ts
│   └── ...
└── ui/                # Tipos de interface
    ├── index.ts
    └── icons.ts
```

### Aliases Configurados (tsconfig.json)
```json
{
  "compilerOptions": {
    "paths": {
      "@types/*": ["src/types/*"],
      "@hooks/*": ["src/hooks/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@pages/*": ["src/pages/*"],
      "@features/*": ["src/features/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

## 🔧 Padrões de Import

### **1. Import Único (Mais Comum)**
```typescript
import { User } from '@/types';
```

### **2. Import Múltiplo (Quando Relacionado)**
```typescript
import { 
  User, 
  Contract, 
  TaskStatus 
} from '@/types';
```

### **3. Import com Renomeação**
```typescript
import { 
  User as UserType, 
  Contract as ContractType 
} from '@/types';
```

### **4. Import de Tipo Específico**
```typescript
import type { User, Contract } from '@/types';
```

## ⚠️ Evite

### **Imports Relativos Longos**
```typescript
// ❌ RUIM
import { User } from '../../../../types/domain/user';
import { Contract } from '../../../types/domain/contract';

// ✅ BOM
import { User, Contract } from '@/types';
```

### **Imports Desnecessários**
```typescript
// ❌ RUIM - Importa tudo
import * as Types from '@/types';

// ✅ BOM - Importa apenas o necessário
import { User, Contract } from '@/types';
```

### **Imports Duplicados**
```typescript
// ❌ RUIM
import { User } from '@/types';
import { User } from '@/types'; // Duplicado!

// ✅ BOM
import { User } from '@/types';
```

## 🛠️ Ferramentas de Validação

### Script de Análise
Execute periodicamente para manter imports organizados:
```bash
python /workspace/validate_types_optimization.py
```

### Regras ESLint (Sugeridas)
```json
{
  "rules": {
    "@typescript-eslint/consistent-type-imports": "error",
    "no-duplicate-imports": "error",
    "import/no-relative-packages": "error"
  }
}
```

## 📊 Benefícios Alcançados

### **Performance**
- ✅ Menos imports para processar
- ✅ Melhor tree-shaking
- ✅ Bundle menor

### **Manutenibilidade**
- ✅ Imports organizados e consistentes
- ✅ Menos verbosidade no código
- ✅ Facilita refatoração

### **DX (Developer Experience)**
- ✅ IntelliSense mais eficiente
- ✅ Menos erros de import
- ✅ Navegação mais fácil

## 🎯 Checklist de Review

Antes de fazer commit, verifique:

- [ ] Uso de barrel exports quando apropriado
- [ ] Imports agrupados por módulo
- [ ] Sem imports relativos longos
- [ ] Sem imports duplicados
- [ ] Tipos importados apenas quando necessários
- [ ] Consistência com padrões do projeto

## 📈 Monitoramento

### Métricas Acompanhar
- Número total de imports por arquivo
- Percentual de barrel exports utilizados
- Frequência de imports duplicados
- Tempo de compilação TypeScript

### Relatórios Automáticos
Execute semanalmente:
```bash
python /workspace/optimize_types_imports_fixed.py
```

## 🚀 Próximos Passos

1. **Treinamento da Equipe**
   - Compartilhar este guia
   - Exemplos práticos em code reviews

2. **Automação**
   - Pre-commit hooks para validação
   - Integração CI/CD com verificação de imports

3. **Monitoramento Contínuo**
   - Métricas de performance
   - Análise de bundle size
   - Satisfação dos desenvolvedores

---

**Data de Criação:** 2025-11-09  
**Responsável:** Task Agent - Otimização de Imports  
**Revisão:** Mensal
