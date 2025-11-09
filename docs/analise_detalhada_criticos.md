# Análise Detalhada dos Arquivos Mais Críticos

## 1. AnaliseVistoria.tsx (Complexidade: 478.7)

### Problemas Identificados
- **Tamanho:** 2516 linhas de código (2.5k LOC)
- **Responsabilidades:** Gerencia estado de vistoria, upload de imagens, IA, documentos
- **Pattern:** Componente "God Object" - faz tudo

### Lógica Complexa Encontrada
1. **Gerenciamento de Estado:**
   ```typescript
   // 50+ estados locais
   const [apontamentos, setApontamentos] = useState<ApontamentoVistoria[]>([]);
   const [currentApontamento, setCurrentApontamento] = useState<Partial<...>>();
   const [selectedImages, setSelectedImages] = useState<File[]>([]);
   // ... mais 47 estados similares
   ```

2. **Lógica de IA/Processamento:**
   ```typescript
   // Função com 28+ pontos de complexidade
   const apontamentosComFotos = useCallback(async () => {
     // 200+ linhas de lógica complexa
     // - Processamento de imagens
     // - Chamadas à IA
     // - Validações
     // - Transformação de dados
   }, [selectedImages, currentApontamento, /* ... 20+ deps */]);
   ```

3. **Renderização Condicional:**
   ```jsx
   // Múltiplos ternários aninhados
   {isLoading ? (
     <LoadingState />
   ) : error ? (
     <ErrorState message={error} />
   ) : !apontamentos.length ? (
     <EmptyState />
   ) : (
     <ApontamentosList apontamentos={apontamentos} />
   )}
   ```

### Estratégia de Refatoração
1. **Extrair Hooks Customizados:**
   ```typescript
   // useVistoriaState.ts - Gerenciar todo o estado
   // useImageProcessing.ts - Lógica de imagens
   // useAIPostProcessing.ts - IA e processamento
   ```

2. **Dividir em Sub-componentes:**
   ```typescript
   // VistoriaHeader.tsx
   // VistoriaForm.tsx
   // VistoriaResults.tsx
   // VistoriaActions.tsx
   ```

3. **Aplicar Strategy Pattern:**
   ```typescript
   interface VistoriaProcessor {
     process(): Promise<ProcessedData>;
   }
   
   class ImageProcessor implements VistoriaProcessor { ... }
   class TextProcessor implements VistoriaProcessor { ... }
   class CombinedProcessor implements VistoriaProcessor { ... }
   ```

**Esforço Estimado:** 40-50 horas

---

## 2. contractConjunctions.ts (Complexidade: 141.1)

### Problemas Identificados
- **Tamanho:** 569 linhas
- **Pattern:** Função única com 200+ if-else/ternary statements
- **Responsabilidade:** Aplica todas as regras de conjugação em um local

### Lógica Complexa
```typescript
// Exemplo da complexidade atual
if (generoLocatario === 'femininos') {
  // 15+ atribuições
  enhancedData.locatarioTerm = 'LOCATÁRIAS';
  enhancedData.locatarioTermComercial = 'locatárias';
  // ...
} else if (generoLocatario === 'masculinos') {
  // 15+ atribuições similares
} else if (generoLocatario === 'feminino') {
  // 15+ atribuições
} else if (generoLocatario === 'masculino') {
  // 15+ atribuições
}
// Total: 60+ linhas de atribuições repetitivas
```

### Estratégia de Refatoração
1. **Criar Mapeamentos:**
   ```typescript
   const CONJUGATION_MAP = {
     feminino: {
       singular: { /* mappings */ },
       plural: { /* mappings */ }
     },
     masculino: {
       singular: { /* mappings */ },
       plural: { /* mappings */ }
     }
   };
   ```

2. **Extrair Funções Específicas:**
   ```typescript
   function applyLocatarioConjugation(data: FormData, gender: Gender, count: number) {
     const conjugation = CONJUGATION_MAP[gender][count > 1 ? 'plural' : 'singular'];
     return { ...data, ...conjugation };
   }
   ```

3. **Usar Factory Pattern:**
   ```typescript
   class ConjugationFactory {
     static create(gender: Gender, count: number) {
       return new ConjugationStrategy(gender, count);
     }
   }
   ```

**Esforço Estimado:** 12-15 horas

---

## 3. responseGenerator.ts (Complexidade: 134.3)

### Problemas Identificados
- **Pattern:** Gerador de respostas com múltiplas estratégias
- **Lógica:** Switch/case complexa com 50+ casos

### Lógica Complexa
```typescript
switch (responseType) {
  case 'ANALYZE_PROPERTY':
    // 80+ linhas de lógica específica
    break;
  case 'GENERATE_DOCUMENT':
    // 60+ linhas diferentes
    break;
  case 'PROCESS_IMAGES':
    // 70+ linhas únicas
    break;
  // ... 47+ cases similares
}
```

### Estratégia de Refatoração
1. **Strategy Pattern:**
   ```typescript
   interface ResponseStrategy {
     generate(context: ResponseContext): Promise<Response>;
   }
   
   class AnalyzePropertyStrategy implements ResponseStrategy { ... }
   class GenerateDocumentStrategy implements ResponseStrategy { ... }
   ```

2. **Command Pattern:**
   ```typescript
   class ResponseCommand {
     constructor(private strategy: ResponseStrategy) {}
     execute(context: Context): Response { ... }
   }
   ```

**Esforço Estimado:** 15-20 horas

---

## 4. useVistoriaAnalises.tsx (Complexidade: 128.5)

### Problemas Identificados
- **Pattern:** Hook com 50+ responsabilidades
- **Estados:** 25+ useState diferentes
- **Efeitos:** 15+ useEffect aninhados

### Lógica Complexa
```typescript
// Hooks aninhados complexos
const {
  data: analysisData,
  isLoading,
  error,
  refetch,
  // 20+ propriedades similares
} = useQuery({
  queryKey: ['vistoria-analises', contractId, /* ... */],
  queryFn: () => processAnalysis(/* ... */),
  enabled: Boolean(contractId) && /* 5+ condições */,
  staleTime: /* ... */,
  gcTime: /* ... */,
  retry: /* ... */,
});

const processedData = useMemo(() => {
  // 100+ linhas de processamento
}, [analysisData, selectedImages, /* 10+ deps */]);
```

### Estratégia de Refatoração
1. **Dividir em Hooks Menores:**
   ```typescript
   // useVistoriaQuery.ts - Só a query
   // useVistoriaProcessing.ts - Só processamento
   // useVistoriaImages.ts - Só imagens
   ```

2. **Custom Hook Composition:**
   ```typescript
   function useVistoriaAnalises(contractId: string) {
     const query = useVistoriaQuery(contractId);
     const processing = useVistoriaProcessing(query.data);
     const images = useVistoriaImages(processing.data);
     
     return {
       data: images.data,
       isLoading: query.isLoading || processing.isLoading || images.isLoading,
       // ...
     };
   }
   ```

**Esforço Estimado:** 20-25 horas

---

## 5. Contratos.tsx (Complexidade: 127.3)

### Problemas Identificados
- **Tamanho:** 804 linhas
- **Lógica:** Filtros, busca, exportação, favoritos tudo em um componente
- **Pattern:** Página que é ao mesmo tempo controller e view

### Lógica Complexa
```typescript
// Filtros complexos
const filteredContracts = useMemo(() => {
  return contracts
    .filter(/* 10+ condições */)
    .sort(/* 5+ critérios */)
    .filter(/* mais 5 condições */);
}, [contracts, selectedMonth, selectedYear, /* ... */]);

// Handler complexo
const handleExport = useCallback(async () => {
  // 150+ linhas de lógica de exportação
  // - Validações
  // - Processamento de dados
  // - Geração de Excel
  // - Download
}, [filteredContracts, exportFormat, /* ... */]);
```

### Estratégia de Refatoração
1. **Extrair Hooks:**
   ```typescript
   // useContractFilters.ts
   // useContractExport.ts
   // useContractFavorites.ts
   ```

2. **Dividir Componentes:**
   ```typescript
   // ContractFilters.tsx
   // ContractList.tsx
   // ContractActions.tsx
   // ContractExport.tsx
   ```

3. **Page Controller Pattern:**
   ```typescript
   // ContratosPage.tsx - Só orquestração
   // ContractListPage.tsx - Lista principal
   // ContractDetailPage.tsx - Detalhes
   ```

**Esforço Estimado:** 25-30 horas

---

## Padrões Recorrentes e Soluções

### 1. Estado Local Excesivo
**Problema:** Componentes com 20+ useState
**Solução:** 
- Consolidar em useReducer
- Extrair para hooks customizados
- Usar Context API quando apropriado

### 2. Lógica de Renderização Complexa
**Problema:** JSX com 10+ ternários aninhados
**Solução:**
- Early returns
- Componentes de renderização
- Switch de renderização

### 3. Funções "God"
**Problema:** Uma função faz 10+ coisas diferentes
**Solução:**
- Single Responsibility Principle
- Strategy Pattern
- Chain of Responsibility

### 4. Props Drilling
**Problema:** Props passadas por 5+ níveis
**Solução:**
- Context API
- Custom hooks
- State management library

---

## Cronograma de Refatoração Sugerido

### Semana 1-2: Arquivos Críticos
- [x] AnaliseVistoria.tsx (50h)
- [x] contractConjunctions.ts (15h)
- [x] responseGenerator.ts (20h)

### Semana 3-4: Hooks Customizados
- [x] useVistoriaAnalises.tsx (25h)
- [x] useOptimizedChat.tsx (20h)
- [x] useAIMemory.tsx (15h)

### Semana 5-6: Páginas Principais
- [x] Contratos.tsx (30h)
- [x] AnaliseVistoria.tsx (refinamento)
- [x] Prestadores.tsx (25h)

### Semana 7-8: Componentes
- [x] LazyComponents.tsx (15h)
- [x] form-field.tsx (20h)
- [x] ContractWizardModal.tsx (15h)

**Total: 275 horas (7-8 semanas)**

---

## Métricas de Sucesso

### Antes da Refatoração
- Complexidade média: 22.9
- Arquivos críticos (>50): 26
- Tempo médio de entendimento: 4-6 horas/arquivo

### Depois da Refatoração
- Complexidade média: <15
- Arquivos críticos: 0-3
- Tempo médio de entendimento: 1-2 horas/arquivo

### Indicadores de Qualidade
- [ ] Nenhuma função > 100 linhas
- [ ] Nenhum componente > 200 linhas
- [ ] Máx 3 níveis de aninhamento
- [ ] 80%+ cobertura de testes
- [ ] Review time < 1 hora/arquivo
