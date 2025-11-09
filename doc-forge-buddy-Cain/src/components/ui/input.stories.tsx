import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Search, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
O componente Input é um campo de entrada reutilizável seguindo as diretrizes do Material Design 3.

## Características

- **Tipos**: text, email, password, search, file, number, tel, url, etc.
- **Estados**: normal, focus, hover, disabled, error
- **Acessibilidade**: support completo para screen readers e ARIA
- **Estilização**: consistente com design system
- **Performance**: otimizado com React.memo e forwardRef

## Uso

\`\`\`tsx
import { Input } from '@/components/ui/input';

function Example() {
  return (
    <div>
      <Input 
        type="email" 
        placeholder="Digite seu email"
        className="w-full max-w-sm"
      />
    </div>
  );
}
\`\`\`

## Estados

- **Focus**: ring azul com opacidade para indicação visual
- **Hover**: borda escurecida sutilmente
- **Disabled**: fundo cinza claro, cursor not-allowed
- **Error**: pode ser estilizado via className customizada
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'text',
        'email',
        'password',
        'search',
        'tel',
        'url',
        'number',
        'date',
        'time',
        'file',
        'color',
        'range'
      ],
      description: 'Tipo do input HTML',
    },
    placeholder: {
      control: 'text',
      description: 'Texto placeholder que aparece quando o campo está vazio',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o input e previne interações',
    },
    required: {
      control: 'boolean',
      description: 'Marca o campo como obrigatório',
    },
    value: {
      control: 'text',
      description: 'Valor controlado do input',
    },
    defaultValue: {
      control: 'text',
      description: 'Valor inicial não controlado do input',
    },
    onChange: {
      action: 'changed',
      description: 'Função chamada quando o valor do input muda',
    },
    onFocus: {
      action: 'focused',
      description: 'Função chamada quando o input recebe foco',
    },
    onBlur: {
      action: 'blurred',
      description: 'Função chamada quando o input perde foco',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Template component com estado para examples
const InputWithState = ({ type = 'text', ...props }: any) => {
  const [value, setValue] = useState(props.defaultValue || '');
  
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  );
};

export const Default: Story = {
  args: {
    placeholder: 'Digite aqui...',
  },
  render: (args) => <InputWithState {...args} />,
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'seu@email.com',
    required: true,
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Input otimizado para emails com validação HTML5.',
      },
    },
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Digite sua senha',
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Input para senhas com ocultação de texto.',
      },
    },
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Buscar...',
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Input otimizado para pesquisas com UI patterns adequados.',
      },
    },
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Input numérico com controles incrementais nativos.',
      },
    },
  },
};

export const File: Story = {
  args: {
    type: 'file',
    accept: 'image/*',
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Input para seleção de arquivos com preview nativo.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-full max-w-sm">
      <label htmlFor="email" className="text-sm font-medium text-gray-700">
        Email
      </label>
      <InputWithState 
        id="email"
        type="email" 
        placeholder="seu@email.com" 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input com label associado para melhor acessibilidade.',
      },
    },
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <InputWithState 
          className="pl-10" 
          placeholder="Buscar..." 
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <InputWithState 
          type="email"
          className="pl-10" 
          placeholder="seu@email.com" 
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <InputWithState 
          type="password"
          className="pl-10" 
          placeholder="Senha" 
        />
      </div>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <InputWithState 
          className="pl-10" 
          placeholder="Nome de usuário" 
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs com ícones posicionados à esquerda para melhor UX.',
      },
    },
  },
};

export const WithTogglePassword: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="relative w-full max-w-sm">
        <InputWithState 
          type={showPassword ? 'text' : 'password'}
          placeholder="Digite sua senha" 
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Input de senha com toggle para mostrar/ocultar a senha.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Campo desabilitado',
    defaultValue: 'Valor desabilitado',
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Estado desabilitado impede interações e mostra feedback visual.',
      },
    },
  },
};

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Campo obrigatório',
  },
  render: (args) => <InputWithState {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Campo marcado como obrigatório com indicator visual.',
      },
    },
  },
};

export const Error: Story = {
  render: () => (
    <div className="space-y-2 w-full max-w-sm">
      <label htmlFor="email" className="text-sm font-medium text-gray-700">
        Email *
      </label>
      <InputWithState 
        id="email"
        type="email" 
        placeholder="seu@email.com"
        className="border-red-300 focus:ring-red-500/30 focus:border-red-500"
      />
      <p className="text-sm text-red-600">
        Por favor, insira um email válido
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Estado de erro com estilização de bordas e feedback textual.',
      },
    },
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 w-full max-w-md">
      <div>
        <label className="text-sm font-medium mb-2 block">Text</label>
        <InputWithState type="text" placeholder="Texto" />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Email</label>
        <InputWithState type="email" placeholder="email@exemplo.com" />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Password</label>
        <InputWithState type="password" placeholder="Senha" />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <InputWithState type="search" placeholder="Buscar..." />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Number</label>
        <InputWithState type="number" placeholder="0" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração de todos os tipos de input disponíveis.',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div>
        <label className="text-sm font-medium mb-2 block">Mobile (100%)</label>
        <InputWithState 
          placeholder="Full width no mobile"
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Desktop (300px)</label>
        <InputWithState 
          placeholder="Fixed width no desktop"
          className="w-full max-w-[300px]"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comportamento responsivo com diferentes estratégias de largura.',
      },
    },
  },
};