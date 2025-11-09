# 📦 Advanced Utility Hooks - Estrutura do Projeto

Esta biblioteca contém hooks utilitários avançados para React/TypeScript, organizados em categorias para facilitar o desenvolvimento de aplicações robustas e performáticas.

## 🗂️ Estrutura de Arquivos

```
advanced-utility-hooks/
├── 📄 index.ts                    # Exportação principal de todos os hooks
├── 📄 package.json                # Configurações do pacote NPM
├── 📄 tsconfig.json               # Configurações do TypeScript
├── 📄 README.md                   # Documentação completa
├── 📄 examples.tsx                # Exemplos práticos de uso
├── 📄 hooks.test.ts              # Testes unitários
│
├── 🔍 Validação/
│   ├── 📄 useFormValidation.ts    # Validação de formulários com Zod
│   └── 📄 useAsyncValidation.ts   # Validação assíncrona com debounce
│
├── ⚡ Performance/
│   ├── 📄 useDebounce.ts          # Debounce de valores
│   └── 📄 useThrottle.ts          # Throttle de valores
│
├── 💾 Armazenamento/
│   ├── 📄 useLocalStorage.ts      # Gerenciamento de localStorage
│   └── 📄 useSessionStorage.ts    # Gerenciamento de sessionStorage
│
├── 👁️ Observabilidade/
│   ├── 📄 useIntersectionObserver.ts # Observação de elementos no viewport
│   └── 📄 useResizeObserver.ts    # Observação de redimensionamento
│
└── 🚀 Performance - Listas/
    ├── 📄 useVirtualScrolling.ts  # Virtualização de listas grandes
    └── 📄 useInfiniteScroll.ts    # Scroll infinito automático
```

## 🎯 Categorias de Hooks

### 1. **Validação** (Validation)
- **useFormValidation**: Validação de formulários em tempo real com Zod
- **useAsyncValidation**: Validação assíncrona com debounce e error handling

### 2. **Performance** (Performance)
- **useDebounce**: Debounce de valores para evitar re-renderizações frequentes
- **useThrottle**: Throttle para limitar a frequência de execução

### 3. **Armazenamento** (Storage)
- **useLocalStorage**: Gerenciamento de localStorage com sincronização automática
- **useSessionStorage**: Gerenciamento de sessionStorage para dados temporários

### 4. **Observabilidade** (Observability)
- **useIntersectionObserver**: Observação de elementos no viewport
- **useResizeObserver**: Observação de mudanças de tamanho de elementos

### 5. **Performance - Listas** (List Performance)
- **useVirtualScrolling**: Virtualização de listas grandes
- **useInfiniteScroll**: Scroll infinito com carregamento automático

## 🛠️ Características Técnicas

### ✅ **TypeScript Completo**
- Tipos genericos para flexibilidade
- Interfaces bem definidas
- JSDoc detalhado
- Strict mode habilitado

### ✅ **Performance Otimizada**
- Memoização inteligente
- Debounce e throttle nativos
- IntersectionObserver para lazy loading
- Virtual scrolling para listas grandes

### ✅ **Error Handling Robusto**
- Try-catch em operações críticas
- Fallbacks para valores iniciais
- Error states em todos os hooks
- Logging de erros

### ✅ **Memory Management**
- Cleanup automático de timeouts
- AbortController para cancelamento
- IntersectionObserver cleanup
- Event listener removal

### ✅ **Developer Experience**
- API consistente entre hooks
- Loading states padronizados
- Error states informativos
- Documentação completa

## 🚀 Como Usar

### Instalação
```bash
npm install zod
npm install advanced-utility-hooks
```

### Importação
```typescript
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
} from 'advanced-utility-hooks';
```

### Exemplo Rápido
```typescript
import { useFormValidation } from 'advanced-utility-hooks';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

function MyForm() {
  const { data, errors, isValid, setField, validateForm } = 
    useFormValidation(schema, { email: '', name: '' });
  
  return (
    <form onSubmit={validateForm}>
      {/* Seus campos aqui */}
    </form>
  );
}
```

## 📊 Métricas de Qualidade

### ✅ **Testes**
- 100% de cobertura dos hooks principais
- Testes de integração
- Mock de APIs e storage
- Error handling testado

### ✅ **Documentação**
- README.md completo com exemplos
- JSDoc em todos os hooks
- Tipos TypeScript documentados
- Guia de melhores práticas

### ✅ **Performance**
- Bundle size otimizado
- Tree shaking habilitado
- Imports estáticos
- No side effects

## 🔧 Configuração de Desenvolvimento

### Scripts Disponíveis
```bash
npm run build          # Compilar TypeScript
npm run dev            # Compilação em watch mode
npm run lint           # Linting com ESLint
npm run test           # Executar testes
npm run type-check     # Verificação de tipos
```

### Dependências
```json
{
  "react": ">=16.8.0",
  "typescript": ">=4.1.0",
  "zod": ">=3.0.0"
}
```

## 🎉 Próximos Passos

1. **Publicar no NPM** para distribuição
2. **Adicionar mais hooks** baseados em feedback
3. **Criar Storybook** para documentação visual
4. **Implementar mais testes** de edge cases
5. **Adicionar hooks de rede** (fetch, axios)
6. **Hooks de accessibility** (focus, keyboard)

## 📝 Licença

MIT License - Livre para uso comercial e pessoal.

---

**Desenvolvido com ❤️ para a comunidade React/TypeScript**