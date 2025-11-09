# Análise de Dependências - Doc Forge Buddy

## Resumo Executivo

- **Total de arquivos analisados:** 419
- **Total de dependências encontradas:** 850
- **Dependências circulares:** 2
- **Arquivos com imports não utilizados:** 0

## 1. Dependências Circulares

### Ciclo 1
- `integrations/supabase/client.ts`
- `integrations/supabase/client.ts`

### Ciclo 2
- `hooks/usePrestadores.tsx`
- `utils/typeGuards.ts`
- `hooks/usePrestadores.tsx`


## 2. Componentes Mais Acoplados (Top 10)

### 1. `pages/Contratos.tsx`
- **Tipo:** page
- **Dependências:** 22
- **Dependentes:** 1

### 2. `pages/AnaliseVistoria.tsx`
- **Tipo:** page
- **Dependências:** 18
- **Dependentes:** 1

### 3. `utils/prefetchRoutes.ts`
- **Tipo:** util
- **Dependências:** 18
- **Dependentes:** 1

### 4. `pages/Tarefas.tsx`
- **Tipo:** page
- **Dependências:** 17
- **Dependentes:** 1

### 5. `components/performance/LazyComponents.tsx`
- **Tipo:** component
- **Dependências:** 15
- **Dependentes:** 0

### 6. `App.tsx`
- **Tipo:** other
- **Dependências:** 13
- **Dependentes:** 0

### 7. `pages/DashboardDesocupacao.tsx`
- **Tipo:** page
- **Dependências:** 13
- **Dependentes:** 1

### 8. `components/modals/DocumentForm.tsx`
- **Tipo:** component
- **Dependências:** 12
- **Dependentes:** 2

### 9. `components/admin/VistoriaAnalisesPanel.tsx`
- **Tipo:** component
- **Dependências:** 10
- **Dependentes:** 1

### 10. `features/contracts/components/ContractWizardModal.tsx`
- **Tipo:** feature
- **Dependências:** 9
- **Dependentes:** 0


## 3. Estatísticas por Tipo de Componente

### Other
- **Quantidade:** 24
- **Dependências médias:** 1.0
- **Dependentes médios:** 5.8

### Feature
- **Quantidade:** 96
- **Dependências médias:** 2.0
- **Dependentes médios:** 0.1

### Hook
- **Quantidade:** 62
- **Dependências médias:** 1.8
- **Dependentes médios:** 1.3

### Util
- **Quantidade:** 78
- **Dependências médias:** 0.7
- **Dependentes médios:** 2.7

### Component
- **Quantidade:** 116
- **Dependências médias:** 2.6
- **Dependentes médios:** 3.3

### Type
- **Quantidade:** 21
- **Dependências médias:** 0.0
- **Dependentes médios:** 0.2

### Page
- **Quantidade:** 22
- **Dependências médias:** 7.1
- **Dependentes médios:** 0.8


## 4. Imports Não Utilizados

✅ Nenhum import não utilizado detectado!

## 5. Candidatos a Lazy Loading

### 1. `pages/Contratos.tsx`
- **Tipo:** page
- **Dependências:** 22 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 2. `pages/AnaliseVistoria.tsx`
- **Tipo:** page
- **Dependências:** 18 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 3. `pages/Tarefas.tsx`
- **Tipo:** page
- **Dependências:** 17 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 4. `pages/DashboardDesocupacao.tsx`
- **Tipo:** page
- **Dependências:** 13 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 5. `features/contracts/components/ContractWizardModal.tsx`
- **Tipo:** feature
- **Dependências:** 9 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 6. `pages/Admin.tsx`
- **Tipo:** page
- **Dependências:** 9 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 7. `pages/TermoLocatario.tsx`
- **Tipo:** page
- **Dependências:** 8 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 8. `features/contracts/components/ContractList.tsx`
- **Tipo:** feature
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 9. `features/prompt/components/PromptTemplates.tsx`
- **Tipo:** feature
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 10. `features/prompt/components/VisualPromptBuilder.tsx`
- **Tipo:** feature
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 11. `features/vistoria/components/steps/Step3Apontamentos.tsx`
- **Tipo:** feature
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 12. `pages/DocumentoPublico.tsx`
- **Tipo:** page
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 13. `pages/Notificacoes.tsx`
- **Tipo:** page
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 14. `pages/Prestadores.tsx`
- **Tipo:** page
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 15. `pages/Prompt.tsx`
- **Tipo:** page
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 16. `pages/TermoRecusaAssinaturaEmail.tsx`
- **Tipo:** page
- **Dependências:** 7 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 17. `features/analise-vistoria/components/ContractInfoCard.tsx`
- **Tipo:** feature
- **Dependências:** 6 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 18. `features/contracts/components/ContractTags.tsx`
- **Tipo:** feature
- **Dependências:** 6 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 19. `features/vistoria/components/ApontamentoForm.tsx`
- **Tipo:** feature
- **Dependências:** 6 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting

### 20. `pages/ForgotPassword.tsx`
- **Tipo:** page
- **Dependências:** 6 (ideal para lazy loading)
- **Justificativa:** Componente com muitas dependências pode se beneficiar de code splitting


## 6. Recomendações para Redução de Acoplamento

### Prioritárias
1. **`pages/Contratos.tsx`** - 22 dependências
   - Extrair responsabilidades para módulos menores
   - Implementar interface para reduzir dependências diretas
   - Considerar lazy loading para reduzir acoplamento inicial
2. **`pages/AnaliseVistoria.tsx`** - 18 dependências
   - Extrair responsabilidades para módulos menores
   - Implementar interface para reduzir dependências diretas
   - Considerar lazy loading para reduzir acoplamento inicial
3. **`utils/prefetchRoutes.ts`** - 18 dependências
   - Extrair responsabilidades para módulos menores
   - Implementar interface para reduzir dependências diretas
   - Considerar lazy loading para reduzir acoplamento inicial
4. **`pages/Tarefas.tsx`** - 17 dependências
   - Extrair responsabilidades para módulos menores
   - Implementar interface para reduzir dependências diretas
   - Considerar lazy loading para reduzir acoplamento inicial

### Gerais
1. **Modularização:** Separar responsabilidades em módulos menores
2. **Dependency Injection:** Usar DI para reduzir acoplamento direto
3. **Event-driven Architecture:** Usar eventos para comunicação entre componentes
4. **Custom Hooks:** Extrair lógica de estado em hooks customizados
5. **Context API:** Usar Context para estado global ao invés de props drilling

## 7. Sugestões de Code Splitting

### Por Feature
- **Documentos:** `/pages/documentos`
- **Vistorias:** `/pages/vistoria`
- **Contratos:** `/pages/contratos`
- **Chat:** `/pages/chat`
- **Admin:** `/pages/admin`

### Por Componente
- **Componentes grandes (>100 linhas)**
- **Componentes com muitas dependências (>10)**
- **Bibliotecas de terceiros pesadas**

### Implementação Sugerida
```typescript
// Lazy loading por rota
const Documentos = lazy(() => import('./pages/documentos'));
const Vistoria = lazy(() => import('./pages/vistoria'));

// Lazy loading por componente
const HeavyComponent = lazy(() => 
  import('./components/HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
```

## 8. Arquitetura Recomendada

```
src/
├── features/          # Features isoladas
│   ├── documentos/    # Feature documentos
│   ├── vistoria/      # Feature vistoria
│   └── contratos/     # Feature contratos
├── shared/            # Código compartilhado
│   ├── components/    # Componentes reutilizáveis
│   ├── hooks/         # Hooks customizados
│   ├── utils/         # Utilitários
│   └── types/         # Tipos globais
├── pages/             # Páginas (lazy loaded)
└── app/               # Configuração da aplicação
```

## 9. Análise de Dependências por Feature

### Documentos
- **Arquivos principais:** documents/, document-upload/
- **Dependências externas:** Supabase, docx, exceljs
- **Candidatos a lazy loading:** DocumentUpload, DocumentList

### Vistoria
- **Arquivos principais:** vistoria/, inspection/
- **Dependências externas:** Supabase, react-hook-form
- **Candidatos a lazy loading:** InspectionForm, InspectionList

### Contratos
- **Arquivos principais:** contracts/, contract/
- **Dependências externas:** Supabase
- **Candidatos a lazy loading:** ContractEditor, ContractViewer

### Chat
- **Arquivos principais:** chat/, messaging/
- **Dependências externas:** Supabase Realtime
- **Candidatos a lazy loading:** ChatRoom, MessageList

### Admin
- **Arquivos principais:** admin/, management/
- **Dependências externas:** Multiple UI libraries
- **Candidatos a lazy loading:** AdminPanel, UserManagement

## 10. Métricas de Acoplamento

### Níveis de Acoplamento
- **Baixo (1-5 deps):** ✅ Componentes bem modularizados
- **Médio (6-10 deps):** ⚠️  Aceptável, monitorar
- **Alto (11-15 deps):** 🔥  Requer refatoração
- **Crítico (>15 deps):** 🚨  Reestruturação urgente

### Componentes Críticos
1. `pages/Contratos.tsx` - 22 dependências (CRÍTICO)
2. `pages/AnaliseVistoria.tsx` - 18 dependências (CRÍTICO)
3. `utils/prefetchRoutes.ts` - 18 dependências (CRÍTICO)
4. `pages/Tarefas.tsx` - 17 dependências (CRÍTICO)

---
*Relatório gerado automaticamente em 08/11/2025, 22:02:16*
