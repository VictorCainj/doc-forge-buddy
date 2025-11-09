import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from './loading-state';
import { LoadingButton } from './loading-button';
import { LoadingOverlay } from './loading-overlay';
import { Button } from './button';
import { useState } from 'react';
import { Save, Upload, Download, Settings } from 'lucide-react';

const meta: Meta<typeof LoadingState> = {
  title: 'UI/Loading',
  component: LoadingState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Componentes de Loading para diferentes contextos e estados de carregamento.

## Componentes

### LoadingState
Componente centralizado para estados de carregamento com 3 variantes:
- **skeleton**: Para cards e listas (placeholder do conteúdo)
- **spinner**: Para ações e formulários (feedback simples)
- **overlay**: Para operações bloqueantes (tela cheia)

### LoadingButton
Botão com estado de loading integrado.

### LoadingOverlay
Overlay de tela cheia para operações bloqueantes.

## Uso

### LoadingState
\`\`\`tsx
import { LoadingState } from '@/components/ui/loading-state';

// Para listas
{loading && <LoadingState variant="spinner" message="Carregando..." />}

// Para cards
{loading && <LoadingState variant="skeleton" rows={3} />}

// Para modais
{loading && <LoadingState variant="spinner" message="Processando..." />}
\`\`\`

### LoadingButton
\`\`\`tsx
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton 
  loading={isLoading}
  loadingText="Salvando..."
  onClick={handleSave}
>
  Salvar
</LoadingButton>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive component for LoadingButton demo
const LoadingButtonDemo = () => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  
  return (
    <div className="space-y-4">
      <LoadingButton
        loading={loading}
        onClick={handleClick}
        loadingText="Processando..."
      >
        Executar Ação
      </LoadingButton>
      <p className="text-sm text-muted-foreground">
        Clique no botão para ver o estado de loading
      </p>
    </div>
  );
};

// Interactive component for LoadingOverlay demo  
const LoadingOverlayDemo = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  
  return (
    <div className="space-y-4">
      <Button onClick={() => setShowOverlay(true)}>
        Simular Loading de Tela
      </Button>
      {showOverlay && (
        <div className="relative">
          <LoadingOverlay 
            show={showOverlay}
            message="Carregando dados..."
            onClose={() => setShowOverlay(false)}
          />
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Clique no botão para ver o overlay de loading
      </p>
    </div>
  );
};

export const Spinner: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <LoadingState variant="spinner" />
      <LoadingState variant="spinner" message="Carregando dados..." />
      <LoadingState variant="spinner" message="Processando informações..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Variante spinner para feedback simples de carregamento.',
      },
    },
  },
};

export const Skeleton: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <LoadingState variant="skeleton" />
      <LoadingState variant="skeleton" rows={2} />
      <LoadingState variant="skeleton" rows={4} />
      <LoadingState variant="skeleton" rows={6} message="Carregando conteúdo..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Variante skeleton para placeholders de conteúdo (listas, cards).',
      },
    },
  },
};

export const LoadingButton: Story = {
  render: () => <LoadingButtonDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Botão com estado de loading interativo.',
      },
    },
  },
};

export const LoadingOverlay: Story = {
  render: () => <LoadingOverlayDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Overlay de tela cheia para operações bloqueantes.',
      },
    },
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Small (default)</h3>
        <LoadingState variant="spinner" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Com Mensagem</h3>
        <LoadingState variant="spinner" message="Carregando informações..." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamanhos e configurações do LoadingState.',
      },
    },
  },
};

export const ButtonVariants: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    
    const triggerLoading = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 2000);
    };
    
    return (
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <LoadingButton
          loading={loading}
          onClick={triggerLoading}
          loadingText="Salvando..."
        >
          Salvar
        </LoadingButton>
        
        <LoadingButton
          loading={loading}
          onClick={triggerLoading}
          loadingText="Enviando..."
          variant="outline"
        >
          Enviar
        </LoadingButton>
        
        <LoadingButton
          loading={loading}
          onClick={triggerLoading}
          loadingText="Fazendo upload..."
          icon={Upload}
        >
          Upload
        </LoadingButton>
        
        <LoadingButton
          loading={loading}
          onClick={triggerLoading}
          loadingText="Baixando..."
          icon={Download}
          variant="secondary"
        >
          Download
        </LoadingButton>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'LoadingButton com diferentes variantes e ícones.',
      },
    },
  },
};

export const FormSubmission: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const handleSubmit = async () => {
      setLoading(true);
      setSuccess(false);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    };
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome</label>
          <input 
            className="w-full p-2 border border-input rounded-md bg-background"
            placeholder="Digite seu nome"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input 
            type="email"
            className="w-full p-2 border border-input rounded-md bg-background"
            placeholder="email@exemplo.com"
            disabled={loading}
          />
        </div>
        <LoadingButton
          loading={loading}
          onClick={handleSubmit}
          loadingText="Enviando..."
          icon={Save}
          className="w-full"
        >
          {success ? 'Enviado!' : 'Enviar Formulário'}
        </LoadingButton>
        {success && (
          <p className="text-sm text-green-600 text-center">
            Formulário enviado com sucesso!
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo prático de uso em formulário.',
      },
    },
  },
};

export const DataLoading: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    
    const loadData = async () => {
      setLoading(true);
      setData([]);
      
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setData([
        { id: 1, name: 'Item 1', status: 'Ativo' },
        { id: 2, name: 'Item 2', status: 'Pendente' },
        { id: 3, name: 'Item 3', status: 'Ativo' },
      ]);
      
      setLoading(false);
    };
    
    return (
      <div className="space-y-4">
        <Button onClick={loadData} disabled={loading}>
          <Settings className="h-4 w-4 mr-2" />
          Carregar Dados
        </Button>
        
        {loading ? (
          <LoadingState variant="skeleton" rows={3} />
        ) : data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.id} className="p-3 border rounded-md">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Clique em "Carregar Dados" para simular o carregamento
          </p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemplo de carregamento de dados com skeleton.',
      },
    },
  },
};

export const PageLoading: Story = {
  render: () => {
    const [showPageLoading, setShowPageLoading] = useState(false);
    
    return (
      <div className="space-y-4">
        <Button onClick={() => setShowPageLoading(true)}>
          Simular Loading de Página
        </Button>
        
        {showPageLoading && (
          <div className="fixed inset-0 z-50">
            <LoadingOverlay 
              show={true}
              message="Carregando página..."
              onClose={() => setShowPageLoading(false)}
            />
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          Clique no botão para simular o carregamento de uma página inteira
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading overlay para carregamento de página inteira.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Skeleton</h3>
        <LoadingState variant="skeleton" rows={4} />
        <p className="text-sm text-muted-foreground mt-2">
          Para listas e cards
        </p>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Spinner</h3>
        <LoadingState variant="spinner" message="Carregando..." />
        <p className="text-sm text-muted-foreground mt-2">
          Para feedback simples
        </p>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Overlay</h3>
        <LoadingState variant="overlay" message="Processando..." />
        <p className="text-sm text-muted-foreground mt-2">
          Para operações bloqueantes
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparação de todas as variantes de loading disponíveis.',
      },
    },
  },
};