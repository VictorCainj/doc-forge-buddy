import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Loader2, Search, Download, Heart } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
O componente Button é um botão reutilizável seguindo as diretrizes do Material Design e Google Design System.

## Características

- **Variantes**: multiple estilos predefinidos (default, primary, destructive, outline, secondary, ghost, link, subtle, success)
- **Tamanhos**: múltiplos tamanhos (xs, sm, default, lg, xl, icon)
- **Estados**: hover, focus, disabled, loading
- **Acessibilidade**: support completo para screen readers
- **Performance**: otimizado com React.memo e forwardRef

## Uso

\`\`\`tsx
import { Button } from '@/components/ui/button';

function Example() {
  return (
    <Button variant="primary" size="lg">
      Clique aqui
    </Button>
  );
}
\`\`\`

## Design Tokens

- **Cores**: baseadas no Google Design System
- **Espaçamento**: 4px, 8px, 12px, 16px, 24px, 32px
- **Bordas**: 8px, 10px, 12px, 16px
- **Transições**: 75ms ease-out para microinterações
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'primary',
        'destructive', 
        'outline',
        'secondary',
        'ghost',
        'link',
        'subtle',
        'success'
      ],
      description: 'Define o estilo visual do botão',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Define o tamanho do botão',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o botão e previne interações',
    },
    onClick: {
      action: 'clicked',
      description: 'Função chamada quando o botão é clicado',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    children: 'Subtle Button',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração dos diferentes tamanhos de botões disponíveis.',
      },
    },
  },
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button>
        <Search className="h-4 w-4" />
        Search
      </Button>
      <Button variant="outline">
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button variant="success">
        <Heart className="h-4 w-4" />
        Like
      </Button>
      <Button size="icon">
        <Search className="h-4 w-4" />
      </Button>
      <Button size="icon-sm" variant="outline">
        <Heart className="h-3 w-3" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Botões com ícones para melhor UX e reconhecimento visual.',
      },
    },
  },
};

// Loading State
export const Loading: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button loading>
        Carregando...
      </Button>
      <Button variant="outline" loading loadingText="Processando">
        Processando
      </Button>
      <Button variant="success" loading>
        <Loader2 className="h-4 w-4" />
        Salvando
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Estados de loading com spinner e texto personalizado.',
      },
    },
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado desabilitado impede interações e não chama event handlers.',
      },
    },
  },
};

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-2xl">
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="subtle">Subtle</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas as variantes disponíveis em um grid para comparação visual.',
      },
    },
  },
};

// Responsive
export const Responsive: Story = {
  render: () => (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Button className="w-full sm:w-auto">Responsive Button</Button>
      <Button variant="outline" className="w-full sm:w-auto">Mobile First</Button>
      <Button variant="secondary" className="w-full sm:w-auto">Touch Friendly</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comportamento responsivo com diferentes breakpoints.',
      },
    },
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};