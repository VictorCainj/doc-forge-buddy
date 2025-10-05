# 🚀 Guia de Otimizações e Prevenção de Bugs

## 📋 Índice
1. [Error Boundaries](#error-boundaries)
2. [Memory Leaks](#memory-leaks)
3. [Type Safety](#type-safety)
4. [Performance](#performance)
5. [Validações](#validações)
6. [Logging e Monitoramento](#logging)

---

## 🛡️ 1. ERROR BOUNDARIES

### **Problema Atual**
- Sem tratamento de erros em nível de componente
- Erros podem quebrar toda a aplicação
- Usuário não recebe feedback adequado

### **Solução: Implementar Error Boundary**

**Criar:** `src/components/ErrorBoundary.tsx`
```tsx
import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Enviar para serviço de logging (Sentry, LogRocket, etc)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'Erro desconhecido'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Uso em App.tsx:**
```tsx
<ErrorBoundary>
  <Routes>
    {/* rotas */}
  </Routes>
</ErrorBoundary>
```

---

## 🔒 2. MEMORY LEAKS

### **Problemas Identificados**

#### **A. Listeners não removidos**
```tsx
// ❌ PROBLEMA
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Falta cleanup!
}, []);

// ✅ SOLUÇÃO
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

#### **B. Timers não cancelados**
```tsx
// ❌ PROBLEMA
useEffect(() => {
  setTimeout(() => setShowDadosVistoria(false), 2000);
  // Timer continua mesmo após unmount
}, []);

// ✅ SOLUÇÃO
useEffect(() => {
  const timer = setTimeout(() => setShowDadosVistoria(false), 2000);
  return () => clearTimeout(timer);
}, []);
```

#### **C. Subscriptions do Supabase**
```tsx
// ❌ PROBLEMA
const channel = supabase.channel('changes');
// Não remove subscription

// ✅ SOLUÇÃO
useEffect(() => {
  const channel = supabase.channel('changes')
    .on('postgres_changes', { ... }, handleChange)
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 🔐 3. TYPE SAFETY

### **A. Type Guards para Dados do Supabase**

**Criar:** `src/utils/typeGuards.ts`
```tsx
import { VistoriaAnaliseWithImages } from '@/types/vistoria';
import { Prestador } from '@/hooks/usePrestadores';

export function isValidAnalise(data: unknown): data is VistoriaAnaliseWithImages {
  if (!data || typeof data !== 'object') return false;
  
  const analise = data as Partial<VistoriaAnaliseWithImages>;
  
  return (
    typeof analise.id === 'string' &&
    typeof analise.title === 'string' &&
    analise.dados_vistoria !== undefined &&
    Array.isArray(analise.apontamentos)
  );
}

export function isValidPrestador(data: unknown): data is Prestador {
  if (!data || typeof data !== 'object') return false;
  
  const prestador = data as Partial<Prestador>;
  
  return (
    typeof prestador.id === 'string' &&
    typeof prestador.nome === 'string'
  );
}

// Uso
const data = await supabase.from('vistoria_analises').select();
if (data.data && isValidAnalise(data.data[0])) {
  // TypeScript sabe que é VistoriaAnaliseWithImages
  setAnalise(data.data[0]);
}
```

### **B. Validação de Props com Zod**

```tsx
import { z } from 'zod';

const PrestadorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
});

// Uso no formulário
const handleSubmit = (data: CreatePrestadorData) => {
  try {
    const validated = PrestadorSchema.parse(data);
    await createPrestador(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Mostrar erros de validação
      error.errors.forEach(err => {
        toast({ title: err.message, variant: 'destructive' });
      });
    }
  }
};
```

---

## ⚡ 4. PERFORMANCE

### **A. Lazy Loading de Rotas**

```tsx
// App.tsx
import { lazy, Suspense } from 'react';

const AnaliseVistoria = lazy(() => import('@/pages/AnaliseVistoria'));
const VistoriaAnalises = lazy(() => import('@/pages/VistoriaAnalises'));
const Prestadores = lazy(() => import('@/pages/Prestadores'));

// Uso
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/analise-vistoria" element={<AnaliseVistoria />} />
    <Route path="/vistoria-analises" element={<VistoriaAnalises />} />
    <Route path="/prestadores" element={<Prestadores />} />
  </Routes>
</Suspense>
```

### **B. Virtualização de Listas Grandes**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedAnalisesList({ analises }: { analises: VistoriaAnalise[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: analises.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <AnaliseCard analise={analises[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **C. Debounce em Buscas**

```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setSearchTerm(value);
  },
  300 // 300ms delay
);

<Input
  onChange={(e) => debouncedSearch(e.target.value)}
  placeholder="Buscar..."
/>
```

### **D. Memoização de Cálculos Pesados**

```tsx
// ✅ Memoizar cálculos complexos
const totalOrcamento = useMemo(() => {
  return apontamentos.reduce((total, apt) => {
    return total + (apt.valor || 0) * (apt.quantidade || 0);
  }, 0);
}, [apontamentos]);

// ✅ Memoizar filtros
const filteredAnalises = useMemo(() => {
  return analises.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [analises, searchTerm]);
```

---

## ✅ 5. VALIDAÇÕES

### **A. Validação de Upload de Imagens**

```tsx
const validateImage = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return 'Formato não suportado. Use JPEG, PNG ou WebP.';
  }
  
  if (file.size > maxSize) {
    return 'Imagem muito grande. Máximo 5MB.';
  }
  
  return null;
};

// Uso
const handleFileUpload = (files: FileList) => {
  Array.from(files).forEach(file => {
    const error = validateImage(file);
    if (error) {
      toast({ title: error, variant: 'destructive' });
      return;
    }
    // Processar imagem
  });
};
```

### **B. Validação de Dados do Contrato**

```tsx
const validateContractData = (contract: Contract): boolean => {
  const required = ['numeroContrato', 'nomeLocatario', 'enderecoImovel'];
  
  for (const field of required) {
    if (!contract.form_data[field]) {
      toast({
        title: 'Dados incompletos',
        description: `Campo ${field} é obrigatório`,
        variant: 'destructive',
      });
      return false;
    }
  }
  
  return true;
};
```

---

## 📊 6. LOGGING E MONITORAMENTO

### **A. Sistema de Logs Estruturado**

**Criar:** `src/utils/logger.ts`
```tsx
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    this.logs.push(entry);
    
    // Limitar tamanho do array
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console em desenvolvimento
    if (import.meta.env.DEV) {
      const style = {
        debug: 'color: gray',
        info: 'color: blue',
        warn: 'color: orange',
        error: 'color: red',
      }[level];
      
      console.log(`%c[${level.toUpperCase()}] ${message}`, style, context);
    }

    // Enviar para serviço externo em produção
    if (import.meta.env.PROD && level === 'error') {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Integrar com Sentry, LogRocket, etc
    // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
```

### **B. Monitoramento de Performance**

```tsx
// Hook para medir performance
function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) { // Mais de 100ms
        logger.warn(`Componente lento: ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
        });
      }
    };
  });
}

// Uso
function AnaliseVistoria() {
  usePerformanceMonitor('AnaliseVistoria');
  // ...
}
```

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### **Alta Prioridade** 🔴
1. ✅ Error Boundary (previne crashes)
2. ✅ Cleanup de useEffect (previne memory leaks)
3. ✅ Type Guards (previne erros de runtime)
4. ✅ Validação de imagens (previne uploads inválidos)

### **Média Prioridade** 🟡
5. ✅ Lazy Loading de rotas (melhora performance inicial)
6. ✅ Debounce em buscas (reduz chamadas desnecessárias)
7. ✅ Logging estruturado (facilita debugging)

### **Baixa Prioridade** 🟢
8. ✅ Virtualização de listas (só se listas > 100 itens)
9. ✅ Validação com Zod (melhoria incremental)
10. ✅ Monitoramento de performance (otimização avançada)

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Adicionar ErrorBoundary em App.tsx
- [ ] Revisar todos os useEffect e adicionar cleanup
- [ ] Criar type guards para dados do Supabase
- [ ] Implementar validação de upload de imagens
- [ ] Adicionar lazy loading nas rotas
- [ ] Implementar debounce nas buscas
- [ ] Configurar sistema de logging
- [ ] Adicionar validação com Zod nos formulários
- [ ] Implementar virtualização se necessário
- [ ] Configurar monitoramento de performance
