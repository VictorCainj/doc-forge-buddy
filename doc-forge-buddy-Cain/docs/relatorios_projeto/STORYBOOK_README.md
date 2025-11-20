# Component Library & Storybook

Component library completa com documentação visual usando Storybook para o projeto Doc Forge Buddy.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Design System](#design-system)
- [Componentes](#componentes)
- [Storybook](#storybook)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Como Contribuir](#como-contribuir)
- [Deploy e CI/CD](#deploy-e-cicd)

## 🎯 Visão Geral

Esta component library fornece:

- **Componentes Reutilizáveis**: UI components baseados no Material Design 3
- **Documentação Visual**: Storybook integrado para demonstrar uso
- **Design System Consistente**: Tokens, cores, tipografia padronizados
- **Acessibilidade**: WCAG 2.1 AA compliant
- **Performance Otimizada**: Componentes lazy-loaded e otimizados
- **TypeScript**: Tipagem completa e seguras

## 📁 Estrutura do Projeto

```
src/
├── components/           # Component library
│   ├── ui/              # Base UI components (Button, Input, Card, etc.)
│   ├── form/            # Form components
│   ├── layout/          # Layout components
│   ├── modals/          # Modal components
│   └── common/          # Shared components
├── stories/             # Storybook stories
│   ├── Introduction.stories.tsx
│   └── DesignTokens.stories.tsx
├── lib/                 # Utilities
├── hooks/               # Custom hooks
├── types/               # TypeScript types
└── theme/               # Theme configuration
.storybook/              # Storybook configuration
├── main.ts              # Main config
├── preview.ts           # Global settings
├── manager.ts           # UI customization
├── types.ts             # TypeScript types
└── styles/              # Global styles
    └── globals.css
```

## 🎨 Design System

### Cores
Baseadas no Google Material Design 3:
- **Primary**: Blue 500 (#3b82f6)
- **Secondary**: Purple 500 (#8b5cf6)
- **Success**: Green 500 (#10b981)
- **Warning**: Amber 500 (#f59e0b)
- **Error**: Red 500 (#ef4444)

### Tipografia
- **Interface**: Inter (300, 400, 500, 600, 700)
- **Código**: Fira Code (400, 500, 600)

### Espaçamento
Sistema baseado em múltiplos de 4px:
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px

### Bordas
- Small: 4px, Medium: 8px, Large: 12px, Full: 9999px

## 🧩 Componentes

### UI Components (Base)
- **Button**: Componente de botão com múltiplas variantes
- **Input**: Campo de entrada com diferentes tipos
- **Card**: Container flexível com header/content/footer
- **Badge**: Indicador de status/tag
- **Avatar**: Imagem de perfil/círculo
- **Modal**: Sobreposições de tela
- **Dropdown**: Menu dropdown
- **Select**: Seleção de opções
- **Checkbox**: Checkbox estilizado
- **Radio**: Radio buttons
- **Switch**: Toggle switch
- **Tabs**: Navegação por abas
- **Progress**: Barra de progresso
- **Table**: Tabela responsiva

### Form Components
- **FormField**: Wrapper para campos de formulário
- **FormWizard**: Assistente de formulários multi-step
- **Input**: Componente de entrada
- **Select**: Seleção de opções

### Layout Components
- **Layout**: Layout principal
- **Sidebar**: Barra lateral
- **Grid**: Sistema de grid
- **Container**: Container responsivo

### Specialized Components
- **LoadingButton**: Botão com estado de loading
- **LoadingOverlay**: Overlay de carregamento
- **AccessibleComponents**: Componentes com acessibilidade avançada
- **OptimizedSearch**: Busca otimizada
- **DynamicVirtualizedList**: Lista virtualizada

## 📖 Storybook

### Setup Completo
O Storybook está configurado com:

- **Vite** como bundler para desenvolvimento rápido
- **TypeScript** para type safety
- **MSW** para mocking de APIs
- **Addons Essenciais**:
  - Docs: Documentação automática
  - Controls: Interface interativa
  - Actions: Teste de event handlers
  - A11y: Verificação de acessibilidade
  - Interactions: Testes de interação
  - Links: Navegação entre stories
  - MDX: Documentação em MDX

### Como Executar

```bash
# Development
npm run storybook

# Build
npm run storybook:build

# Test
npm run storybook:test
```

### Estrutura dos Stories

```tsx
// Component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
  title: 'UI/Component', // Hierarquia de navegação
  component: Component,
  parameters: {
    layout: 'centered', // Posicionamento
    docs: {
      description: {
        component: `Documentação do componente...`
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    // Definição de controles
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const Default: Story = {
  args: {
    // Props padrão
  }
};

export const Variant: Story = {
  args: {
    // Props específicas da variante
  }
};
```

### Tipos de Stories

1. **Default**: Exemplo básico
2. **Variants**: Múltiplas variantes do componente
3. **States**: Diferentes estados (loading, disabled, error)
4. **WithComposition**: Componentes compostos
5. **Responsive**: Comportamento responsivo
6. **Interactive**: Testes de interação

## 🚀 Scripts Disponíveis

```bash
# Storybook
npm run storybook          # Servidor de desenvolvimento
npm run storybook:build    # Build da documentação
npm run storybook:serve    # Servir build estático
npm run storybook:test     # Testes dos componentes

# Development
npm run dev                # Servidor de desenvolvimento
npm run build             # Build de produção
npm run test              # Testes unitários
npm run lint              # Lint do código
npm run type-check        # Verificação de tipos

# Quality Gates
npm run quality-gates     # Validação completa
npm run coverage:threshold # Verificar cobertura
```

## 🤝 Como Contribuir

### Adicionando um Novo Componente

1. **Criar o Componente**:
   ```tsx
   // src/components/ui/Component.tsx
   import React from 'react';
   import { cn } from '@/lib/utils';

   export interface ComponentProps {
     // Props definition
   }

   export const Component = React.forwardRef<HTMLElement, ComponentProps>(
     ({ className, ...props }, ref) => (
       <div className={cn('base-classes', className)} ref={ref} {...props}>
         {/* Implementation */}
       </div>
     )
   );
   ```

2. **Criar o Story**:
   ```tsx
   // src/components/ui/Component.stories.tsx
   // Ver estrutura completa acima
   ```

3. **Exportar**:
   ```tsx
   // src/components/ui/index.ts
   export * from './Component';
   ```

4. **Adicionar ao Preview**:
   ```tsx
   // .storybook/preview.ts
   // Adicionar exemplo de uso global se necessário
   ```

### Padrões de Desenvolvimento

1. **TypeScript**: Sempre usar tipagem explícita
2. **ForwardRef**: Componentes devem usar React.forwardRef
3. **Accessibility**: Incluir ARIA attributes e keyboard navigation
4. **Performance**: Usar React.memo quando apropriado
5. **Testing**: Incluir testes unitários
6. **Documentation**: Documentação completa nos stories

### Checklist de Qualidade

- [ ] Componente implementa forwardRef
- [ ] Props tipadas corretamente
- [ ] Estados gerenciados adequadamente
- [ ] Acessibilidade implementada
- [ ] Story criado com múltiplas variações
- [ ] Documentação completa
- [ ] Testes unitários passarem
- [ ] Lint sem erros
- [ ] Type check sem warnings

## 🌐 Deploy e CI/CD

### Build do Storybook

```bash
# Build local
npm run build:storybook

# Deploy estático
npm run deploy:storybook
```

### GitHub Actions

```yaml
# .github/workflows/storybook.yml
name: Storybook CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  storybook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build:storybook
      - run: npm run storybook:test
```

### Chromatic

Integrar com Chromatic para visual testing:
```bash
npm install --save-dev chromatic
npx chromatic --project-token=YOUR_TOKEN
```

## 📚 Recursos Adicionais

- [Material Design 3](https://m3.material.io/)
- [Storybook Docs](https://storybook.js.org/docs/react/get-started/introduction)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)

## 🎯 Roadmap

- [ ] Adicionar mais componentes (DataTable, DataGrid)
- [ ] Implementar theming dark/light
- [ ] Adicionar testes visuais
- [ ] Configurar Chromatic
- [ ] Criar templates de página
- [ ] Adicionar internacionalização
- [ ] Performance monitoring
- [ ] Bundle analysis

---

**Nota**: Esta component library é uma ferramenta viva e está em constante evolução. Contribuições são sempre bem-vindas!