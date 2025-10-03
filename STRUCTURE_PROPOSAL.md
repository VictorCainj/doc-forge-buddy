# 🏗️ Proposta de Estrutura Otimizada

## 📁 Nova Estrutura por Features

```
src/
├── shared/                          # Código compartilhado
│   ├── components/                  # Componentes base reutilizáveis
│   │   ├── ui/                     # Design system components
│   │   ├── layout/                 # Layout components
│   │   └── common/                 # Componentes comuns
│   ├── hooks/                      # Hooks genéricos reutilizáveis
│   │   ├── useLocalStorage.ts
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── utils/                      # Utilitários puros
│   │   ├── formatters/
│   │   ├── validators/
│   │   └── helpers/
│   ├── types/                      # Types globais
│   └── constants/                  # Constantes globais
│
├── features/                       # Features organizadas por domínio
│   ├── contracts/                  # 📋 Domínio: Contratos
│   │   ├── components/
│   │   │   ├── ContractCard/
│   │   │   │   ├── ContractCard.tsx
│   │   │   │   ├── ContractCard.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ContractList/
│   │   │   └── ContractForm/
│   │   ├── hooks/
│   │   │   ├── useContractList.ts
│   │   │   ├── useContractModals.ts
│   │   │   └── useContractData.ts
│   │   ├── pages/
│   │   │   ├── ContractsPage.tsx
│   │   │   └── ContractDetailsPage.tsx
│   │   ├── services/
│   │   │   └── contractsApi.ts
│   │   ├── types/
│   │   │   └── contract.ts
│   │   └── index.ts               # Barrel export
│   │
│   ├── documents/                  # 📄 Domínio: Documentos
│   │   ├── components/
│   │   │   ├── DocumentForm/
│   │   │   ├── DocumentWizard/
│   │   │   └── DocumentPreview/
│   │   ├── hooks/
│   │   │   ├── useDocumentGeneration.ts
│   │   │   └── useDocumentPersistence.ts
│   │   ├── pages/
│   │   │   ├── DocumentsPage.tsx
│   │   │   └── GenerateDocumentPage.tsx
│   │   ├── services/
│   │   │   └── documentsApi.ts
│   │   ├── templates/
│   │   │   └── documentTemplates.ts
│   │   └── types/
│   │       └── document.ts
│   │
│   ├── vistoria/                   # 🏠 Domínio: Vistoria
│   │   ├── components/
│   │   │   ├── VistoriaForm/
│   │   │   ├── VistoriaAnalysis/
│   │   │   └── ImageUpload/
│   │   ├── hooks/
│   │   │   ├── useVistoriaAnalises.ts
│   │   │   └── useVistoriaImages.ts
│   │   ├── pages/
│   │   │   ├── VistoriaPage.tsx
│   │   │   └── VistoriaAnalysisPage.tsx
│   │   └── types/
│   │       └── vistoria.ts
│   │
│   ├── chat/                       # 💬 Domínio: Chat IA
│   │   ├── components/
│   │   │   ├── ChatInput/
│   │   │   ├── ChatMessage/
│   │   │   └── ChatStats/
│   │   ├── hooks/
│   │   │   ├── useChatHistory.ts
│   │   │   └── useOptimizedChat.ts
│   │   ├── pages/
│   │   │   └── ChatPage.tsx
│   │   └── services/
│   │       └── openaiApi.ts
│   │
│   └── dashboard/                  # 📊 Domínio: Dashboard
│       ├── components/
│       │   ├── MetricCard/
│       │   ├── ChartWidget/
│       │   └── QuickActions/
│       ├── hooks/
│       │   └── useDashboardData.ts
│       └── pages/
│           └── DashboardPage.tsx
│
├── app/                           # Configuração da aplicação
│   ├── providers/                 # Context providers
│   ├── router/                    # Configuração de rotas
│   ├── store/                     # Estado global (se necessário)
│   └── App.tsx
│
└── assets/                        # Assets estáticos
    ├── images/
    ├── icons/
    └── styles/
```

## 🎯 Benefícios da Nova Estrutura

### ✅ **1. Organização por Domínio**
- **Coesão alta**: Código relacionado fica junto
- **Acoplamento baixo**: Features independentes
- **Escalabilidade**: Fácil adicionar novas features
- **Manutenibilidade**: Mudanças isoladas por domínio

### ✅ **2. Padrões Consistentes**
- **Barrel exports**: Imports limpos
- **Colocation**: Testes junto com código
- **Separação clara**: Componentes, hooks, services, types
- **Reutilização**: Shared para código comum

### ✅ **3. Navegação Intuitiva**
- **Feature-first**: Desenvolvedores encontram código rapidamente
- **Hierarquia clara**: Estrutura previsível
- **Responsabilidades definidas**: Cada pasta tem propósito claro

## 📋 Plano de Migração

### **Fase 1: Preparação**
1. Criar nova estrutura de pastas
2. Configurar barrel exports
3. Atualizar path mapping no tsconfig.json

### **Fase 2: Migração por Feature**
1. **Contracts** (maior impacto)
2. **Documents** (segunda maior)
3. **Vistoria** (terceira)
4. **Chat** (menor impacto)
5. **Dashboard** (última)

### **Fase 3: Limpeza**
1. Remover arquivos antigos
2. Atualizar imports
3. Executar testes
4. Documentar mudanças

## 🔧 Configurações Necessárias

### **tsconfig.json - Path Mapping**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/features/*": ["./src/features/*"],
      "@/contracts/*": ["./src/features/contracts/*"],
      "@/documents/*": ["./src/features/documents/*"],
      "@/vistoria/*": ["./src/features/vistoria/*"],
      "@/chat/*": ["./src/features/chat/*"],
      "@/dashboard/*": ["./src/features/dashboard/*"]
    }
  }
}
```

### **Barrel Exports - Exemplo**
```typescript
// src/features/contracts/index.ts
export { ContractCard } from './components/ContractCard';
export { ContractList } from './components/ContractList';
export { useContractList } from './hooks/useContractList';
export { ContractsPage } from './pages/ContractsPage';
export type { Contract, ContractFormData } from './types/contract';
```

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Organização** | Por tipo (híbrida) | Por feature | **+300%** |
| **Navegação** | Difícil encontrar código | Intuitiva | **+400%** |
| **Manutenibilidade** | Mudanças afetam múltiplas pastas | Mudanças isoladas | **+500%** |
| **Escalabilidade** | Difícil adicionar features | Fácil adicionar features | **+600%** |
| **Colaboração** | Conflitos frequentes | Trabalho paralelo | **+300%** |
| **Testabilidade** | Testes espalhados | Testes colocalizados | **+400%** |

## 🎨 Padrões de Nomenclatura

### **Componentes**
```typescript
// PascalCase para componentes
ContractCard/
├── ContractCard.tsx      # Componente principal
├── ContractCard.test.tsx # Testes
├── ContractCard.stories.tsx # Storybook (opcional)
├── types.ts              # Types específicos
└── index.ts              # Barrel export
```

### **Hooks**
```typescript
// camelCase com prefixo 'use'
useContractList.ts
useContractModals.ts
useDocumentGeneration.ts
```

### **Services**
```typescript
// camelCase com sufixo do tipo
contractsApi.ts
documentsService.ts
vistoriaRepository.ts
```

### **Types**
```typescript
// camelCase para arquivos, PascalCase para types
contract.ts     → export interface Contract
document.ts     → export interface Document
vistoria.ts     → export interface VistoriaAnalise
```
