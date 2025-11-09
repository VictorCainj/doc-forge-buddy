import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle, 
  Download,
  Settings,
  UserPlus,
  Trash2
} from 'lucide-react';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Modal',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
O componente Modal (Dialog) é um overlay que aparece sobre o conteúdo da página para focar a atenção do usuário em uma tarefa específica.

## Características

- **Acessível**: Baseado no Radix UI com suporte completo a keyboard navigation
- **Animado**: Transições suaves de entrada e saída
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Customizável**: Header, Footer, Title, Description modulares
- **Controle de estado**: Aberto/fechado controlado ou uncontrolled

## Componentes

- **Dialog**: Container principal
- **DialogTrigger**: Elemento que abre o modal
- **DialogContent**: Conteúdo do modal
- **DialogHeader**: Cabeçalho do modal
- **DialogFooter**: Rodapé do modal
- **DialogTitle**: Título do modal
- **DialogDescription**: Descrição do modal

## Uso

\`\`\`tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir Modal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Título do Modal</DialogTitle>
          <DialogDescription>
            Descrição do que o usuário pode fazer aqui.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          Conteúdo do modal
        </div>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive component for controlled state management
const ModalDemo = ({ 
  children, 
  title = "Modal de Exemplo", 
  description = "Este é um modal de exemplo com conteúdo personalizável.",
  showFooter = true 
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir Modal</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {children}
          </div>
          {showFooter && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>
                Confirmar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalDemo>
      <p>Este é o conteúdo do modal. Você pode colocar qualquer coisa aqui.</p>
    </ModalDemo>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalDemo 
      title="Criar Novo Usuário" 
      description="Preencha os dados para criar um novo usuário no sistema."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Digite o nome completo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="email@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Cargo</Label>
          <select 
            id="role" 
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option>Selecione um cargo</option>
            <option value="admin">Administrador</option>
            <option value="editor">Editor</option>
            <option value="viewer">Visualizador</option>
          </select>
        </div>
      </div>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal contendo um formulário para criar usuário.',
      },
    },
  },
};

export const Confirmation: Story = {
  render: () => (
    <ModalDemo 
      title="Confirmar Exclusão" 
      description="Tem certeza de que deseja excluir este item? Esta ação não pode ser desfeita."
      showFooter={false}
    >
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">
            Esta ação irá excluir permanentemente o item selecionado junto com todos os dados associados.
          </p>
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={() => setOpen(false)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </DialogFooter>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal de confirmação para ações destrutivas.',
      },
    },
  },
};

export const Success: Story = {
  render: () => (
    <ModalDemo 
      title="Operação Concluída" 
      description="Sua ação foi executada com sucesso."
      showFooter={false}
    >
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          O item foi salvo com sucesso e está disponível na lista.
        </p>
        <Button onClick={() => setOpen(false)}>
          Continuar
        </Button>
      </div>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal de sucesso após uma operação.',
      },
    },
  },
};

export const Error: Story = {
  render: () => (
    <ModalDemo 
      title="Erro na Operação" 
      description="Ocorreu um erro ao processar sua solicitação."
      showFooter={false}
    >
      <div className="text-center py-4">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Não foi possível completar a operação. Tente novamente ou contacte o suporte.
        </p>
        <div className="space-y-2">
          <Button onClick={() => setOpen(false)}>
            Tentar Novamente
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Contactar Suporte
          </Button>
        </div>
      </div>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal de erro com opções de recuperação.',
      },
    },
  },
};

export const InfoModal: Story = {
  render: () => (
    <ModalDemo 
      title="Informações do Sistema" 
      description="Detalhes sobre a versão e configurações atuais."
      showFooter={false}
    >
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Versão:</span>
          <span className="text-sm text-muted-foreground">2.1.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Última atualização:</span>
          <span className="text-sm text-muted-foreground">15/01/2024</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Status:</span>
          <span className="text-sm text-green-600">Operacional</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Usuários ativos:</span>
          <span className="text-sm text-muted-foreground">1,247</span>
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </DialogFooter>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal informativo com dados do sistema.',
      },
    },
  },
};

export const Large: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir Modal Grande</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurações Avançadas</DialogTitle>
              <DialogDescription>
                Configure as opções avançadas do sistema conforme suas necessidades.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <select 
                    id="timezone" 
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="america-sao_paulo">America/São Paulo (UTC-3)</option>
                    <option value="america-new_york">America/New York (UTC-5)</option>
                    <option value="europe-london">Europe/London (UTC+0)</option>
                    <option value="asia-tokyo">Asia/Tokyo (UTC+9)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <select 
                    id="language" 
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="pt-br">Português (Brasil)</option>
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notificações</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email para novas tarefas</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber email quando novas tarefas forem atribuídas
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações do browser</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir notificações no navegador
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>
                Salvar Configurações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal grande com scroll para conteúdo extenso.',
      },
    },
  },
};

export const Small: Story = {
  render: () => (
    <ModalDemo 
      title="Quick Action" 
      description="Ação rápida com modal compacto."
      showFooter={false}
    >
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-4">
          Esta é uma ação rápida que não requer muito espaço.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Não
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Sim
          </Button>
        </div>
      </div>
    </ModalDemo>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal compacto para ações simples.',
      },
    },
  },
};

export const WithActions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir com Ações</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Dados</DialogTitle>
              <DialogDescription>
                Escolha o formato e período para exportar os dados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Formato</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" name="format" id="excel" defaultChecked />
                      <Label htmlFor="excel" className="text-sm">Excel (.xlsx)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" name="format" id="csv" />
                      <Label htmlFor="csv" className="text-sm">CSV (.csv)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" name="format" id="pdf" />
                      <Label htmlFor="pdf" className="text-sm">PDF (.pdf)</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Período</Label>
                  <div className="space-y-2 mt-2">
                    <select className="w-full p-2 border border-input rounded-md text-sm">
                      <option>Últimos 30 dias</option>
                      <option>Últimos 3 meses</option>
                      <option>Últimos 6 meses</option>
                      <option>Este ano</option>
                      <option>Personalizado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal com múltiplas opções e ações.',
      },
    },
  },
};