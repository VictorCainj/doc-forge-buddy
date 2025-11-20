# Component Library & Storybook

Esta documentação apresenta a **Component Library** completa com **Storybook** para documentação visual dos componentes.

## 📚 Estrutura da Biblioteca

### Componentes Disponíveis

#### UI Core Components
- **Button** (`/src/components/ui/button.tsx`) - Botão principal com múltiplas variantes
- **Input** (`/src/components/ui/input.tsx`) - Campo de entrada de dados
- **Card** (`/src/components/ui/card.tsx`) - Container de conteúdo
- **Table** (`/src/components/ui/table.tsx`) - Tabela responsiva
- **Modal/Dialog** (`/src/components/ui/dialog.tsx`) - Modal/Overlay
- **Loading** (`/src/components/ui/loading-state.tsx`) - Estados de carregamento
- **EmptyState** (`/src/components/ui/empty-state.tsx`) - Estados vazios

#### Componentes Auxiliares
- **LoadingButton** - Botão com estado de loading
- **LoadingOverlay** - Overlay de loading para tela cheia
- **Badge** - Componente de etiqueta/flag
- **Alert** - Componente de alerta
- **Form** - Componentes de formulário

### 📖 Stories Disponíveis

#### UI Components Stories
Located in `/src/components/ui-stories/`:

1. **Button Stories** (`button.stories.tsx`)
   - Todas as variantes (default, primary, destructive, outline, etc.)
   - Diferentes tamanhos (xs, sm, md, lg, xl, icon)
   - Estados: loading, disabled, com ícones
   - Exemplo responsivo

2. **Input Stories** (`input.stories.tsx`)
   - Estados: default, focused, error, disabled
   - Diferentes tamanhos e variações
   - Com validação e feedback

3. **Card Stories** (`card.stories.tsx`)
   - Layout básico e avançado
   - Headers, footers, actions
   - Different content types

4. **Table Stories** (`table.stories.tsx`)
   - Tabela básica e avançada
   - Com ações e sortable
   - States: loading, empty, paginated
   - Responsive design

5. **Modal Stories** (`modal.stories.tsx`)
   - Formulários em modal
   - Confirmações e alerts
   - Success/Error states
   - Diferentes tamanhos

6. **Loading Stories** (`loading.stories.tsx`)
   - Skeleton, spinner, overlay
   - LoadingButton examples
   - Form submission states
   - Data loading patterns

7. **EmptyState Stories** (`empty-state.stories.tsx`)
   - Presets: noData, noResults, noUsers, error, success
   - Com e sem ações
   - Diferentes tamanhos
   - Conteúdo customizado

### 🎨 Design System

#### Design Tokens

O sistema utiliza **CSS custom properties** e **Tailwind classes** com os seguintes tokens:

#### Cores
```css
/* Primary Colors */
--color-primary-50: #eff6ff
--color-primary-100: #dbeafe
--color-primary-500: #3b82f6
--color-primary-600: #2563eb
--color-primary-700: #1d4ed8

/* Neutral Colors */
--color-neutral-50: #fafafa
--color-neutral-500: #737373
--color-neutral-900: #171717

/* Semantic Colors */
--color-success-500: #22c55e
--color-warning-500: #f59e0b
--color-error-500: #ef4444
--color-info-500: #3b82f6
```

#### Espaçamentos
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
```

#### Tipografia
```css
/* Font Families */
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif']
  mono: ['JetBrains Mono', 'monospace']
}

/* Font Sizes */
fontSize: {
  xs: '0.75rem'    // 12px
  sm: '0.875rem'   // 14px
  base: '1rem'     // 16px
  lg: '1.125rem'   // 18px
  xl: '1.25rem'    // 20px
  '2xl': '1.5rem'  // 24px
}
```

#### Border Radius
```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 24px
--radius-full: 9999px
```

#### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

## 🚀 Como Usar

### 1. Instalação e Setup

```bash
# Instalar dependências
npm install

# Iniciar Storybook
npm run storybook

# Build para produção
npm run build:storybook
```

### 2. Desenvolvimento de Componentes

#### Estrutura de Arquivo
```typescript
// my-component.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const myComponentStyles = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'default-classes',
        secondary: 'secondary-classes',
      },
      size: {
        sm: 'small-classes',
        md: 'medium-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentStyles> {
  // Props específicas
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(myComponentStyles({ variant, size }), className)}
        {...props}
      />
    );
  }
);
```

### 3. Criando Stories

#### Estrutura Básica
```typescript
// my-component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './my-component';

const meta: Meta<typeof MyComponent> = {
  title: 'UI/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Descrição do componente com exemplos de uso e características.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary'],
      description: 'Define a variante visual',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'My Component',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Component',
  },
};
```

### 4. Importação de Componentes

```typescript
// Importar componentes individuais
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// Importar estados de loading
import { LoadingState } from '@/components/ui/loading-state';
import { LoadingButton } from '@/components/ui/loading-button';

// Importar empty state
import { EmptyState } from '@/components/ui/empty-state';
```

## 🔧 Scripts Disponíveis

### Storybook Commands
```bash
# Desenvolvimento
npm run storybook              # Inicia Storybook em modo desenvolvimento
npm run storybook:build        # Build para produção
npm run storybook:serve        # Build e servir localmente
npm run storybook:docs         # Build com documentação

# Análise e Testes
npm run storybook:test         # Executa testes dos stories
npm run storybook:lint         # Lint dos arquivos de stories
npm run storybook:check        # Validação completa
npm run storybook:analyze      # Build e análise de bundle
```

### Deploy
```bash
# Deploy automático configurado
npm run deploy:storybook       # Build + deploy automático
```

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/                    # Componentes base
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── loading-state.tsx
│   │   ├── empty-state.tsx
│   │   └── index.ts           # Barrel exports
│   ├── ui-stories/           # Stories organizados
│   │   ├── button.stories.tsx
│   │   ├── input.stories.tsx
│   │   ├── card.stories.tsx
│   │   ├── table.stories.tsx
│   │   ├── modal.stories.tsx
│   │   ├── loading.stories.tsx
│   │   └── empty-state.stories.tsx
│   └── index.ts              # Exports principais
├── stories/                  # Stories globais
│   ├── Introduction.stories.tsx
│   └── DesignTokens.stories.tsx
└── index.css                 # Estilos globais e tokens
```

## 🎯 Boas Práticas

### 1. Component Design
- ✅ Sempre usar `React.forwardRef`
- ✅ Implementar `VariantProps` com `class-variance-authority`
- ✅ Incluir documentação JSDoc
- ✅ Testar acessibilidade
- ✅ Usar design tokens consistentes

### 2. Story Structure
- ✅ Título claro e hierárquico
- ✅ Documentação completa
- ✅ Múltiplas variações
- ✅ Estados de erro/carregamento
- ✅ Acessibilidade testada

### 3. Design Tokens
- ✅ Usar CSS custom properties
- ✅ Manter consistência
- ✅ Documentar tokens
- ✅ Testar em diferentes temas

## 🔄 Deploy e CI/CD

### Configuração Automática
O projeto está configurado com deploy automático via:

1. **Build**: `npm run build:storybook`
2. **Deploy**: Deploy automático configurado no pipeline
3. **URLs**: Storybook será disponibilizado via URL pública

### Comandos de Produção
```bash
# Build otimizado para CI
npm run storybook:build:ci

# Validação completa
npm run storybook:check
```

## 🎨 Customização

### Adicionando Novos Componentes

1. **Criar componente** em `/src/components/ui/`
2. **Criar story** em `/src/components/ui-stories/`
3. **Exportar** via `/src/components/ui/index.ts`
4. **Documentar** com exemplos completos

### Configuração Avançada

#### Main.ts Customizations
- Aliases automáticos
- Addons configurados
- Otimizações de build
- Tratamento de tipos TypeScript

#### Preview.ts Customizations
- Design tokens globais
- Backgrounds customizadas
- Viewports para teste responsivo
- Decorators para layout

## 📊 Métricas e Análise

O projeto inclui monitoramento completo:
- **Performance**: Bundle analysis automático
- **Testes**: Storybook test runner
- **Acessibilidade**: WCAG compliance via addon-a11y
- **Documentação**: Autodocs generation

## 🤝 Contribuição

### Workflow
1. Desenvolver componente seguindo padrões
2. Criar stories completos
3. Testar acessibilidade
4. Validar design tokens
5. Build e deploy

### Padrões de Código
- **TypeScript**: Strict mode
- **ESLint**: Configuração rigorosa
- **Prettier**: Formatação automática
- **Husky**: Pre-commit hooks

## 📞 Suporte

Para dúvidas sobre implementação:
- Documentação integrada no Storybook
- Exemplos práticos em cada story
- Design tokens documentados
- Testes de acessibilidade

---

**Component Library v1.0.0** - Desenvolvido com ❤️ e seguindo as melhores práticas de desenvolvimento frontend.