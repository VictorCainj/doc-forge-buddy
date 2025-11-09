import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState, EmptyStatePresets } from './empty-state';
import { Button } from './button';
import { useState } from 'react';
import { 
  FileX, 
  Inbox, 
  Search, 
  UserX, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Plus,
  RefreshCw
} from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
O componente EmptyState é usado para representar estados vazios em uma aplicação de forma clara e amigável.

## Características

- **Modular**: Título, descrição, ícone, ações customizáveis
- **Variantes de ícone**: default, warning, error, success, info
- **Tamanhos**: sm, md, lg para diferentes contextos
- **Ações**: Botão principal e ação secundária
- **Presets**: Estados pré-definidos para casos comuns
- **Acessível**: Suporte a screen readers e keyboard navigation

## Presets Disponíveis

- **noData**: Para listas vazias
- **noResults**: Para resultados de busca
- **noUsers**: Para sistema sem usuários
- **noFiles**: Para diretórios vazios
- **error**: Para erros de carregamento
- **success**: Para operações concluídas

## Uso

### Uso Básico
\`\`\`tsx
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  title="Nenhum dado encontrado"
  description="Não há dados para exibir no momento."
  icon={Inbox}
  action={{
    label: "Adicionar Item",
    onClick: () => {}
  }}
/>
\`\`\`

### Usando Presets
\`\`\`tsx
import { EmptyState, EmptyStatePresets } from '@/components/ui/empty-state';

<EmptyState
  {...EmptyStatePresets.noData()}
  action={{
    label: "Criar Primeiro Item",
    onClick: () => {}
  }}
/>
\`\`\`

### Diferentes Tamanhos
- **sm**: Para espaços compactos
- **md**: Tamanho padrão (recomendado)
- **lg**: Para páginas ou seções principais
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Título principal do estado vazio',
    },
    description: {
      control: 'text',
      description: 'Descrição do estado vazio',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do componente',
    },
    iconVariant: {
      control: 'select',
      options: ['default', 'warning', 'error', 'success', 'info'],
      description: 'Variante do ícone',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive component for demos
const EmptyStateDemo = ({ 
  title, 
  description, 
  icon, 
  iconVariant,
  action,
  secondaryAction,
  size = 'md'
}: any) => {
  const [clicked, setClicked] = useState(false);
  
  return (
    <div className="space-y-4">
      <EmptyState
        title={title}
        description={description}
        icon={icon}
        iconVariant={iconVariant}
        size={size}
        action={action ? {
          ...action,
          onClick: () => {
            action.onClick();
            setClicked(true);
            setTimeout(() => setClicked(false), 2000);
          }
        } : undefined}
        secondaryAction={secondaryAction}
      />
      {clicked && (
        <p className="text-sm text-green-600 text-center">
          Ação executada com sucesso!
        </p>
      )}
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <EmptyState
      title="Nenhum item encontrado"
      description="Esta lista está vazia. Que tal adicionar um novo item?"
      icon={Inbox}
      action={{
        label: "Adicionar Item",
        onClick: () => alert('Adicionar item!')
      }}
    />
  ),
};

export const WithSecondaryAction: Story = {
  render: () => (
    <EmptyState
      title="Nenhum resultado encontrado"
      description="Tente ajustar os filtros ou termos de busca para encontrar o que procura."
      icon={Search}
      iconVariant="info"
      action={{
        label: "Nova Busca",
        onClick: () => alert('Nova busca!')
      }}
      secondaryAction={{
        label: "Limpar Filtros",
        onClick: () => alert('Filtros limpos!')
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'EmptyState com ação principal e secundária.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 max-w-md">
      <EmptyState
        title="Tamanho Small"
        description="Componente compacto para espaços pequenos"
        size="sm"
        icon={Inbox}
        action={{
          label: "Adicionar",
          onClick: () => alert('Small!')
        }}
      />
      
      <EmptyState
        title="Tamanho Medium"
        description="Tamanho padrão recomendado para a maioria dos casos"
        size="md"
        icon={Inbox}
        action={{
          label: "Adicionar",
          onClick: () => alert('Medium!')
        }}
      />
      
      <EmptyState
        title="Tamanho Large"
        description="Para páginas principais ou seções importantes"
        size="lg"
        icon={Inbox}
        action={{
          label: "Adicionar",
          onClick: () => alert('Large!')
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração dos diferentes tamanhos disponíveis.',
      },
    },
  },
};

export const NoActions: Story = {
  render: () => (
    <EmptyState
      title="Lista vazia"
      description="Não há itens para exibir nesta lista."
      icon={Inbox}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'EmptyState sem ações (apenas título, descrição e ícone).',
      },
    },
  },
};

export const IconVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <EmptyState
        title="Default"
        description="Ícone padrão para estados neutros"
        iconVariant="default"
        icon={FileX}
      />
      <EmptyState
        title="Info"
        description="Para informações e dicas"
        iconVariant="info"
        icon={Info}
      />
      <EmptyState
        title="Warning"
        description="Para avisos e precauções"
        iconVariant="warning"
        icon={AlertCircle}
      />
      <EmptyState
        title="Error"
        description="Para erros e falhas"
        iconVariant="error"
        icon={AlertCircle}
      />
      <EmptyState
        title="Success"
        description="Para operações bem-sucedidas"
        iconVariant="success"
        icon={CheckCircle}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes variantes de ícone para diferentes contextos.',
      },
    },
  },
};

export const PresetNoData: Story = {
  render: () => (
    <EmptyState
      {...EmptyStatePresets.noData({
        action: {
          label: "Criar Primeiro Item",
          onClick: () => alert('Criando item!')
        }
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preset para estados de "nenhum dado".',
      },
    },
  },
};

export const PresetNoResults: Story = {
  render: () => (
    <EmptyState
      {...EmptyStatePresets.noResults({
        action: {
          label: "Nova Busca",
          onClick: () => alert('Nova busca!')
        },
        secondaryAction: {
          label: "Limpar Filtros",
          onClick: () => alert('Filtros limpos!')
        }
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preset para resultados de busca vazios.',
      },
    },
  },
};

export const PresetNoUsers: Story = {
  render: () => (
    <EmptyState
      {...EmptyStatePresets.noUsers({
        action: {
          label: "Adicionar Usuário",
          onClick: () => alert('Adicionando usuário!')
        }
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preset para sistema sem usuários.',
      },
    },
  },
};

export const PresetError: Story = {
  render: () => (
    <EmptyState
      {...EmptyStatePresets.error({
        action: {
          label: "Tentar Novamente",
          onClick: () => alert('Tentando novamente!')
        },
        secondaryAction: {
          label: "Contactar Suporte",
          onClick: () => alert('Abrindo suporte!')
        }
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preset para estados de erro.',
      },
    },
  },
};

export const PresetSuccess: Story = {
  render: () => (
    <EmptyState
      {...EmptyStatePresets.success({
        action: {
          label: "Continuar",
          onClick: () => alert('Continuando!')
        }
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preset para operações bem-sucedidas.',
      },
    },
  },
};

export const CustomContent: Story = {
  render: () => (
    <EmptyState
      title="Configuração Necessária"
      description="Complete a configuração para começar a usar o sistema"
      icon={Settings}
      iconVariant="info"
      action={{
        label: "Configurar Agora",
        onClick: () => alert('Configurando!')
      }}
    >
      <div className="bg-muted p-4 rounded-lg mt-4">
        <h4 className="font-medium mb-2">Passos para configurar:</h4>
        <ol className="text-sm text-muted-foreground space-y-1">
          <li>1. Configure suas preferências</li>
          <li>2. Adicione sua primeira categoria</li>
          <li>3. Importe seus dados existentes</li>
        </ol>
      </div>
    </EmptyState>
  ),
  parameters: {
    docs: {
      description: {
        story: 'EmptyState com conteúdo customizado adicional.',
      },
    },
  },
};

export const Card: Story = {
  render: () => (
    <div className="max-w-md border rounded-lg p-6">
      <EmptyState
        title="Nenhuma transação"
        description="Você ainda não tem transações registradas."
        icon={FileX}
        action={{
          label: "Adicionar Transação",
          onClick: () => alert('Adicionando transação!')
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'EmptyState dentro de um card/container.',
      },
    },
  },
};

export const PageLevel: Story = {
  render: () => (
    <div className="min-h-96 flex items-center justify-center">
      <EmptyState
        title="Página em Construção"
        description="Esta seção está sendo desenvolvida. Em breve estará disponível."
        icon={AlertCircle}
        iconVariant="warning"
        size="lg"
        action={{
          label: "Voltar ao Início",
          onClick: () => alert('Voltando ao início!')
        }}
        secondaryAction={{
          label: "Notificar-me",
          onClick: () => alert('Notificação agendada!')
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'EmptyState para nível de página completa.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => <EmptyStateDemo />,
  args: {
    title: "Demonstração Interativa",
    description: "Clique nas ações para ver a interação funcionando",
    icon: Plus,
    action: {
      label: "Executar Ação",
      onClick: () => console.log('Ação executada!')
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'EmptyState interativo para demonstrar funcionalidades.',
      },
    },
  },
};

export const AllPresets: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Presets Disponíveis</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4">
          <EmptyState
            {...EmptyStatePresets.noData()}
          />
        </div>
        
        <div className="border rounded-lg p-4">
          <EmptyState
            {...EmptyStatePresets.noResults()}
          />
        </div>
        
        <div className="border rounded-lg p-4">
          <EmptyState
            {...EmptyStatePresets.noUsers()}
          />
        </div>
        
        <div className="border rounded-lg p-4">
          <EmptyState
            {...EmptyStatePresets.noFiles()}
          />
        </div>
        
        <div className="border rounded-lg p-4">
          <EmptyState
            {...EmptyStatePresets.error({
              action: {
                label: "Tentar Novamente",
                onClick: () => alert('Tentando!')
              }
            })}
          />
        </div>
        
        <div className="border rounded-lg p-4">
          <EmptyState
            {...EmptyStatePresets.success({
              action: {
                label: "Continuar",
                onClick: () => alert('Continuando!')
              }
            })}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração de todos os presets disponíveis.',
      },
    },
  },
};