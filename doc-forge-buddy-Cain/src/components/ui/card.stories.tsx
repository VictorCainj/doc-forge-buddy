import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  Star,
  ArrowRight,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
O componente Card é um container flexível e extensível seguindo as diretrizes do Material Design 3.

## Características

- **Estrutura**: Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription
- **Estilização**: bordas sutis, sombras hover, design limpo
- **Acessibilidade**: semântica correta, ARIA attributes
- **Flexibilidade**: pode conter qualquer conteúdo
- **Performance**: otimizado com React.memo e forwardRef

## Uso

\`\`\`tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título do Card</CardTitle>
        <CardDescription>Descrição opcional</CardDescription>
      </CardHeader>
      <CardContent>
        Conteúdo do card aqui
      </CardContent>
    </Card>
  );
}
\`\`\`

## Estrutura

- **Card**: Container principal
- **CardHeader**: Área superior com título e descrição
- **CardTitle**: Título do card
- **CardDescription**: Descrição opcional
- **CardContent**: Conteúdo principal
- **CardFooter**: Área inferior com ações
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Classes CSS adicionais para customização',
    },
    onClick: {
      action: 'clicked',
      description: 'Função chamada quando o card é clicado',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Card Default</CardTitle>
        <CardDescription>
          Um card simples com estrutura básica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Este é o conteúdo do card. Você pode colocar qualquer informação aqui.
        </p>
      </CardContent>
    </Card>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle>João Silva</CardTitle>
            <CardDescription>Desenvolvedor Frontend</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            joao@exemplo.com
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            São Paulo, Brasil
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Ver Perfil Completo
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card representando um perfil de usuário com informações de contato.',
      },
    },
  },
};

export const Notification: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Notificação</CardTitle>
            <CardDescription>Há 2 minutos atrás</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">
          Você tem uma nova mensagem de Maria sobre o projeto de documentação.
        </p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card de notificação com timestamp e ícone.',
      },
    },
  },
};

export const StatusCard: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sistema Ativo</h3>
            <p className="text-sm text-gray-600">Todos os serviços funcionando normalmente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card simples para mostrar status do sistema.',
      },
    },
  },
};

export const TaskCard: Story = {
  render: () => (
    <Card className="w-full max-w-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">Implementar Storybook</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Em Progresso
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-gray-600 mb-3">
          Configurar component library com documentação visual completa.
        </p>
        <div className="flex items-center text-xs text-gray-500 space-x-4">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Vence hoje
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            2h restantes
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" className="w-full">
          Ver Detalhes
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card para exibir tarefas com informações de prazo e status.',
      },
    },
  },
};

export const ProductCard: Story = {
  render: () => (
    <Card className="w-full max-w-sm overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <Star className="h-12 w-12 text-white" />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Premium Plan</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">R$ 99</p>
            <p className="text-sm text-gray-600">por mês</p>
          </div>
        </div>
        <CardDescription>
          Acesso completo a todas as funcionalidades premium
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Recursos ilimitados
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Suporte prioritário
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Backup automático
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Assinar Agora</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card de produto com imagem, preço, features e CTA.',
      },
    },
  },
};

export const AlertCard: Story = {
  render: () => (
    <Card className="w-full max-w-md border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-800">Atenção Necessária</h3>
            <p className="text-sm text-orange-700">
              Seu plano expira em 3 dias. Renove agora.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
          Renovar Plano
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card de alerta com cores customizadas para chamar atenção.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Nenhum item encontrado</h3>
        <p className="text-sm text-gray-600 mb-4">
          Comece criando seu primeiro item ou ajuste os filtros de busca.
        </p>
        <Button variant="outline" size="sm">
          Criar Novo Item
        </Button>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Estado vazio com mensagem amigável e call-to-action.',
      },
    },
  },
};

export const CardCollection: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
          <CardDescription>Primeiro card da coleção</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Conteúdo do primeiro card</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
          <CardDescription>Segundo card da coleção</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Conteúdo do segundo card</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
          <CardDescription>Terceiro card da coleção</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Conteúdo do terceiro card</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Card 4</CardTitle>
          <CardDescription>Quarto card da coleção</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Conteúdo do quarto card</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid de cards demonstrando responsividade em múltiplas colunas.',
      },
    },
  },
};