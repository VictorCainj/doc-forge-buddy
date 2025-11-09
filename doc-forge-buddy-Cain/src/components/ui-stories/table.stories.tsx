import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';
import { Badge } from './badge';
import { Button } from './button';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
O componente Table é uma tabela responsiva e acessível baseada no Radix UI.

## Características

- **Componentes modulares**: Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell
- **Responsiva**: Scroll horizontal automático em telas pequenas
- **Acessível**: Suporte completo a screen readers
- **Customizável**: Classes CSS personalizadas via className
- **Estados**: Hover, selected, focus states

## Uso

\`\`\`tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function Example() {
  return (
    <Table>
      <TableCaption>Lista de usuários</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>João Silva</TableCell>
          <TableCell>joao@email.com</TableCell>
          <TableCell>
            <Badge variant="success">Ativo</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
\`\`\`

## Design Tokens

- **Espaçamento**: células com padding de 16px (p-4)
- **Bordas**: borda inferior sutil entre linhas
- **Hover**: background sutil em hover
- **Cores**: baseadas no tema design system
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Classes CSS adicionais para a tabela',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for examples
const sampleUsers = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@example.com',
    role: 'Admin',
    status: 'Ativo',
    lastLogin: '2024-01-15',
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    role: 'Editor',
    status: 'Ativo',
    lastLogin: '2024-01-14',
  },
  {
    id: 3,
    name: 'Pedro Costa',
    email: 'pedro.costa@example.com',
    role: 'Viewer',
    status: 'Inativo',
    lastLogin: '2024-01-10',
  },
  {
    id: 4,
    name: 'Ana Oliveira',
    email: 'ana.oliveira@example.com',
    role: 'Editor',
    status: 'Ativo',
    lastLogin: '2024-01-13',
  },
  {
    id: 5,
    name: 'Carlos Lima',
    email: 'carlos.lima@example.com',
    role: 'Viewer',
    status: 'Pendente',
    lastLogin: 'Nunca',
  },
];

const getStatusBadge = (status: string) => {
  const variant = 
    status === 'Ativo' ? 'success' :
    status === 'Inativo' ? 'destructive' :
    'secondary';
  
  return <Badge variant={variant as any}>{status}</Badge>;
};

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Lista de usuários do sistema</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Último Login</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.slice(0, 3).map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{getStatusBadge(user.status)}</TableCell>
            <TableCell>{user.lastLogin}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.slice(0, 3).map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{getStatusBadge(user.status)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabela com ações disponíveis em cada linha.',
      },
    },
  },
};

export const Sortable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-2">
              Nome
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-2">
              Email
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Cargo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{getStatusBadge(user.status)}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabela com colunas ordenáveis (indicado pelo cursor pointer e ícone).',
      },
    },
  },
};

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableCaption>Lista de usuários - Total de 5 usuários</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.slice(0, 3).map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{getStatusBadge(user.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground">
            Mostrando 3 de 5 usuários
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabela com rodapé mostrando informações de paginação ou resumo.',
      },
    },
  },
};

export const Compact: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.slice(0, 4).map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-mono text-xs">#{user.id}</TableCell>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{getStatusBadge(user.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Versão compacta da tabela com largura reduzida.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableCaption>Lista de usuários vazia</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
            Nenhum usuário encontrado
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Estado vazio da tabela quando não há dados para exibir.',
      },
    },
  },
};

export const Large: Story = {
  render: () => (
    <div className="max-h-96 overflow-auto">
      <Table>
        <TableCaption>Lista completa de usuários</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último Login</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }, (_, i) => {
            const user = sampleUsers[i % sampleUsers.length];
            return (
              <TableRow key={i}>
                <TableCell className="font-mono">#{i + 1}</TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell>2024-01-{(i % 30) + 1}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabela grande com scroll vertical para demonstrar o comportamento responsivo.',
      },
    },
  },
};