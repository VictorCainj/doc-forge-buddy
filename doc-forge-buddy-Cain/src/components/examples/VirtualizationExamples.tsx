import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { VirtualizedTable } from '@/components/ui/virtualized-table';
import { VirtualizedGrid } from '@/components/ui/virtualized-grid';
import { DynamicVirtualizedList } from '@/components/ui/dynamic-virtualized-list';
import { SmartVirtualizedContainer } from '@/components/ui/smart-virtualized-container';
import { useOptimizedVirtualization } from '@/hooks/useOptimizedVirtualization';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
} from '@/components/ui/table';
import { 
  FileText, 
  Users, 
  Image, 
  Settings, 
  BarChart3, 
  Zap,
  Database,
  Monitor
} from '@/utils/iconMapper';

// Tipos de dados para demonstração
interface Contract {
  id: string;
  numeroContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  endereco: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  status: 'ativo' | 'inativo' | 'vencido';
  categoria: string;
  observacoes: string;
}

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'user' | 'guest';
  status: 'ativo' | 'inativo' | 'suspenso';
  ultimoAcesso: string;
  permissoes: string[];
  departamento: string;
}

interface Product {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  imagem: string;
  descricao: string;
  tags: string[];
  fornecedor: string;
}

// Gerador de dados de demonstração
const generateContracts = (count: number): Contract[] => {
  const status = ['ativo', 'inativo', 'vencido'] as const;
  const categorias = ['Residencial', 'Comercial', 'Industrial', 'Rural'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `contract-${i + 1}`,
    numeroContrato: `CTR-${String(i + 1).padStart(6, '0')}`,
    nomeProprietario: `Proprietário ${i + 1}`,
    nomeLocatario: `Locatário ${i + 1}`,
    endereco: `Rua Exemplo ${i + 1}, ${Math.floor(Math.random() * 9999) + 1}, Cidade - Estado`,
    valor: Math.floor(Math.random() * 5000) + 500,
    dataInicio: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    dataFim: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: status[Math.floor(Math.random() * status.length)],
    categoria: categorias[Math.floor(Math.random() * categorias.length)],
    observacoes: `Observações do contrato ${i + 1}. Esta é uma observação mais longa que pode ter múltiplas linhas e testar a renderização de conteúdo extenso em listas virtualizadas.`,
  }));
};

const generateUsers = (count: number): User[] => {
  const perfis = ['admin', 'user', 'guest'] as const;
  const status = ['ativo', 'inativo', 'suspenso'] as const;
  const departamentos = ['Vendas', 'Marketing', 'TI', 'RH', 'Financeiro', 'Operações'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    nome: `Usuário ${i + 1}`,
    email: `user${i + 1}@empresa.com`,
    perfil: perfis[Math.floor(Math.random() * perfis.length)],
    status: status[Math.floor(Math.random() * status.length)],
    ultimoAcesso: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    permissoes: ['read', 'write', 'delete'].slice(0, Math.floor(Math.random() * 3) + 1),
    departamento: departamentos[Math.floor(Math.random() * departamentos.length)],
  }));
};

const generateProducts = (count: number): Product[] => {
  const categorias = ['Eletrônicos', 'Roupas', 'Casa', 'Esportes', 'Livros', 'Brinquedos'];
  const tags = ['promocao', 'novo', 'bestseller', 'lancamento', 'festival', 'desconto'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i + 1}`,
    nome: `Produto ${i + 1}`,
    categoria: categorias[Math.floor(Math.random() * categorias.length)],
    preco: Math.floor(Math.random() * 1000) + 10,
    estoque: Math.floor(Math.random() * 1000),
    imagem: `https://via.placeholder.com/300x200?text=Produto+${i + 1}`,
    descricao: `Descrição detalhada do produto ${i + 1}. Este produto tem características únicas e benefícios específicos que serão destacados na listagem.`,
    tags: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => 
      tags[Math.floor(Math.random() * tags.length)]
    ),
    fornecedor: `Fornecedor ${Math.floor(Math.random() * 50) + 1}`,
  }));
};

// Componentes de renderização

// Renderizador de contrato
const renderContract = (contract: Contract, index: number) => (
  <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm text-neutral-900">
            {contract.numeroContrato}
          </h3>
          <p className="text-xs text-neutral-500">
            {contract.categoria} • {contract.status}
          </p>
        </div>
        <Badge 
          variant={contract.status === 'ativo' ? 'default' : contract.status === 'vencido' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {contract.status}
        </Badge>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-neutral-600">Proprietário:</span>
          <span className="font-medium">{contract.nomeProprietario}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-neutral-600">Locatário:</span>
          <span className="font-medium">{contract.nomeLocatario}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-neutral-600">Valor:</span>
          <span className="font-medium">R$ {contract.valor.toFixed(2)}</span>
        </div>
      </div>
      
      <p className="text-xs text-neutral-600 line-clamp-2">
        {contract.observacoes}
      </p>
    </CardContent>
  </Card>
);

// Renderizador de usuário
const renderUser = (user: User, index: number) => (
  <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
          <Users className="h-5 w-5 text-neutral-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{user.nome}</h3>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>
        <Badge 
          variant={user.status === 'ativo' ? 'default' : user.status === 'suspenso' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {user.status}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-600">{user.perfil}</span>
        <span className="text-neutral-600">{user.departamento}</span>
      </div>
    </CardContent>
  </Card>
);

// Renderizador de produto
const renderProduct = (product: Product, index: number) => (
  <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
    <div className="aspect-video bg-neutral-100 flex items-center justify-center">
      <Image className="h-8 w-8 text-neutral-400" />
    </div>
    <CardContent className="p-4">
      <h3 className="font-semibold text-sm mb-1">{product.nome}</h3>
      <p className="text-xs text-neutral-600 mb-2">{product.categoria}</p>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-lg">R$ {product.preco.toFixed(2)}</span>
        <span className="text-xs text-neutral-500">{product.estoque} unidades</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {product.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Colunas para tabelas
const contractColumns = [
  { 
    key: 'numeroContrato' as keyof Contract, 
    title: 'Contrato', 
    width: 120,
    render: (value: string) => <span className="font-mono text-sm">{value}</span>
  },
  { 
    key: 'nomeProprietario' as keyof Contract, 
    title: 'Proprietário', 
    width: 200 
  },
  { 
    key: 'nomeLocatario' as keyof Contract, 
    title: 'Locatário', 
    width: 200 
  },
  { 
    key: 'valor' as keyof Contract, 
    title: 'Valor', 
    width: 100,
    render: (value: number) => <span className="font-semibold">R$ {value.toFixed(2)}</span>
  },
  { 
    key: 'status' as keyof Contract, 
    title: 'Status', 
    width: 100,
    render: (value: string) => (
      <Badge 
        variant={value === 'ativo' ? 'default' : value === 'vencido' ? 'destructive' : 'secondary'}
        className="text-xs"
      >
        {value}
      </Badge>
    )
  },
  { 
    key: 'dataInicio' as keyof Contract, 
    title: 'Início', 
    width: 120,
    render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
  },
];

const userColumns = [
  { key: 'nome' as keyof User, title: 'Nome', width: 200 },
  { key: 'email' as keyof User, title: 'Email', width: 250 },
  { key: 'perfil' as keyof User, title: 'Perfil', width: 100 },
  { 
    key: 'status' as keyof User, 
    title: 'Status', 
    width: 100,
    render: (value: string) => (
      <Badge 
        variant={value === 'ativo' ? 'default' : value === 'suspenso' ? 'destructive' : 'secondary'}
      >
        {value}
      </Badge>
    )
  },
  { key: 'departamento' as keyof User, title: 'Departamento', width: 150 },
];

// Componente principal de demonstração
export const VirtualizationExamples: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<'list' | 'table' | 'grid' | 'dynamic' | 'smart'>('list');
  const [itemCount, setItemCount] = useState(1000);
  const [showPerformance, setShowPerformance] = useState(false);

  // Gerar dados baseado na seleção e quantidade
  const contracts = useMemo(() => generateContracts(itemCount), [itemCount]);
  const users = useMemo(() => generateUsers(itemCount), [itemCount]);
  const products = useMemo(() => generateProducts(itemCount), [itemCount]);

  const demos = [
    {
      id: 'list' as const,
      title: 'Lista Virtualizada',
      description: 'Lista com cards para exibição de contratos',
      icon: FileText,
      component: () => (
        <VirtualizedList
          items={contracts}
          renderItem={renderContract}
          itemHeight={140}
          containerHeight={600}
          overscan={3}
          virtualizationEnabled={true}
        />
      ),
    },
    {
      id: 'table' as const,
      title: 'Tabela Virtualizada',
      description: 'Tabela com ordenação e headers fixos',
      icon: Database,
      component: () => (
        <VirtualizedTable
          data={contracts}
          columns={contractColumns}
          height={600}
          stickyHeader
          virtualizationEnabled={true}
          sortBy="numeroContrato"
          sortDirection="asc"
        />
      ),
    },
    {
      id: 'grid' as const,
      title: 'Grid Virtualizado',
      description: 'Layout em grid para produtos',
      icon: Image,
      component: () => (
        <VirtualizedGrid
          data={products}
          renderItem={renderProduct}
          itemWidth={320}
          itemHeight={280}
          containerHeight={600}
          gap={16}
          virtualizationEnabled={true}
        />
      ),
    },
    {
      id: 'dynamic' as const,
      title: 'Lista Dinâmica',
      description: 'Lista com alturas variáveis para usuários',
      icon: Users,
      component: () => (
        <DynamicVirtualizedList
          data={users.map((user, index) => ({
            ...user,
            height: 100 + (index % 3) * 30, // Alturas variáveis simuladas
          }))}
          renderItem={renderUser}
          estimatedItemSize={120}
          height={600}
          virtualizationEnabled={true}
        />
      ),
    },
    {
      id: 'smart' as const,
      title: 'Container Inteligente',
      description: 'Auto-detecção e otimização automática',
      icon: Zap,
      component: () => (
        <SmartVirtualizedContainer
          data={contracts}
          type="list"
          renderItem={renderContract}
          config={{
            listThreshold: 50,
            enableCache: true,
            enablePreloading: true,
            autoDetectPerformance: true,
          }}
          height={600}
        />
      ),
    },
  ];

  const currentDemo = demos.find(demo => demo.id === selectedDemo);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Demonstração de Virtualização Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {demos.map((demo) => {
              const Icon = demo.icon;
              return (
                <Card 
                  key={demo.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDemo === demo.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedDemo(demo.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-sm">{demo.title}</h3>
                    </div>
                    <p className="text-xs text-neutral-600 mb-3">{demo.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {itemCount.toLocaleString()} itens
                      </Badge>
                      {selectedDemo === demo.id && (
                        <Badge className="text-xs">Selecionado</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Quantidade de Itens:</label>
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value={100}>100 (Simulação)</option>
                <option value={500}>500 (Lista Pequena)</option>
                <option value={1000}>1.000 (Lista Média)</option>
                <option value={5000}>5.000 (Lista Grande)</option>
                <option value={10000}>10.000 (Lista Muito Grande)</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerformance(!showPerformance)}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              {showPerformance ? 'Ocultar' : 'Mostrar'} Performance
            </Button>
          </div>

          {showPerformance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-neutral-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {itemCount.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-600">Itens Totais</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Math.min(Math.ceil(600 / 140), itemCount)}
                </div>
                <div className="text-xs text-neutral-600">Itens Visíveis</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round((1 - Math.min(Math.ceil(600 / 140), itemCount) / itemCount) * 100)}%
                </div>
                <div className="text-xs text-neutral-600">Eficiência</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {currentDemo?.id === 'table' ? 'Virtualizado' : 'Ativo'}
                </div>
                <div className="text-xs text-neutral-600">Status</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demonstração atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentDemo && <currentDemo.icon className="h-5 w-5" />}
            {currentDemo?.title}
          </CardTitle>
          <p className="text-sm text-neutral-600">{currentDemo?.description}</p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {currentDemo?.component()}
          </div>
        </CardContent>
      </Card>

      {/* Configurações técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Otimizações Ativas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Virtualização de DOM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Memoização de Componentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Debouncing de Scroll</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Preloading Inteligente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Cache LRU com TTL</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Métricas Atuais</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Threshold de Virtualização:</span>
                  <span className="font-mono">50 itens</span>
                </div>
                <div className="flex justify-between">
                  <span>Overscan:</span>
                  <span className="font-mono">5 itens</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Size:</span>
                  <span className="font-mono">1000 itens</span>
                </div>
                <div className="flex justify-between">
                  <span>Debounce Delay:</span>
                  <span className="font-mono">16ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualizationExamples;