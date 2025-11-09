# Exemplos de Uso - Component Library

Este documento contém exemplos práticos de como usar os componentes da library.

## 📋 Índice

- [Formulário Completo](#formulário-completo)
- [Dashboard Cards](#dashboard-cards)
- [Modal com Actions](#modal-com-actions)
- [Table com Dados](#table-com-dados)
- [Layout Responsivo](#layout-responsivo)

## 📝 Formulário Completo

```tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const ContactForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: '',
    newsletter: false,
  });

  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Form submitted:', formData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contato</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <textarea
              id="message"
              placeholder="Digite sua mensagem..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsletter"
              checked={formData.newsletter}
              onCheckedChange={(checked) => 
                setFormData({...formData, newsletter: checked as boolean})
              }
            />
            <Label htmlFor="newsletter">Receber newsletter</Label>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContactForm;
```

## 📊 Dashboard Cards

```tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const DashboardCards = () => {
  const stats = [
    {
      title: 'Total de Usuários',
      value: '12,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45,231',
      change: '+5.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Vendas',
      value: '1,234',
      change: '-2.1%',
      trend: 'down',
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: 'Taxa de Conversão',
      value: '3.2%',
      change: '+1.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full bg-muted ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  vs mês anterior
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardCards;
```

## 🎭 Modal com Actions

```tsx
import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onSave: (user: any) => void;
}

const UserModal: React.FC<UserModalProps> = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user'
  });
  
  const [loading, setLoading] = React.useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      setFormData({ name: '', email: '', role: 'user' });
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Digite o nome"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Digite o email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
              <option value="editor">Editor</option>
            </select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {user ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
```

## 📋 Table com Dados

```tsx
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

const UserTable = () => {
  const [users, setUsers] = React.useState([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@exemplo.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@exemplo.com',
      role: 'editor',
      status: 'active',
      lastLogin: '2024-01-14'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@exemplo.com',
      role: 'user',
      status: 'inactive',
      lastLogin: '2024-01-10'
    }
  ]);

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-blue-100 text-blue-800',
      editor: 'bg-purple-100 text-purple-800',
      user: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || colors.user}>
        {role}
      </Badge>
    );
  };

  const handleEdit = (userId: string) => {
    console.log('Edit user:', userId);
  };

  const handleDelete = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último Login</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                {getRoleBadge(user.role)}
              </TableCell>
              <TableCell>
                {getStatusBadge(user.status)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(user.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
```

## 📱 Layout Responsivo

```tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ResponsiveLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Button size="sm" variant="outline">
                Configurações
              </Button>
              <Button size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Mobile: Stack vertically, Desktop: Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Principal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Este conteúdo se adapta ao tamanho da tela. Em dispositivos móveis,
                  ocupará 100% da largura, enquanto em desktop será metade do espaço.
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="analytics">Análises</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <p>Dados de visão geral...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <p>Dados de análises...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <p>Configurações...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sidebar que aparece na lateral em desktop e
                  é ocultada em mobile.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Nova mensagem</p>
                      <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Tarefa concluída</p>
                      <p className="text-xs text-muted-foreground">Há 1 hora</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
```

---

Estes exemplos demonstram como usar os componentes de forma prática e seguindo as melhores práticas da component library. Cada exemplo inclui:

- ✅ Estrutura responsiva
- ✅ Acessibilidade
- ✅ Estados de loading
- ✅ Tratamento de erros
- ✅ TypeScript
- ✅ Performance otimizada

Para mais exemplos, consulte as stories do Storybook em `npm run storybook`.