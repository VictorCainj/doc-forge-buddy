# Advanced Utility Hooks

Uma biblioteca completa de hooks utilitários avançados para React/TypeScript, focada em lógica de negócio comum e performance.

## 📦 Instalação

```bash
npm install zod
# ou
yarn add zod
# ou
pnpm add zod
```

## 🎣 Hooks Disponíveis

### 🔍 Validação

#### `useFormValidation<T>`
Hook para validação de formulários em tempo real usando Zod.

```typescript
import { useFormValidation } from 'advanced-utility-hooks';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  age: z.number().min(18, 'Deve ter pelo menos 18 anos'),
});

const { 
  data, 
  errors, 
  isValid, 
  setField, 
  validateField, 
  validateForm,
  getFieldError 
} = useFormValidation(schema, {
  email: '',
  name: '',
  age: 0,
});
```

#### `useAsyncValidation<T>`
Hook para validação assíncrona com debounce.

```typescript
import { useAsyncValidation } from 'advanced-utility-hooks';

// Validação de email único via API
const { isValidating, isValid, error, validate } = useAsyncValidation<string>(
  async (email) => {
    const response = await fetch(`/api/check-email?email=${email}`);
    return response.json().then(data => !data.exists);
  },
  500 // delay de 500ms
);

// Uso
const handleEmailChange = (email: string) => {
  setEmail(email);
  validate(email); // Validação automática com debounce
};
```

### ⚡ Performance

#### `useDebounce<T>`
Debounce de valores para evitar re-renderizações frequentes.

```typescript
import { useDebounce } from 'advanced-utility-hooks';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    // Busca será executada apenas após 300ms de inatividade
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);
}
```

#### `useThrottle<T>`
Throttle para limitar a frequência de execução.

```typescript
import { useThrottle } from 'advanced-utility-hooks';

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);
  
  useEffect(() => {
    // Atualização limitada a cada 100ms
    updateScrollIndicator(throttledScrollY);
  }, [throttledScrollY]);
}
```

### 💾 Armazenamento

#### `useLocalStorage<T>`
Gerenciamento de localStorage com sincronização automática.

```typescript
import { useLocalStorage } from 'advanced-utility-hooks';

function UserSettings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'pt-BR');
  
  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>
    </div>
  );
}
```

#### `useSessionStorage<T>`
Gerenciamento de sessionStorage para dados temporários.

```typescript
import { useSessionStorage } from 'advanced-utility-hooks';

function FormDraft() {
  const [draft, setDraft] = useSessionStorage('form-draft', {
    name: '',
    email: '',
    message: '',
  });
  
  // Dados são limpos ao fechar a aba
}
```

### 👁️ Observabilidade

#### `useIntersectionObserver`
Observar elementos no viewport para lazy loading, animações, etc.

```typescript
import { useIntersectionObserver } from 'advanced-utility-hooks';

function LazyImage({ src, alt }) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });
  
  return (
    <div ref={ref}>
      {isIntersecting && <img src={src} alt={alt} />}
    </div>
  );
}
```

#### `useResizeObserver`
Observar mudanças de tamanho de elementos.

```typescript
import { useResizeObserver } from 'advanced-utility-hooks';

function ResizableComponent() {
  const { ref, bounds, isResizing } = useResizeObserver();
  
  return (
    <div ref={ref}>
      <p>Dimensões: {bounds.width} x {bounds.height}</p>
      {isResizing && <p>Redimensionando...</p>}
    </div>
  );
}
```

### 🚀 Performance - Listas

#### `useVirtualScrolling<T>`
Virtualização de listas grandes para otimizar performance.

```typescript
import { useVirtualScrolling } from 'advanced-utility-hooks';

function VirtualizedList({ items }) {
  const {
    visibleItems,
    startIndex,
    containerStyle,
  } = useVirtualScrolling(items, {
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5,
  });
  
  return (
    <div style={containerStyle}>
      <div style={{ height: visibleItems.length * 50 }}>
        {visibleItems.map((item, index) => (
          <div key={startIndex + index} style={{ height: 50 }}>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `useInfiniteScroll<T>`
Scroll infinito com carregamento automático.

```typescript
import { useInfiniteScroll } from 'advanced-utility-hooks';

function InfiniteList() {
  const {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useInfiniteScroll(
    async () => {
      const response = await fetch(`/api/items?page=${currentPage}`);
      return response.json();
    },
    {
      initialItems: [],
      threshold: 200,
    }
  );
  
  return (
    <div>
      {items.map(item => <ItemComponent key={item.id} item={item} />)}
      
      {error && <div>Erro: {error}</div>}
      {isLoading && <div>Carregando...</div>}
      
      {/* Sentinel para trigger do scroll infinito */}
      <div ref={sentinelRef} />
    </div>
  );
}
```

## 🛠️ Características

### Performance
- Debounce e throttle otimizados
- Virtual scrolling para listas grandes
- IntersectionObserver para lazy loading
- Memoização inteligente

### Experiência do Desenvolvedor
- Tipos TypeScript completos
- Error handling robusto
- Loading states
- Cleanup automático

### Robustez
- Cancelamento de requests
- AbortController para validações
- Storage com fallback
- Error boundaries

## 📋 Tipos

Todos os hooks são totalmente tipados e incluem:

- **Tipos de retorno** claros
- **Interfaces** bem definidas
- **Generics** para flexibilidade
- **JSDoc** completo

## 🔧 Configuração

### Requisitos
- React 16.8+
- TypeScript 4.1+
- Zod (para validação)

### Peer Dependencies
```json
{
  "react": ">=16.8.0",
  "typescript": ">=4.1.0",
  "zod": ">=3.0.0"
}
```

## 📝 Exemplos Avançados

### Formulário Completo
```typescript
import { useFormValidation, useDebounce } from 'advanced-utility-hooks';

function AdvancedForm() {
  const form = useFormValidation(schema, initialData);
  const debouncedValidation = useDebounce(form.data, 500);
  
  useEffect(() => {
    // Validação automática com debounce
    if (debouncedValidation.email) {
      form.validateForm();
    }
  }, [debouncedValidation]);
  
  return (
    <form onSubmit={form.validateForm}>
      {/* Campos do formulário */}
    </form>
  );
}
```

### Lista com Performance
```typescript
import { 
  useVirtualScrolling, 
  useInfiniteScroll, 
  useIntersectionObserver 
} from 'advanced-utility-hooks';

function HighPerformanceList() {
  const { items, loadMore, hasMore, isLoading } = useInfiniteScroll(fetchItems);
  const { visibleItems, containerStyle } = useVirtualScrolling(items, {
    itemHeight: 60,
    containerHeight: 500,
  });
  
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });
  
  return (
    <div ref={ref} style={containerStyle}>
      {visibleItems.map(item => <Item key={item.id} {...item} />)}
      {isIntersecting && hasMore && !isLoading && loadMore()}
    </div>
  );
}
```

## 📚 Documentação

Cada hook inclui:
- ✅ JSDoc completo
- ✅ Exemplos de uso
- ✅ Tipos detalhados
- ✅ Error handling
- ✅ Performance considerations

## 🤝 Contribuição

Para contribuir:
1. Fork o projeto
2. Crie uma feature branch
3. Implemente testes
4. Atualize a documentação
5. Abra um PR

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.