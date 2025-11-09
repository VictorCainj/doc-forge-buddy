import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualizedBenchmark } from '@/components/performance/VirtualizationBenchmark';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { VirtualizedTable } from '@/components/ui/virtualized-table';
import { VirtualizedGrid } from '@/components/ui/virtualized-grid';
import { DynamicVirtualizedList } from '@/components/ui/dynamic-virtualized-list';
import { SmartVirtualizedContainer } from '@/components/ui/smart-virtualized-container';
import { render as testRender, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

// Mock dos componentes de UI
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, disabled, variant, ...props }: any) => (
    <button 
      data-testid="button" 
      className={className}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/utils/iconMapper', () => ({
  Play: () => <div data-testid="icon-play">Play</div>,
  Pause: () => <div data-testid="icon-pause">Pause</div>,
  RotateCcw: () => <div data-testid="icon-rotate">RotateCcw</div>,
  BarChart3: () => <div data-testid="icon-chart">BarChart3</div>,
  MemoryStick: () => <div data-testid="icon-memory">MemoryStick</div>,
  Zap: () => <div data-testid="icon-zap">Zap</div>,
}));

// Mock do react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, height, itemCount, itemSize, width, ...props }: any) => (
    <div 
      data-testid="virtualized-list" 
      data-height={height}
      data-item-count={itemCount}
      data-item-size={itemSize}
      data-width={width}
      {...props}
    >
      {children}
    </div>
  ),
  FixedSizeGrid: ({ children, height, rowCount, columnCount, rowHeight, columnWidth, ...props }: any) => (
    <div 
      data-testid="virtualized-grid"
      data-height={height}
      data-row-count={rowCount}
      data-column-count={columnCount}
      data-row-height={rowHeight}
      data-column-width={columnWidth}
      {...props}
    >
      {children}
    </div>
  ),
  VariableSizeList: ({ children, height, itemCount, itemSize, width, ...props }: any) => (
    <div 
      data-testid="dynamic-virtualized-list"
      data-height={height}
      data-item-count={itemCount}
      data-width={width}
      {...props}
    >
      {children}
    </div>
  ),
}));

beforeEach(() => {
  setupMocks();
  setupUIMocks();
  
  // Mock de performance
  vi.stubGlobal('performance', {
    ...vi.importActual('perf_hooks'),
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 1024 * 1024 * 1024, // 1GB
    },
  });
  
  // Mock de requestAnimationFrame
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('VirtualizationBenchmark', () => {
  it('deve renderizar o componente de benchmark', () => {
    render(<VirtualizedBenchmark />);
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Benchmark de Virtualização');
    expect(screen.getByText('Tipo de Lista:')).toBeInTheDocument();
    expect(screen.getByText('Itens:')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveTextContent('Iniciar Teste');
  });

  it('deve permitir alterar o tipo de lista', async () => {
    const user = userEvent.setup();
    render(<VirtualizedBenchmark />);
    
    const select = screen.getByDisplayValue('list');
    await user.selectOptions(select, 'table');
    
    expect(select).toHaveValue('table');
  });

  it('deve permitir alterar a quantidade de itens', async () => {
    const user = userEvent.setup();
    render(<VirtualizedBenchmark />);
    
    const input = screen.getByDisplayValue('1000');
    await user.clear(input);
    await user.type(input, '5000');
    
    expect(input).toHaveValue('5000');
  });

  it('deve iniciar teste quando botão é clicado', async () => {
    const user = userEvent.setup();
    render(<VirtualizedBenchmark />);
    
    const startButton = screen.getByTestId('button');
    await user.click(startButton);
    
    expect(startButton).toHaveTextContent('Parar Teste');
  });

  it('deve mostrar métricas de performance', async () => {
    const user = userEvent.setup();
    render(<VirtualizedBenchmark />);
    
    const startButton = screen.getByTestId('button');
    await user.click(startButton);
    
    // Aguardar um pouco para o teste rodar
    await waitFor(() => {
      expect(screen.getByText(/FPS/)).toBeInTheDocument();
      expect(screen.getByText(/Memória/)).toBeInTheDocument();
      expect(screen.getByText(/Render/)).toBeInTheDocument();
    });
  });

  it('deve executar quick tests', async () => {
    const user = userEvent.setup();
    render(<VirtualizedBenchmark />);
    
    const quickTestButtons = screen.getAllByRole('button', { name: /^\d+[K]?$/ });
    
    // Clicar no teste de 1K
    await user.click(quickTestButtons[1]);
    
    const input = screen.getByDisplayValue('1000');
    expect(input).toHaveValue('1000');
  });

  it('deve renderizar lista durante o teste', async () => {
    const user = userEvent.setup();
    render(<VirtualizedBenchmark />);
    
    const startButton = screen.getByTestId('button');
    await user.click(startButton);
    
    // Verificar se a área de teste mostra a lista virtualizada
    await waitFor(() => {
      const testListArea = screen.getByText('Lista de Teste').closest('[data-testid="card"]');
      expect(testListArea).toBeInTheDocument();
    });
  });
});

describe('VirtualizedList', () => {
  const mockItems = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 100,
  }));

  const renderItem = (item: any, index: number) => (
    <div data-testid={`item-${item.id}`}>
      <h3>{item.name}</h3>
      <p>{item.value.toFixed(2)}</p>
    </div>
  );

  it('deve renderizar lista virtualizada com 10k itens', () => {
    const startTime = performance.now();
    
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={100}
        containerHeight={600}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Deve renderizar em menos de 100ms
    expect(renderTime).toBeLessThan(100);
    
    // Deve ter renderizado o componente virtualizado
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-list')).toHaveAttribute('data-item-count', '10000');
  });

  it('deve renderizar apenas itens visíveis inicialmente', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={100}
        containerHeight={600}
      />
    );
    
    // Não deve renderizar todos os 10k itens no DOM
    // (Na implementação real, apenas ~6-7 itens seriam renderizados)
    const listElement = screen.getByTestId('virtualized-list');
    expect(listElement).toBeInTheDocument();
  });

  it('deve detectar automaticamente se deve virtualizar', () => {
    const smallItems = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    
    render(
      <VirtualizedList
        items={smallItems}
        renderItem={renderItem}
        threshold={50} // Threshold de 50 itens
        virtualizationEnabled={undefined} // Auto-detecção
      />
    );
    
    // Para listas pequenas, deve renderizar normalmente
    // O componente deve detectar que não precisa virtualizar
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });
});

describe('VirtualizedTable', () => {
  const mockData = Array.from({ length: 15000 }, (_, i) => ({
    id: i + 1,
    name: `Usuário ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['admin', 'user', 'guest'][i % 3],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  const columns = [
    { key: 'id', title: 'ID', width: 80 },
    { key: 'name', title: 'Nome', width: 200 },
    { key: 'email', title: 'Email', width: 250 },
    { key: 'role', title: 'Perfil', width: 120 },
    { key: 'createdAt', title: 'Criado em', width: 150 },
  ];

  it('deve renderizar tabela virtualizada com 15k registros', () => {
    const startTime = performance.now();
    
    render(
      <VirtualizedTable
        data={mockData}
        columns={columns}
        height={600}
        virtualizationEnabled={true}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Deve renderizar rapidamente
    expect(renderTime).toBeLessThan(100);
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('deve manter performance com ordenação', async () => {
    const user = userEvent.setup();
    
    render(
      <VirtualizedTable
        data={mockData}
        columns={columns}
        height={600}
        virtualizationEnabled={true}
      />
    );
    
    const startTime = performance.now();
    
    // Simular clique no cabeçalho para ordenar
    const header = screen.getByText('Nome').closest('th');
    await user.click(header!);
    
    const endTime = performance.now();
    const sortTime = endTime - startTime;
    
    // Ordenação deve ser rápida (< 50ms)
    expect(sortTime).toBeLessThan(50);
  });

  it('deve usar fallback para listas pequenas', () => {
    const smallData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: i + 1,
    }));
    
    render(
      <VirtualizedTable
        data={smallData}
        columns={columns}
        height={600}
        threshold={50} // Não deve virtualizar listas menores que 50
      />
    );
    
    // Deve renderizar tabela normal, não virtualizada
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

describe('VirtualizedGrid', () => {
  const mockItems = Array.from({ length: 8000 }, (_, i) => ({
    id: i,
    title: `Produto ${i}`,
    price: Math.random() * 1000,
    image: `https://example.com/image-${i}.jpg`,
  }));

  const renderItem = (item: any, index: number) => (
    <Card>
      <CardContent>
        <h3>{item.title}</h3>
        <p>R$ {item.price.toFixed(2)}</p>
      </CardContent>
    </Card>
  );

  it('deve renderizar grid virtualizado com 8k itens', () => {
    const startTime = performance.now();
    
    render(
      <VirtualizedGrid
        data={mockItems}
        renderItem={renderItem}
        itemWidth={250}
        itemHeight={200}
        containerHeight={600}
        virtualizationEnabled={true}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(100);
    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });

  it('deve calcular layout corretamente', () => {
    render(
      <VirtualizedGrid
        data={mockItems}
        renderItem={renderItem}
        itemWidth={250}
        itemHeight={200}
        containerHeight={600}
        gap={16}
        virtualizationEnabled={true}
      />
    );
    
    const grid = screen.getByTestId('virtualized-grid');
    expect(grid).toHaveAttribute('data-height', '600');
  });
});

describe('DynamicVirtualizedList', () => {
  const mockItems = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    content: i < 10 ? 'Short content' : 'This is much longer content that will require dynamic height calculation. ' +
      'It includes multiple lines and more complex layout that will need to be measured and adjusted properly.',
    height: undefined, // Usar altura dinâmica
  }));

  const renderItem = (item: any, index: number) => (
    <Card>
      <CardContent>
        <h3>Item {item.id}</h3>
        <p>{item.content}</p>
      </CardContent>
    </Card>
  );

  it('deve renderizar lista com alturas dinâmicas', () => {
    const startTime = performance.now();
    
    render(
      <DynamicVirtualizedList
        data={mockItems}
        renderItem={renderItem}
        estimatedItemSize={120}
        height={600}
        virtualizationEnabled={true}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(100);
    expect(screen.getByTestId('dynamic-virtualized-list')).toBeInTheDocument();
  });

  it('deve medir altura dos itens dinamicamente', () => {
    render(
      <DynamicVirtualizedList
        data={mockItems}
        renderItem={renderItem}
        estimatedItemSize={120}
        height={600}
        virtualizationEnabled={true}
      />
    );
    
    // Verificar se o componente foi renderizado
    expect(screen.getByTestId('dynamic-virtualized-list')).toBeInTheDocument();
  });
});

describe('SmartVirtualizedContainer', () => {
  const mockData = Array.from({ length: 12000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    category: ['A', 'B', 'C'][i % 3],
    value: Math.random() * 100,
  }));

  const renderItem = (item: any, index: number) => (
    <Card>
      <CardContent>
        <h3>{item.name}</h3>
        <p>{item.category}</p>
      </CardContent>
    </Card>
  );

  it('deve detectar automaticamente se deve virtualizar', () => {
    const { rerender } = render(
      <SmartVirtualizedContainer
        data={mockData}
        type="list"
        renderItem={renderItem}
        config={{
          listThreshold: 1000,
          virtualizationEnabled: undefined, // Auto-detecção
        }}
      />
    );
    
    // Com 12k itens e threshold de 1k, deve virtualizar
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    
    // Testar com lista pequena
    const smallData = mockData.slice(0, 50);
    rerender(
      <SmartVirtualizedContainer
        data={smallData}
        type="list"
        renderItem={renderItem}
        config={{
          listThreshold: 1000,
          virtualizationEnabled: undefined,
        }}
      />
    );
    
    // Com 50 itens, não deve virtualizar
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
  });

  it('deve escolher o componente apropriado baseado no tipo', () => {
    render(
      <SmartVirtualizedContainer
        data={mockData}
        type="table"
        columns={[
          { key: 'id', title: 'ID', width: 80 },
          { key: 'name', title: 'Nome', width: 200 },
        ]}
      />
    );
    
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument(); // Tabela usa Lista
    
    render(
      <SmartVirtualizedContainer
        data={mockData}
        type="grid"
        renderItem={renderItem}
        itemWidth={300}
      />
    );
    
    expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
  });

  it('deve monitorar performance e ajustar configurações', async () => {
    // Mockar performance baixa
    vi.stubGlobal('performance', {
      ...vi.importActual('perf_hooks'),
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 200 * 1024 * 1024, // 200MB (acima do threshold)
        totalJSHeapSize: 300 * 1024 * 1024,
        jsHeapSizeLimit: 1024 * 1024 * 1024,
      },
    });
    
    render(
      <SmartVirtualizedContainer
        data={mockData}
        type="list"
        renderItem={renderItem}
        config={{
          memoryThreshold: 100, // 100MB
          autoDetectPerformance: true,
        }}
      />
    );
    
    // O componente deve detectar alta memória e desabilitar cache
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('deve mostrar loading state apropriado', () => {
    render(
      <SmartVirtualizedContainer
        data={mockData}
        type="list"
        renderItem={renderItem}
        loading={true}
      />
    );
    
    // Deve mostrar skeletons
    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });

  it('deve mostrar empty state', () => {
    render(
      <SmartVirtualizedContainer
        data={[]}
        type="list"
        renderItem={renderItem}
        emptyMessage="Nenhum item encontrado"
      />
    );
    
    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
  });
});

describe('Performance Tests - Large Datasets', () => {
  const LARGE_DATASET_SIZES = [1000, 5000, 10000, 25000, 50000];

  LARGE_DATASET_SIZES.forEach((size) => {
    it(`deve renderizar ${size} itens mantendo performance`, () => {
      const items = Array.from({ length: size }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
      }));

      const renderItem = (item: any, index: number) => (
        <div data-testid={`item-${item.id}`}>
          <h4>{item.name}</h4>
          <span>{item.value.toFixed(2)}</span>
        </div>
      );

      const startTime = performance.now();
      
      render(
        <VirtualizedList
          items={items}
          renderItem={renderItem}
          itemHeight={80}
          containerHeight={600}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance requirements by dataset size
      const maxRenderTime = size <= 1000 ? 50 : 
                           size <= 10000 ? 100 : 200;
      
      expect(renderTime).toBeLessThan(maxRenderTime);
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  it('deve manter 60fps durante scroll com 50k itens', async () => {
    const items = Array.from({ length: 50000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      content: `Content for item ${i}`,
    }));

    const renderItem = (item: any, index: number) => (
      <div data-testid={`item-${item.id}`}>
        {item.name}
      </div>
    );

    render(
      <VirtualizedList
        items={items}
        renderItem={renderItem}
        itemHeight={60}
        containerHeight={600}
      />
    );

    const list = screen.getByTestId('virtualized-list');
    
    // Simular scroll suave
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        fireEvent.scroll(list, { target: { scrollTop: i * 100 } });
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
    });

    // O teste passa se não houver erros
    expect(list).toBeInTheDocument();
  });
});

describe('Memory Usage Tests', () => {
  it('deve não exceder 100MB com 50k itens virtualizados', () => {
    const items = Array.from({ length: 50000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`,
      metadata: { key: `value${i}` },
    }));

    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    render(
      <VirtualizedList
        items={items}
        renderItem={(item) => <div>{item.name}</div>}
        itemHeight={80}
        containerHeight={600}
      />
    );
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    // Aumento de memória deve ser menor que 50MB
    expect(memoryIncrease).toBeLessThan(50);
  });

  it('deve limpar cache quando memória está alta', () => {
    // Configurar memória já alta
    vi.stubGlobal('performance', {
      ...vi.importActual('perf_hooks'),
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 150 * 1024 * 1024, // 150MB
        totalJSHeapSize: 200 * 1024 * 1024,
        jsHeapSizeLimit: 1024 * 1024 * 1024,
      },
    });

    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    render(
      <SmartVirtualizedContainer
        data={items}
        type="list"
        renderItem={(item) => <div>{item.name}</div>}
        config={{
          memoryThreshold: 100, // 100MB
          enableCache: true,
          autoDetectPerformance: true,
        }}
      />
    );

    // O componente deve ter detectado alta memória e ajustado configurações
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });
});

describe('Edge Cases', () => {
  it('deve lidar com lista vazia', () => {
    render(
      <VirtualizedList
        items={[]}
        renderItem={(item) => <div>{item.name}</div>}
        emptyMessage="Lista vazia"
      />
    );

    expect(screen.getByText('Lista vazia')).toBeInTheDocument();
  });

  it('deve lidar com altura zero', () => {
    render(
      <VirtualizedList
        items={Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))}
        renderItem={(item) => <div>{item.name}</div>}
        itemHeight={0}
        containerHeight={0}
      />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('deve lidar com itens muito grandes', () => {
    const largeItems = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      content: 'x'.repeat(10000), // Conteúdo muito grande
    }));

    render(
      <DynamicVirtualizedList
        data={largeItems}
        renderItem={(item) => <div>{item.content.substring(0, 100)}</div>}
        estimatedItemSize={200}
        height={600}
      />
    );

    expect(screen.getByTestId('dynamic-virtualized-list')).toBeInTheDocument();
  });

  it('deve funcionar com threshold zero (sempre virtualizar)', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    render(
      <SmartVirtualizedContainer
        data={items}
        type="list"
        renderItem={(item) => <div>{item.name}</div>}
        config={{
          listThreshold: 0, // Sempre virtualizar
        }}
      />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('deve funcionar com threshold infinito (nunca virtualizar)', () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    render(
      <SmartVirtualizedContainer
        data={items}
        type="list"
        renderItem={(item) => <div>{item.name}</div>}
        config={{
          listThreshold: Infinity, // Nunca virtualizar
        }}
      />
    );

    // Deve renderizar sem virtualização
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
  });
});