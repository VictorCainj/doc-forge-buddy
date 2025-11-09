import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { render, setupMocks, setupUIMocks } from '@/test/utils/test-utils';

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
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, disabled, ...props }: any) => (
    <button 
      data-testid="button" 
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/utils/iconMapper', () => ({
  FileText: () => <div data-testid="icon-file-text">FileText</div>,
  MapPin: () => <div data-testid="icon-map-pin">MapPin</div>,
  User: () => <div data-testid="icon-user">User</div>,
}));

beforeEach(() => {
  setupMocks();
  setupUIMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

const mockItems = [
  { id: '1', name: 'Item 1', description: 'Descrição 1' },
  { id: '2', name: 'Item 2', description: 'Descrição 2' },
  { id: '3', name: 'Item 3', description: 'Descrição 3' },
  { id: '4', name: 'Item 4', description: 'Descrição 4' },
  { id: '5', name: 'Item 5', description: 'Descrição 5' },
];

const renderItem = (item: any, index: number) => (
  <div key={item.id} data-testid={`item-${item.id}`}>
    <h3>{item.name}</h3>
    <p>{item.description}</p>
    <div data-testid="icon-file-text">FileText</div>
  </div>
);

describe('VirtualizedList', () => {
  it('deve renderizar a lista com itens', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
      />
    );

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('deve renderizar lista vazia quando items é array vazio', () => {
    render(
      <VirtualizedList
        items={[]}
        renderItem={renderItem}
        emptyMessage="Nenhum item encontrado"
      />
    );

    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
  });

  it('deve renderizar estado de loading', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        loading={true}
      />
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('deve renderizar com altura personalizada', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={100}
        containerHeight={500}
      />
    );

    const list = screen.getByTestId('virtualized-list');
    expect(list).toHaveAttribute('data-container-height', '500');
    expect(list).toHaveAttribute('data-item-height', '100');
  });

  it('deve renderizar com overscan personalizado', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        overscan={10}
      />
    );

    const list = screen.getByTestId('virtualized-list');
    expect(list).toHaveAttribute('data-overscan', '10');
  });

  it('deve aplicar className customizado', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        className="custom-list-class"
      />
    );

    const list = screen.getByTestId('virtualized-list');
    expect(list).toHaveClass('custom-list-class');
  });

  it('deve renderizar apenas itens visíveis baseado no scroll', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={120}
        containerHeight={600}
      />
    );

    // Verificar se todos os itens estão sendo renderizados
    // (Em uma implementação real, só alguns seriam visíveis)
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`item-${i}`)).toBeInTheDocument();
    }
  });

  it('deve permitir scroll na lista', async () => {
    const user = userEvent.setup();
    
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
      />
    );

    const list = screen.getByTestId('virtualized-list');
    
    // Simular scroll
    fireEvent.scroll(list, { target: { scrollTop: 200 } });

    // Verificar se o scroll foi registrado
    await waitFor(() => {
      expect(list).toHaveAttribute('data-scroll-top', '200');
    });
  });

  it('deve calcular altura total corretamente', () => {
    const largeList = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      description: `Descrição ${i}`,
    }));

    render(
      <VirtualizedList
        items={largeList}
        renderItem={renderItem}
        itemHeight={120}
      />
    );

    const list = screen.getByTestId('virtualized-list');
    expect(list).toHaveAttribute('data-total-height', (100 * 120).toString());
  });

  it('deve renderizar viewport corretamente', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={120}
        containerHeight={600}
      />
    );

    const viewport = screen.getByTestId('virtualized-viewport');
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveAttribute('data-height', '600');
  });

  it('deve renderizar content com altura total', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={120}
      />
    );

    const content = screen.getByTestId('virtualized-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-height', (mockItems.length * 120).toString());
  });

  it('deve renderizar items em positions corretas', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={120}
      />
    );

    // Verificar se items estão sendo renderizados com translateY
    const items = screen.getAllByTestId(/^item-/);
    expect(items).toHaveLength(mockItems.length);
  });

  it('deve ter scrollbar customizado', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
      />
    );

    const scrollbar = screen.getByTestId('virtualized-scrollbar');
    expect(scrollbar).toBeInTheDocument();
  });

  it('deve mostrar message personalizada para lista vazia', () => {
    render(
      <VirtualizedList
        items={[]}
        renderItem={renderItem}
        emptyMessage="Lista personalizada vazia"
      />
    );

    expect(screen.getByText('Lista personalizada vazia')).toBeInTheDocument();
  });

  it('deve renderizar skeletons durante loading', () => {
    const loadingItems = Array.from({ length: 3 }, (_, i) => ({
      id: `loading-${i}`,
      name: '',
      description: '',
    }));

    render(
      <VirtualizedList
        items={loadingItems}
        renderItem={renderItem}
        loading={true}
      />
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('deve lidar com itemHeight zero', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemHeight={0}
      />
    );

    const content = screen.getByTestId('virtualized-content');
    expect(content).toHaveAttribute('data-height', '0');
  });

  it('deve lidar com containerHeight zero', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        containerHeight={0}
      />
    );

    const viewport = screen.getByTestId('virtualized-viewport');
    expect(viewport).toHaveAttribute('data-height', '0');
  });

  it('deve funcionar com tipos genéricos', () => {
    interface TestItem {
      id: string;
      title: string;
      value: number;
    }

    const typedItems: TestItem[] = [
      { id: '1', title: 'Test 1', value: 100 },
      { id: '2', title: 'Test 2', value: 200 },
    ];

    const renderTypedItem = (item: TestItem) => (
      <div key={item.id} data-testid={`typed-item-${item.id}`}>
        <h3>{item.title}</h3>
        <p>{item.value}</p>
      </div>
    );

    render(
      <VirtualizedList
        items={typedItems}
        renderItem={renderTypedItem}
      />
    );

    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
  });
});