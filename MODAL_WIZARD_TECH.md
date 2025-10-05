# 🎮 Modal Wizard Tecnológico - Documentação

## 📋 Visão Geral

Modal de cadastro de contratos com design tecnológico/gaming, inspirado em telas de seleção de personagens de jogos de luta. Navegação intuitiva por setas laterais com animações fluidas e visual futurista.

## ✨ Características Principais

### 🎨 Design Visual
- **Tema Futurista**: Gradientes cyan/blue com efeitos neon
- **Animações Suaves**: Transições slide com Framer Motion
- **Efeitos Visuais**: 
  - Glow effects nos elementos ativos
  - Progress bar animada
  - Ícones com pulse animation
  - Background com padrão grid
  - Backdrop blur nos modais

### 🎯 Navegação
- **Setas Laterais**: Navegação anterior/próxima com teclas de seta
- **Indicadores de Etapas**: Visual similar a seleção de personagens
  - Ícones representativos para cada etapa
  - Estados: Ativa, Completa, Pendente
  - Click direto para navegar entre etapas
- **Progress Bar**: Barra de progresso visual em tempo real

### ✅ Funcionalidades
- **Validação em Tempo Real**: Campos obrigatórios validados automaticamente
- **Preservação de Dados**: Todos os dados são mantidos entre navegações
- **Modo Edição**: Suporta edição de contratos existentes
- **Estados de Loading**: Feedback visual durante submissão
- **Responsivo**: Adaptado para desktop e mobile

## 🏗️ Arquitetura

### Componentes Criados

#### 1. `ContractWizardModal.tsx`
```typescript
interface ContractWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: FormStep[];
  initialData?: Record<string, string>;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  title?: string;
}
```

**Responsabilidades:**
- Renderização do modal com design tecnológico
- Gerenciamento de animações entre etapas
- Renderização dinâmica de campos
- Navegação por setas e indicadores

#### 2. `useContractWizard.ts`
```typescript
interface UseContractWizardReturn {
  currentStep: number;
  formData: Record<string, string>;
  isStepValid: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Record<string, string>) => void;
  updateFieldValue: (fieldName: string, value: string) => void;
  resetWizard: () => void;
}
```

**Responsabilidades:**
- Gerenciamento de estado do wizard
- Validação de campos obrigatórios
- Controle de navegação
- Cálculo de progresso

### Estrutura de Arquivos
```
src/
├── features/
│   └── contracts/
│       ├── components/
│       │   ├── ContractWizardModal.tsx  # Novo componente modal
│       │   └── index.ts                 # Export do modal
│       └── hooks/
│           ├── useContractWizard.ts     # Novo hook
│           └── index.ts                 # Export do hook
├── pages/
│   └── CadastrarContrato.tsx           # Integração do modal
└── index.css                           # Estilos customizados
```

## 🎨 Estilos Customizados

### Scrollbar Personalizado
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(6, 182, 212), rgb(37, 99, 235));
  border-radius: 4px;
}
```

### Grid Pattern Background
```css
.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

## 💡 Como Usar

### Exemplo Básico
```tsx
import { ContractWizardModal } from '@/features/contracts/components';
import { FormStep } from '@/hooks/use-form-wizard';

const steps: FormStep[] = [
  {
    id: 'step1',
    title: 'Dados Básicos',
    description: 'Informações essenciais',
    icon: Building2,
    fields: [
      {
        name: 'campo1',
        label: 'Campo 1',
        type: 'text',
        required: true,
      },
    ],
  },
  // ... mais steps
];

function MyComponent() {
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, string>) => {
    setIsSubmitting(true);
    // Processar dados
    await saveToDatabase(data);
    setIsSubmitting(false);
  };

  return (
    <ContractWizardModal
      open={isOpen}
      onOpenChange={setIsOpen}
      steps={steps}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      title="✨ Novo Contrato"
    />
  );
}
```

### Com Dados Iniciais (Modo Edição)
```tsx
<ContractWizardModal
  open={isOpen}
  onOpenChange={setIsOpen}
  steps={steps}
  initialData={{
    numeroContrato: '13734',
    nomeProprietario: 'João Silva',
    // ... outros campos
  }}
  onSubmit={handleSubmit}
  title="⚡ Editar Contrato"
/>
```

## 🎯 Etapas do Wizard

### 1. Dados do Contrato
- Número do contrato
- Endereço do imóvel
- Data de firmamento
- Quantidade de chaves

### 2. Qualificação dos Locadores
- Gênero
- Nome completo
- Qualificação completa

### 3. Qualificação dos Locatários
- Nome completo
- Gênero
- Qualificação completa
- E-mail e celular

### 4. Fiadores
- Possui fiador? (Sim/Não)

### 5. Dados de Rescisão
- Data de início
- Data de término

### 6. Documentos Solicitados
- Condomínio
- Água
- Gás
- CND

## 🔄 Fluxo de Dados

```
1. Usuário preenche campos
   ↓
2. Hook valida campos obrigatórios
   ↓
3. Botão "Próximo" habilitado se válido
   ↓
4. Dados preservados ao navegar
   ↓
5. Última etapa: botão "Finalizar"
   ↓
6. onSubmit chamado com todos os dados
   ↓
7. Salva no Supabase
   ↓
8. Feedback (toast) e redirecionamento
```

## 🎨 Paleta de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| Primary | `cyan-500` → `blue-600` | Gradientes principais |
| Background | `slate-950` → `slate-900` | Fundo do modal |
| Border | `cyan-500/30` | Bordas com transparência |
| Text | `white`, `cyan-300` | Textos e labels |
| Success | `green-500` → `emerald-600` | Botão finalizar |
| Hover | `cyan-500/20` | Estados hover |

## 🚀 Animações

### Transição entre Etapas
```typescript
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};
```

### Progress Bar
```typescript
<motion.div
  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.5, ease: 'easeInOut' }}
/>
```

## 🔧 Manutenção

### Adicionar Nova Etapa
```typescript
const newStep: FormStep = {
  id: 'nova-etapa',
  title: 'Título da Etapa',
  description: 'Descrição',
  icon: IconeDoLucide,
  fields: [
    {
      name: 'nomeCampo',
      label: 'Label do Campo',
      type: 'text', // ou 'select', 'textarea'
      required: true,
      placeholder: 'Placeholder',
    },
  ],
};
```

### Customizar Validação
Edite `useContractWizard.ts`:
```typescript
const isStepValid = useCallback(() => {
  const step = steps[currentStep];
  // Adicione lógica customizada aqui
  return validationLogic;
}, [currentStep, steps, formData]);
```

## 📊 Performance

- ✅ Memoização de componentes com `React.memo()`
- ✅ Callbacks otimizados com `useCallback()`
- ✅ Validação performática
- ✅ Animações GPU-accelerated (Framer Motion)
- ✅ Lazy loading de campos

## 🐛 Troubleshooting

### Modal não abre
- Verifique se `open={true}` está sendo passado
- Confirme que as dependências do Framer Motion estão instaladas

### Dados não persistem
- Verifique se `initialData` está sendo passado corretamente
- Confirme que o hook está preservando `formData`

### Validação não funciona
- Verifique se `required: true` está nos campos
- Confirme que `isStepValid` está calculando corretamente

## 🎓 Referências

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Tailwind CSS](https://tailwindcss.com/)
- Memória: Design inspirado em telas de login enterprise e jogos de luta

## 📝 Changelog

### v1.0.0 (2025-10-05)
- ✨ Criação inicial do modal tecnológico
- 🎨 Design futurista com gradientes cyan/blue
- ⚡ Navegação por setas com animações
- ✅ Validação em tempo real
- 💾 Preservação de dados entre etapas
- 📱 Responsivo para mobile
- 🔧 Hook `useContractWizard` para gestão de estado
