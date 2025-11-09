import React, { useState } from 'react';
import {
  useFormValidation,
  useAsyncValidation,
  useDebounce,
  useThrottle,
  useLocalStorage,
  useSessionStorage,
  useIntersectionObserver,
  useResizeObserver,
  useVirtualScrolling,
  useInfiniteScroll,
} from './index';
import { z } from 'zod';

// ================================
// EXEMPLO: Validação de Formulário
// ================================

const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Deve ter pelo menos 18 anos'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

function FormValidationExample() {
  const form = useFormValidation(userSchema, {
    name: '',
    email: '',
    age: 0,
    website: '',
  });

  const emailValidator = useAsyncValidation<string>(
    async (email) => {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simular email já existente
      return email !== 'teste@exemplo.com';
    },
    800
  );

  const handleEmailChange = (email: string) => {
    form.setField('email', email);
    if (email) {
      emailValidator.validate(email);
    }
  };

  return (
    <div className="form-example">
      <h2>Exemplo de Validação de Formulário</h2>
      
      <div>
        <label>Nome:</label>
        <input
          type="text"
          value={form.data.name}
          onChange={(e) => form.setField('name', e.target.value)}
          onBlur={() => form.validateField('name')}
        />
        {form.getFieldError('name') && (
          <span className="error">{form.getFieldError('name')}</span>
        )}
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={form.data.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={() => form.validateField('email')}
        />
        {form.getFieldError('email') && (
          <span className="error">{form.getFieldError('email')}</span>
        )}
        {emailValidator.isValidating && <span>Verificando email...</span>}
        {emailValidator.error && (
          <span className="error">{emailValidator.error}</span>
        )}
      </div>

      <div>
        <label>Idade:</label>
        <input
          type="number"
          value={form.data.age}
          onChange={(e) => form.setField('age', parseInt(e.target.value))}
          onBlur={() => form.validateField('age')}
        />
        {form.getFieldError('age') && (
          <span className="error">{form.getFieldError('age')}</span>
        )}
      </div>

      <div>
        <label>Website:</label>
        <input
          type="url"
          value={form.data.website}
          onChange={(e) => form.setField('website', e.target.value)}
          onBlur={() => form.validateField('website')}
        />
        {form.getFieldError('website') && (
          <span className="error">{form.getFieldError('website')}</span>
        )}
      </div>

      <button 
        onClick={form.validateForm}
        disabled={!form.isValid || form.isValidating}
      >
        {form.isValidating ? 'Validando...' : 'Validar Formulário'}
      </button>

      {form.isValid && <p className="success">✓ Formulário válido!</p>}
    </div>
  );
}

// ================================
// EXEMPLO: Performance (Debounce/Throttle)
// ================================

function PerformanceExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  
  // Debounce para busca
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Throttle para scroll
  const throttledScrollY = useThrottle(scrollY, 100);

  React.useEffect(() => {
    if (debouncedSearch) {
      console.log('Buscar por:', debouncedSearch);
      // Simular busca
    }
  }, [debouncedSearch]);

  React.useEffect(() => {
    // Apenas executar a cada 100ms
    if (throttledScrollY !== scrollY) {
      console.log('Scroll Y:', throttledScrollY);
    }
  }, [throttledScrollY, scrollY]);

  const handleScroll = (e: React.UIEvent) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  return (
    <div className="performance-example">
      <h2>Exemplo de Performance (Debounce/Throttle)</h2>
      
      <div>
        <label>Buscar (debounced):</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Digite para buscar..."
        />
        {debouncedSearch && <p>Buscando por: "{debouncedSearch}"</p>}
      </div>

      <div 
        style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc' }}
        onScroll={handleScroll}
      >
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ height: '30px' }}>
            Item {i + 1} - Scroll Y: {throttledScrollY}px
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================
// EXEMPLO: Local/Session Storage
// ================================

function StorageExample() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [draft, setDraft] = useSessionStorage('form-draft', {
    title: '',
    content: '',
  });

  return (
    <div className="storage-example">
      <h2>Exemplo de Local/Session Storage</h2>
      
      <div>
        <label>Tema (localStorage):</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select>
        <p>Tema atual: {theme}</p>
      </div>

      <div>
        <label>Rascunho (sessionStorage):</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Título do rascunho"
        />
        <textarea
          value={draft.content}
          onChange={(e) => setDraft(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Conteúdo do rascunho"
        />
        <p>Os dados são limpos ao fechar a aba</p>
      </div>
    </div>
  );
}

// ================================
// EXEMPLO: Observabilidade
// ================================

function ObservabilityExample() {
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });

  const { ref: resizeRef, bounds, isResizing } = useResizeObserver();

  return (
    <div className="observability-example">
      <h2>Exemplo de Observabilidade</h2>
      
      <div ref={resizeRef} className="resize-box">
        <h3>Box Redimensionável</h3>
        <p>Largura: {bounds.width}px</p>
        <p>Altura: {bounds.height}px</p>
        {isResizing && <p className="resizing">Redimensionando...</p>}
      </div>

      <div className="scroll-container" style={{ height: '200px', overflow: 'auto' }}>
        <div style={{ height: '800px', position: 'relative' }}>
          <div 
            ref={intersectionRef}
            style={{
              position: 'absolute',
              top: '300px',
              height: '100px',
              backgroundColor: isIntersecting ? '#4CAF50' : '#f44336',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isIntersecting ? '✓ Visível' : '✗ Não visível'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================
// EXEMPLO: Virtual Scrolling
// ================================

function VirtualScrollingExample() {
  // Simular lista grande
  const items = React.useMemo(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i + 1}`,
      description: `Descrição do item ${i + 1}`,
    })), []
  );

  const {
    visibleItems,
    startIndex,
    containerStyle,
  } = useVirtualScrolling(items, {
    itemHeight: 60,
    containerHeight: 400,
    overscan: 5,
  });

  return (
    <div className="virtual-scrolling-example">
      <h2>Exemplo de Virtual Scrolling</h2>
      <p>Mostrando itens {startIndex + 1}-{startIndex + visibleItems.length} de {items.length}</p>
      
      <div style={containerStyle}>
        <div style={{ position: 'relative' }}>
          {visibleItems.map((item, index) => (
            <div 
              key={item.id}
              style={{ 
                height: '60px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
              }}
            >
              <strong>{item.name}</strong>
              <span style={{ marginLeft: '10px', color: '#666' }}>
                {item.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================
// EXEMPLO: Infinite Scroll
// ================================

function InfiniteScrollExample() {
  const [currentPage, setCurrentPage] = useState(1);

  const fetchItems = React.useCallback(async () => {
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const startIndex = (currentPage - 1) * 20;
    const endIndex = startIndex + 20;
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: startIndex + i,
      name: `Item ${startIndex + i + 1}`,
    }));
  }, [currentPage]);

  const {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    loadCount,
  } = useInfiniteScroll(fetchItems, {
    threshold: 200,
  });

  return (
    <div className="infinite-scroll-example">
      <h2>Exemplo de Infinite Scroll</h2>
      <p>Carregamentos: {loadCount}</p>
      
      <div className="items-container">
        {items.map(item => (
          <div key={item.id} className="item">
            {item.name}
          </div>
        ))}
      </div>

      {isLoading && <p>Carregando mais itens...</p>}
      {error && <p className="error">Erro: {error}</p>}
      {!hasMore && <p>Fim da lista</p>}
      
      {items.length === 0 && !isLoading && (
        <p>Nenhum item encontrado</p>
      )}
    </div>
  );
}

// ================================
// COMPONENTE PRINCIPAL
// ================================

export function HookExamples() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Advanced Utility Hooks - Exemplos</h1>
      
      <FormValidationExample />
      <hr />
      
      <PerformanceExample />
      <hr />
      
      <StorageExample />
      <hr />
      
      <ObservabilityExample />
      <hr />
      
      <VirtualScrollingExample />
      <hr />
      
      <InfiniteScrollExample />
    </div>
  );
}

export default HookExamples;