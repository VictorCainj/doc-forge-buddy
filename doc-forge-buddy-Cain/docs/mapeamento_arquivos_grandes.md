# Mapeamento de Arquivos Grandes e Estrutura do Projeto

## Resumo Executivo

Este relatório identifica arquivos problemáticos que violam o Single Responsibility Principle (SRP) e propõe um plano de refatoração estruturado. Foram identificados **20 arquivos com mais de 500 linhas**, sendo **7 críticos com mais de 1000 linhas** que requerem refatoração imediata.

## ✅ Boas Práticas Já Implementadas

O projeto já demonstra **excelentes práticas** em algumas áreas:

### Estrutura de Features Bem Organizada
- `src/features/analise-vistoria/` - Componentes já bem divididos (AIExtractionPanel: 113 linhas)
- `src/features/contracts/` - Estrutura modular para contratos
- `src/features/prompt/` - Organização clara para sistema de prompts
- `src/features/documents/` - Componentes de documento separados

### Contextos Bem Dimensionados
- `AnaliseVistoriaContext.tsx` - 233 linhas (tamanho adequado)
- Gerenciamento de estado centralizado e focado

### Componentes UI Reutilizáveis
- Estrutura bem definida em `src/components/ui/`
- Sistema de design consistente

**Foco da Refatoração:** Aproveitar essas boas práticas e aplicá-las aos arquivos problemáticos identificados.

## 📊 Arquivos Críticos (> 1000 linhas) - REFATORAÇÃO IMEDIATA

### 1. **AnaliseVistoria.tsx** - 3,067 linhas 🔴 CRÍTICO
**Localização:** `src/pages/AnaliseVistoria.tsx`  
**Problema:** Monstro monolítico que combina múltiplas responsabilidades
**Responsabilidades Violadas:**
- ✅ Gerenciamento de estado de formulários complexos
- ✅ Integração com APIs de IA (OpenAI)
- ✅ Manipulação de imagens e upload
- ✅ Geração de documentos e relatórios
- ✅ Lógica de negócio de vistoria
- ✅ Interface de usuário completa
- ✅ Validação de dados
- ✅ Gerenciamento de contratos
- ✅ Fluxo de orçamento

**Plano de Divisão (Aproveitando Estrutura Existente):**
```
src/features/analise-vistoria/ (JÁ EXISTE - APROVEITAR!)
├── components/ (JÁ EXISTE - EXPANDIR)
│   ├── AnaliseVistoriaPage.tsx (NOVA - COORDENADOR - 50-100 linhas)
│   ├── FormSection.tsx (NOVA - UI do formulário)
│   ├── ImageUploadSection.tsx (NOVA - upload e manipulação)
│   ├── ApontamentosSection.tsx (EXPANDIR apontamentosSummary.tsx)
│   ├── DocumentPreview.tsx (EXPANDIR documentPreviewCard.tsx)
│   ├── AIExtractionSection.tsx (EXPANDIR aiExtractionPanel.tsx)
│   ├── ContractSelector.tsx (EXPANDIR contractInfoCard.tsx)
│   ├── BudgetSection.tsx (NOVA - orçamento)
│   └── SaveActions.tsx (NOVA - ações de salvar)
├── hooks/ (EXPANDIR ESTRUTURA EXISTENTE)
│   ├── useAnaliseVistoriaState.ts (NOVO - estado principal)
│   ├── useImageProcessing.ts (NOVO - imagens)
│   ├── useAIExtraction.ts (NOVO - IA)
│   ├── useDocumentGeneration.ts (NOVO - geração docs)
│   ├── useApontamentos.ts (EXPANDIR useApontamentosManager.ts)
│   └── useContractManagement.ts (NOVO - contratos)
├── context/ (JÁ EXISTE - SIMPLIFICAR)
│   └── AnaliseVistoriaContext.tsx (REDUZIR para 100-150 linhas)
├── types/ (EXPANDIR ESTRUTURA EXISTENTE)
│   ├── analise-vistoria.types.ts (EXPANDIR)
│   ├── form.types.ts (NOVO)
│   ├── image.types.ts (NOVO)
│   └── budget.types.ts (NOVO)
└── utils/ (NOVA PASTA)
    ├── validation.ts
    ├── formatters.ts
    └── helpers.ts
```

### 2. **generateHTMLReport.ts** - 2,021 linhas 🔴 CRÍTICO
**Localização:** `src/utils/generateHTMLReport.ts`  
**Problema:** Utilitário com responsabilidade excessiva
**Responsabilidades Violadas:**
- ✅ Geração de HTML para múltiplos tipos de relatório
- ✅ Formatação de dados complexa
- ✅ Template HTML inline extenso
- ✅ Lógica de formatação de datas
- ✅ Cálculos estatísticos

**Plano de Divisão:**
```
src/utils/reports/
├── html/
│   ├── ReportGenerator.ts (coordenador)
│   ├── templates/
│   │   ├── dashboardTemplate.ts
│   │   ├── contractTemplate.ts
│   │   └── analysisTemplate.ts
│   ├── formatters/
│   │   ├── dateFormatter.ts
│   │   ├── numberFormatter.ts
│   │   └── dataTransformer.ts
│   └── styles/
│       └── reportStyles.ts
```

### 3. **TermoLocatario.tsx** - 1,005 linhas 🔴 CRÍTICO
**Localização:** `src/pages/TermoLocatario.tsx`
**Plano de Divisão:** Similar ao AnaliseVistoria

### 4. **Contratos.tsx** - 1,005 linhas 🔴 CRÍTICO
**Localização:** `src/pages/Contratos.tsx`
**Plano de Divisão:** Separar listagem, filtros, ações em lote

## 📁 Arquivos Problemáticos (500-1000 linhas) - REFATORAÇÃO PREFERENCIAL

### 5. **exportDashboardToExcel.ts** - 973 linhas 🟡 ALTO
**Divisão Sugerida:**
- Separar exportadores por tipo de dados
- Template de planilha por contexto

### 6. **useOptimizedChat.tsx** - 846 linhas 🟡 ALTO
**Divisão Sugerida:**
- Hooks específicos para cada tipo de chat
- Componentes de UI separados

### 7. **useVistoriaAnalises.ts** - 791 linhas 🟡 ALTO
**Divisão Sugerida:**
- Separação por operações CRUD
- Hooks específicos para cada tipo de análise

### 8. **Prestadores.tsx** - 779 linhas 🟡 ALTO
**Divisão Sugerida:**
- Listagem vs. formulário vs. detalhes

### 9. **responseGenerator.ts** - 753 linhas 🟡 ALTO
**Divisão Sugerida:**
- Geradores por tipo de resposta
- Templates separados

### 10. **VisualPromptBuilder.tsx** - 672 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Builder visual vs. lógica de prompts

### 11. **useAIMemory.tsx** - 670 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Gerenciamento de memória vs. contexto

### 12. **DocumentForm.tsx** - 667 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Formulário genérico vs. específicos

### 13. **usePromptLearning.tsx** - 649 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Learning vs. analytics

### 14. **exportContractsToExcel.ts** - 640 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Exportadores específicos por tipo

### 15. **LazyComponents.tsx** - 627 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Componentes lazy individuais

### 16. **CleanupDuplicatesPanel.tsx** - 620 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Interface vs. lógica de limpeza

### 17. **analiseVistoria.ts** - 615 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Templates por tipo de análise

### 18. **service-worker.ts** - 615 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Handlers por tipo de operação

### 19. **ContractWizardModal.tsx** - 615 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Wizard steps separados

### 20. **documentos.ts** - 610 linhas 🟡 MÉDIO
**Divisão Sugerida:**
- Templates por tipo de documento

## 🏗️ Nova Estrutura de Pastas Recomendada

### Estrutura Atual Problemática:
```
src/
├── pages/ (páginas monolíticas)
├── utils/ (utilitários смешанные)
├── hooks/ (hooks mezclados)
└── components/ (componentes mezclados)
```

### Nova Estrutura Proposta:
```
src/
├── features/ (organizado por domínio)
│   ├── analise-vistoria/
│   ├── contratos/
│   ├── documentos/
│   ├── prompt/
│   ├── reports/
│   └── admin/
├── shared/
│   ├── components/ (componentes reutilizáveis)
│   ├── hooks/ (hooks compartilhados)
│   ├── utils/ (utilitários compartilhados)
│   └── types/ (tipos compartilhados)
└── pages/ (apenas coordenadores de rota)
```

## 📋 Plano de Refatoração - Ordem de Prioridade

### FASE 1: CRÍTICA (1-2 sprints)
1. **AnaliseVistoria.tsx** (3,067 linhas)
   - Impacto: Crítico para funcionalidade principal
   - Tempo estimado: 3-4 dias
   - Dependências: Nenhuma

2. **generateHTMLReport.ts** (2,021 linhas)
   - Impacto: Afeta relatórios principais
   - Tempo estimado: 2-3 dias
   - Dependências: Nenhuma

3. **TermoLocatario.tsx** (1,005 linhas)
   - Impacto: Afeta geração de documentos
   - Tempo estimado: 2 dias
   - Dependências: Templates refatorados

### FASE 2: ALTA PRIORIDADE (2-3 sprints)
4. **Contratos.tsx** (1,005 linhas)
5. **exportDashboardToExcel.ts** (973 linhas)
6. **useOptimizedChat.tsx** (846 linhas)
7. **useVistoriaAnalises.ts** (791 linhas)

### FASE 3: MÉDIA PRIORIDADE (3-4 sprints)
8-15. Arquivos de 600-779 linhas
16-20. Arquivos de 500-615 linhas

## 🎯 Benefícios da Refatoração

### Para Desenvolvimento:
- ✅ Código mais manutenível
- ✅ Componentes reutilizáveis
- ✅ Testes mais granulares
- ✅ Desenvolvimento paralelo por equipe
- ✅ Onboarding mais fácil

### Para Performance:
- ✅ Lazy loading de componentes
- ✅ Bundle splitting automático
- ✅ Tree shaking otimizado
- ✅ Carregamento sob demanda

### Para Qualidade:
- ✅ Single Responsibility Principle
- ✅ Separação de preocupações
- ✅ Código mais testável
- ✅ Menos acoplamento

## ⚠️ Riscos e Mitigações

### Riscos:
- **Quebra de funcionalidades existentes**
- **Regressões em produção**
- **Tempo de desenvolvimento**

### Mitigações:
- **Refatoração incremental**
- **Testes automatizados extensivos**
- **Branch de feature**
- **Rollback planejado**
- **Deploy gradual**

## 🔄 Aproveitamento de Estruturas Existentes

### Modelos de Referência Bem-Sucedidos:

#### 1. Feature analise-vistoria (Referência para Outras)
- ✅ Componentes bem divididos (50-200 linhas cada)
- ✅ Hooks específicos por responsabilidade
- ✅ Context dimensionado corretamente
- ✅ Tipos organizados por domínio

#### 2. Sistema de Components UI
- ✅ Reutilização em toda aplicação
- ✅ Props consistentes
- ✅ Testabilidade alta

#### 3. Estrutura de Features
- ✅ `src/features/[feature]/` - Padrão consistente
- ✅ Subdivisão: components, hooks, types, utils
- ✅ Context quando necessário

### Aplicação do Padrão aos Arquivos Problemáticos:

#### Para Contratos.tsx (1,005 linhas):
```
src/features/contratos/ (EXPANDIR)
├── components/
│   ├── ContractList/ (NOVA)
│   ├── ContractFilters/ (NOVA)
│   ├── ContractActions/ (NOVA)
│   └── ContractDetails/ (NOVA)
├── hooks/
│   ├── useContracts.ts (EXPANDIR)
│   ├── useContractFilters.ts (NOVO)
│   └── useContractActions.ts (NOVO)
└── types/ (EXPANDIR)
```

#### Para Templates (analiseVistoria.ts - 615 linhas):
```
src/features/analise-vistoria/templates/ (NOVA)
├── analysisTemplates.ts (separar por tipo)
├── documentTemplates.ts (separar por tipo)
├── budgetTemplates.ts (separar por tipo)
└── common/
    ├── formatters.ts
    └── validators.ts
```

## 📈 Métricas de Sucesso

### Métricas Técnicas:
- Redução de linhas por arquivo (< 300 linhas)
- Aumento de cobertura de testes (> 80%)
- Redução de complexidade ciclomática
- Aumento de reutilização de componentes

### Métricas de Negócio:
- Redução do tempo de desenvolvimento de features (30%)
- Diminuição de bugs relacionados (50%)
- Aumento de velocidade de entrega

### Métricas de Estrutura:
- **Antes:** 1 arquivo com 3,067 linhas
- **Depois:** 10 arquivos com 50-300 linhas cada
- **Resultado:** Melhor manutenibilidade, testes mais fáceis

## 🚀 Conclusão

A refatoração é **essencial** para a sustentabilidade do projeto. O arquivo `AnaliseVistoria.tsx` com 3,067 linhas é especialmente crítico e deve ser a primeira prioridade. A nova estrutura proposta seguirá princípios de Clean Architecture e garantirá melhor manutenibilidade a longo prazo.

## 📋 Próximos Passos Práticos - AÇÃO IMEDIATA

### Semana 1-2: Preparação
1. **Criar branch de feature:** `refactor/analise-vistoria`
2. **Analisar dependências:** Mapear imports do AnaliseVistoria.tsx
3. **Criar estrutura base:** Expandir `/features/analise-vistoria/`
4. **Migrar tipos:** Criar types específicos

### Semana 3-4: Migração Incremental
1. **Extrair componentes simples** (AIExtractionPanel como modelo)
2. **Criar hooks específicos** (baseado em useApontamentosManager.ts)
3. **Migrar estados** (simplificar Context)
4. **Testar incrementalmente** a cada componente

### Semana 5-6: Integração e Validação
1. **Criar página coordenador** (AnaliseVistoriaPage.tsx)
2. **Conectar componentes** através de props
3. **Testes de regressão** completos
4. **Validação de performance**

### Semana 7: Deploy e Monitoring
1. **Deploy gradual** (feature flag)
2. **Monitoramento** de métricas
3. **Rollback preparado** se necessário
4. **Documentação** atualizada

## 🎯 Como Começar HOJE

### Ação Imediata (1-2 horas):
1. ✅ Analisar `src/features/analise-vistoria/` existente
2. ✅ Listar componentes já extraídos
3. ✅ Identificar gaps de 3,067 linhas
4. ✅ Criar backlog de componentes a extrair

### Esta Semana:
1. ✅ Extrair primeiro componente simples (50-100 linhas)
2. ✅ Criar primeiro hook específico
3. ✅ Configurar testes para o novo componente
4. ✅ Validar que tudo funciona

### Critérios de Validação por Componente:
- ✅ Componente < 200 linhas
- ✅ Props bem definidas
- ✅ Testes unitários
- ✅ Story se necessário
- ✅ Performance adequada

---
*Relatório gerado em: 09/11/2025*  
*Total de arquivos analisados: 250+*  
*Arquivos problemáticos identificados: 20*  
*Estruturas bem implementadas identificadas: 5*  
*Plano de refatoração: Incrementais e práticos*