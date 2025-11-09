# Exemplos de Uso - Feature Contratos

## Uso Básico do Componente Principal

```tsx
import Contratos from '@/pages/Contratos';

function App() {
  return (
    <div>
      <Contratos />
    </div>
  );
}
```

## Uso dos Hooks Individualmente

### useContracts

```tsx
import { useContracts } from '@/features/contratos/hooks';

function MyComponent() {
  const {
    contracts,
    displayedContracts,
    isLoading,
    performSearch,
    clearSearch,
  } = useContracts({
    selectedMonth: '',
    selectedYear: '',
    showFavoritesOnly: false,
    selectedTagFilter: '',
  });

  return (
    <div>
      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <ul>
          {displayedContracts.map(contract => (
            <li key={contract.id}>
              {contract.form_data.numeroContrato}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### useContractFilters

```tsx
import { useContractFilters } from '@/features/contratos/hooks';

function FilterComponent() {
  const {
    filters,
    setFilter,
    clearAllFilters,
    hasActiveFilters,
    availableYears,
    meses,
  } = useContractFilters();

  return (
    <div>
      <button onClick={() => setFilter('showFavoritesOnly', true)}>
        Mostrar Favoritos
      </button>
      
      <select
        value={filters.selectedMonth}
        onChange={(e) => setFilter('selectedMonth', e.target.value)}
      >
        <option value="">Todos os meses</option>
        {meses.map((mes, index) => (
          <option key={index} value={index + 1}>
            {mes}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button onClick={clearAllFilters}>
          Limpar Filtros
        </button>
      )}
    </div>
  );
}
```

### useContractActions

```tsx
import { useContractActions } from '@/features/contratos/hooks';

function ActionsComponent() {
  const { state, actions } = useContractReducer();
  const [isExporting, setIsExporting] = useState(false);

  const {
    generateDocument,
    handleExportToExcel,
  } = useContractActions({
    state,
    actions,
    displayedContracts: [],
    isExporting,
    setIsExporting,
    showError: (type, data) => console.log(type, data),
  });

  const handleDocumentGeneration = () => {
    // Exemplo de geração de documento
    generateDocument(someContract, template, 'Distrato de Contrato');
  };

  return (
    <div>
      <button onClick={handleDocumentGeneration}>
        Gerar Distrato
      </button>
      <button onClick={handleExportToExcel}>
        Exportar para Excel
      </button>
    </div>
  );
}
```

## Uso dos Componentes Individuais

### ContractList

```tsx
import { ContractList } from '@/features/contratos/components';

function MyContractList() {
  const [contracts, setContracts] = useState([]);
  
  return (
    <ContractList
      contracts={contracts}
      isLoading={false}
      hasMore={true}
      loadMore={() => console.log('Load more')}
      isLoadingMore={false}
      totalCount={100}
      displayedCount={10}
      hasSearched={false}
      onGenerateDocument={(contract, template, type) => {
        console.log('Generate:', contract, template, type);
      }}
    />
  );
}
```

### ContractCard

```tsx
import { ContractCard } from '@/features/contratos/components';

function MyContractCard() {
  const contract = {
    id: '1',
    form_data: {
      numeroContrato: '123',
      nomeLocatario: 'João Silva',
      nomeProprietario: 'Maria Santos',
    }
  };

  return (
    <ContractCard
      contract={contract}
      onGenerateDocument={(contract, template, type) => {
        console.log('Generate:', contract, template, type);
      }}
    />
  );
}
```

### ContractFilters

```tsx
import { ContractFilters } from '@/features/contratos/components';

function MyFilters() {
  const [filters, setFilters] = useState({
    selectedMonth: '',
    selectedYear: '',
    showFavoritesOnly: false,
    selectedTagFilter: '',
  });

  return (
    <ContractFilters
      filters={filters}
      onFilterChange={setFilters}
      onSearch={(term) => console.log('Search:', term)}
      onClearSearch={() => console.log('Clear search')}
      onClearAllFilters={() => setFilters({
        selectedMonth: '',
        selectedYear: '',
        showFavoritesOnly: false,
        selectedTagFilter: '',
      })}
      isSearching={false}
      hasSearched={false}
      searchResults={0}
      isLoading={false}
      allTags={[]}
      availableYears={[]}
      meses={[]}
      isExporting={false}
      displayedContracts={[]}
      onExportToExcel={() => console.log('Export')}
    />
  );
}
```

### ContractStats

```tsx
import { ContractStats } from '@/features/contratos/components';

function MyStats() {
  const stats = {
    totalContracts: 150,
    displayedContracts: 10,
    favoriteContracts: 5,
    contractsWithTags: 25,
  };

  return <ContractStats stats={stats} />;
}
```

## Integração com Estado Global

```tsx
import { useContractReducer } from '@/features/contracts/hooks/useContractReducer';
import { useContracts } from '@/features/contratos/hooks';
import { useContractActions } from '@/features/contratos/hooks';

function MyFeature() {
  const { state, actions } = useContractReducer();
  const { filters } = useContractFilters();
  const { displayedContracts } = useContracts(filters);
  const [isExporting, setIsExporting] = useState(false);

  const actions = useContractActions({
    state,
    actions,
    displayedContracts,
    isExporting,
    setIsExporting,
    showError: (type, data) => toast.error(data.description),
  });

  return (
    <div>
      {/* Use state, actions, e displayedContracts */}
    </div>
  );
}
```

## Configuração de Testes

```tsx
import { render, screen } from '@testing-library/react';
import { ContractCard } from '@/features/contratos/components';

test('renders contract card', () => {
  const contract = {
    id: '1',
    form_data: {
      numeroContrato: '123',
      nomeLocatario: 'Test User',
    }
  };

  render(
    <ContractCard
      contract={contract}
      onGenerateDocument={jest.fn()}
    />
  );

  expect(screen.getByText('Contrato 123')).toBeInTheDocument();
});
```

## Extensões Possíveis

1. **Performance**: Implementar virtualização para listas grandes
2. **Cache**: Adicionar cache de dados com React Query
3. **Offline**: Suporte a funcionamento offline
4. **Real-time**: Updates em tempo real com WebSockets
5. **Export**: Mais formatos de exportação (PDF, CSV)
6. **Templates**: Sistema de templates customizáveis
7. **Análise**: Dashboard analítico avançado
8. **Integração**: APIs externas (JusBrasil, Google Maps)