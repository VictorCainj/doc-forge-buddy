# Análise de Complexidade Ciclomática - Doc Forge Buddy

**Data da Análise:** 09/11/2025 06:01  
**Arquivos Analisados:** 300 (focados nos mais críticos)  
**Complexidade Média:** 22.9  
**Total de Linhas de Código:** 49,025  
**Linhas Médias por Arquivo:** 163  

## 📊 Resumo Executivo

- 🔴 **26 arquivos** requerem refatoração urgente (complexidade > 50)
- 🟠 **65 arquivos** precisam de atenção (complexidade 25-50)  
- 🟡 **61 arquivos** devem ser monitorados (complexidade 15-25)
- 🟢 **148 arquivos** estão com complexidade aceitável

## 🎯 Arquivos Críticos - Prioridade Máxima

> Estes arquivos têm complexidade ciclomática > 50 e devem ser refatorados com urgência

| Rank | Arquivo | Complexidade | LOC | Categoria | Status |
|------|---------|--------------|-----|-----------|---------|
| 1 | `src/pages/AnaliseVistoria.tsx` | **478.7** | 2516 | Page | 🚨 Crítico |
| 2 | `src/features/contracts/utils/contractConjunctions.ts` | **141.1** | 417 | Utility | 🚨 Crítico |
| 3 | `src/utils/responseGenerator.ts` | **134.3** | 500 | Utility | 🚨 Crítico |
| 4 | `src/hooks/useVistoriaAnalises.tsx` | **128.5** | 583 | Custom Hook | 🚨 Crítico |
| 5 | `src/pages/Contratos.tsx` | **127.3** | 804 | Page | 🚨 Crítico |
| 6 | `src/utils/openai.ts` | **125.1** | 386 | Utility | 🚨 Crítico |
| 7 | `src/components/performance/LazyComponents.tsx` | **113.3** | 465 | React Component | 🚨 Crítico |
| 8 | `src/hooks/useOptimizedChat.tsx` | **110.0** | 631 | Custom Hook | 🚨 Crítico |
| 9 | `src/components/ui/form-field.tsx` | **100.6** | 394 | React Component | 🚨 Crítico |
| 10 | `src/hooks/shared/useAIMemory.tsx` | **90.0** | 514 | Custom Hook | 🚨 Crítico |
| 11 | `src/utils/exportDashboardToExcel.ts` | **84.3** | 708 | Utility | 🚨 Crítico |
| 12 | `src/features/contracts/components/ContractWizardModal.tsx` | **81.7** | 514 | React Component | 🚨 Crítico |
| 13 | `src/hooks/use-form-wizard.tsx` | **77.0** | 262 | Custom Hook | 🚨 Crítico |
| 14 | `src/features/documents/components/FormStepContent.tsx` | **72.9** | 219 | React Component | ⚠️ Alto |
| 15 | `src/hooks/useDashboardDesocupacao.ts` | **71.3** | 329 | Custom Hook | ⚠️ Alto |


## 🔧 Funções com Complexidade Crítica

> Funções com complexidade ≥ 15 pontos - candidatos principais para refatoração

| Função | Tipo | Arquivo | Complexidade | Linhas |
|--------|------|---------|--------------|--------|
| useApontamentosManager | ➡️ arrow | `src/features/analise-vistoria/hooks/useApontamentosManager.ts` | **39.2** | 6-194 |
| useAuditLogs | ➡️ arrow | `src/hooks/useAuditLog.ts` | **29.2** | 156-206 |
| apontamentosComFotos | ➡️ arrow | `src/pages/AnaliseVistoria.tsx` | **28.4** | 867-917 |
| ApontamentoList | ➡️ arrow | `src/features/vistoria/components/ApontamentoList.tsx` | **26.8** | 15-140 |
| useCleanupDuplicates | ⚙️ function | `src/hooks/useCleanupDuplicates.ts` | **26.7** | 12-183 |
| PromptPreview | ➡️ arrow | `src/features/prompt/components/PromptPreview.tsx` | **26.1** | 15-201 |
| updateDocumentPreview | ➡️ arrow | `src/pages/AnaliseVistoria.tsx` | **25.9** | 832-882 |
| useAuditStats | ➡️ arrow | `src/hooks/useAuditLog.ts` | **25.8** | 180-230 |
| apontamentosComFotos | ➡️ arrow | `src/pages/AnaliseVistoria.tsx` | **22.3** | 1747-1797 |
| updateDocumentPreview | ➡️ arrow | `src/features/analise-vistoria/hooks/useDocumentPreview.ts` | **22.2** | 18-68 |
| renderInput | ➡️ arrow | `src/components/ui/form-field.tsx` | **22.0** | 314-403 |
| processFormData | ➡️ arrow | `src/features/documents/hooks/useTermoLocatario.ts` | **21.6** | 122-172 |


## 🎯 Padrões de Código Mais Problemáticos

> Estes padrões contribuem significativamente para a complexidade

| Padrão | Ocorrências | Solução Recomendada |
|--------|-------------|-------------------|
| Arrow Function Complex | 1061 | Converter para funções nomeadas |
| Logical Or | 736 | Revisar e simplificar |
| If Statements | 727 | Usar early returns e guard clauses |
| Ternary | 546 | Extrair para funções utilitárias |
| Optional Chaining | 428 | Revisar e simplificar |
| Conditional Jsx | 360 | Criar componentes menores para renderização |
| Logical And | 321 | Usar && apenas para condições simples |
| Try Catch | 302 | Extrair validações para funções específicas |


## 🛠️ Recomendações Específicas por Arquivo

### 🔴 Arquivos Críticos - Ação Imediata


**`src/pages/AnaliseVistoria.tsx`** - Complexidade: 478.7

- **Estratégia:** Quebrar em sub-componentes
- **Ação:** Extrair lógica de estado para hooks customizados
- **Meta:** Reduzir para < 30 pontos de complexidade

**`src/features/contracts/utils/contractConjunctions.ts`** - Complexidade: 141.1

- **Estratégia:** Extract method pattern
- **Ação:** Quebrar em funções utilitárias menores
- **Meta:** Funções < 8 pontos cada

**`src/utils/responseGenerator.ts`** - Complexidade: 134.3

- **Estratégia:** Extract method pattern
- **Ação:** Quebrar em funções utilitárias menores
- **Meta:** Funções < 8 pontos cada

**`src/hooks/useVistoriaAnalises.tsx`** - Complexidade: 128.5

- **Estratégia:** Hook composition pattern
- **Ação:** Dividir em hooks menores e mais específicos
- **Meta:** Hooks < 10 pontos cada

**`src/pages/Contratos.tsx`** - Complexidade: 127.3

- **Estratégia:** Quebrar em sub-componentes
- **Ação:** Extrair lógica de estado para hooks customizados
- **Meta:** Reduzir para < 30 pontos de complexidade


### 📋 Checklist de Refatoração

#### Para cada arquivo crítico:
- [ ] Identificar responsabilidades múltiplas
- [ ] Extrair funções de validação
- [ ] Separar lógica de apresentação vs negócio
- [ ] Aplicar DRY (Don't Repeat Yourself)
- [ ] Criar componentes/hooks reutilizáveis
- [ ] Implementar error boundaries
- [ ] Adicionar testes unitários
- [ ] Documentar decisões arquiteturais

#### Metas de Qualidade:
- [ ] Funções < 10 linhas quando possível
- [ ] Componentes com responsabilidade única
- [ ] Hooks que fazem uma coisa bem
- [ ] Máximo 3 níveis de aninhamento
- [ ] Early returns para reduzir complexidade ciclomática


## 📅 Plano de Refatoração Sugerido

### Fase 1: Urgente (1-2 semanas)
**Foco:** 26 arquivos críticos
- **Esforço:** 2168.9 horas
- **Estratégia:** Extrair funções, simplificar lógica, quebrar componentes

### Fase 2: Importante (2-3 semanas)  
**Foco:** 65 arquivos de alta complexidade
- **Esforço:** 547.6 horas  
- **Estratégia:** Refatorar progressivamente, aplicar patterns

### Fase 3: Monitoramento (1-2 semanas)
**Foco:** 61 arquivos de média complexidade
- **Esforço:** 74.5 horas
- **Estratégia:** Revisão e otimização incremental

**⏱️ Total Estimado: 2790.9 horas (69.8 semanas)**

### 💰 Retorno do Investimento

**Custo de Refatoração:** €167,456 (a €60/hora)

**Benefícios Esperados:**
- ✅ 40-60% redução no tempo de desenvolvimento de features
- ✅ 30-50% menos bugs em funcionalidades complexas
- ✅ Melhor performance de código (menos re-renders)
- ✅ Facilita onboarding de novos desenvolvedores
- ✅ Reduz custo de manutenção a longo prazo
