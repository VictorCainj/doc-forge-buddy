# Guia de Migração Progressiva - TypeScript Strict Mode

## Status Atual: Fase 2-4 Implementadas ✅
## Objetivo: Migração Completa em 8 Semanas

---

## 📋 Checklist de Progresso

### ✅ Concluído (Fase 1-2)
- [x] Configuração `tsconfig.strict.json` 
- [x] Correção de tipos em `src/types/`
- [x] 4 arquivos de tipos corrigidos
- [x] Validação com `npm run type-check -- --strict`

### 🔄 Em Progresso (Fase 3-4)
- [x] 2 hooks adicionados ao strict mode
- [x] 1 componente adicionado ao strict mode
- [ ] Correção completa de hooks críticos
- [ ] Correção de componentes principais

### 📅 Próximas Semanas

---

## 🎯 Prioridades por Semana

### **Semana 1-2: Hooks Críticos**
**Meta**: Corrigir 5 hooks principais

#### Prioridade 1 (Impacto Alto)
1. **`src/hooks/shared/useAPI.ts`**
   - Problemas: 20+ ocorrências de `any`
   - Ação: Substituir `Record<string, any>` → `Record<string, unknown>`
   - Tempo estimado: 2-3 horas

2. **`src/hooks/features/useBudgetAnalyzer.ts`**
   - Problemas: `any[]`, `any` params
   - Ação: Tipar Budget interface
   - Tempo estimado: 1-2 horas

3. **`src/hooks/features/useVistoriaAnalyser.ts`**
   - Problemas: `any` em analysis
   - Ação: Criar tipos de análise
   - Tempo estimado: 1-2 horas

#### Prioridade 2 (Impacto Médio)
4. **`src/hooks/shared/useContractManager.ts`**
5. **`src/hooks/useContractsQuery.ts`**

**Ação Semanal**:
```bash
# Testar após cada correção
npm run type-check -- --strict
```

---

### **Semana 3-4: Componentes Principais**
**Meta**: Corrigir 8 componentes principais

#### Prioridade 1 (Impacto Alto)
1. **`src/components/PerformanceMonitor.tsx`**
   - Problema: `useState<any>`
   - Ação: Tipar Performance data

2. **`src/components/admin/AuditLogsViewer.tsx`**
   - Problema: `value: any` em filtros
   - Ação: Tipar AuditLogFilters

3. **`src/components/QuickActionsDropdown.tsx`**
   - Problema: `icon: any` param
   - Ação: Usar AppIcon type

#### Prioridade 2 (Impacto Médio)
4. TaskCard ✅ (já corrigido)
5. Componentes de performance
6. Modais principais

---

### **Semana 5-6: Refinamento**
**Meta**: Cobertura de 90%

#### Ações:
- [ ] Análise completa de `any` leftover
- [ ] Tipos de retorno explícitos
- [ ] Parâmetros não utilizados
- [ ] Testes de compilação

```bash
# Verificar todos os any restantes
grep -r ":\s*any" src/ | wc -l
```

---

### **Semana 7-8: Finalização**
**Meta**: 100% Strict Mode

#### Ações Finais:
- [ ] Migração completa de todos os arquivos
- [ ] CI/CD para validação
- [ ] Documentação de padrões
- [ ] Treinamento da equipe

---

## 🛠️ Padrões de Correção

### 1. **Substituição de `any`**
```typescript
// ❌ Antes
const data: any = response;
const props: any = componentProps;

// ✅ Depois  
const data: unknown = response;
const props: ComponentProps = componentProps;
```

### 2. **Record Types**
```typescript
// ❌ Antes
Record<string, any>

// ✅ Depois
Record<string, unknown>
```

### 3. **React Component Props**
```typescript
// ❌ Antes
React.ComponentType<any>

// ✅ Depois
React.ComponentType<React.SVGProps<SVGSVGElement>>
// ou
React.ComponentType<ButtonProps>
```

### 4. **Array Types**
```typescript
// ❌ Antes
const items: any[] = [];

// ✅ Depois
const items: UnknownArrayItem[] = [];
// ou
const items: Array<{ id: string; name: string }> = [];
```

---

## 🧪 Comandos de Validação

### Teste Rápido
```bash
cd doc-forge-buddy-Cain

# Verificar strict mode específico
npm run type-check -- --strict

# Contar any restantes
grep -r ":\s*any" src/ | wc -l

# Ver arquivos modificados
git diff --name-only
```

### Validação Incremental
```bash
# Testar apenas arquivos modificados
npx tsc --noEmit --strict src/hooks/useGerarMotivoIA.ts

# Testar diretório específico
npx tsc --noEmit --strict src/types/
```

---

## 📊 Métricas de Progresso

### Semana 1-2
- **Meta**: 5 hooks corrigidos
- **Atual**: 2/5 hooks (40%)
- **Any restantes**: ~80 ocorrências

### Semana 3-4  
- **Meta**: 8 componentes corrigidos
- **Atual**: 1/8 componentes (12.5%)
- **Componentes críticos**: 15

### Semana 5-6
- **Meta**: 90% cobertura
- **Atual**: 30% cobertura
- **Arquivos totais**: ~200

### Semana 7-8
- **Meta**: 100% cobertura
- **Zero any**: Objetivo final

---

## ⚠️ Pontos de Atenção

### 1. **Hooks React Query**
- Arquivos `shared/useAPI.ts` são críticos
- Implementar tipos para `QueryOptions`

### 2. **Props de Componentes**
- Usar interfaces específicas
- Evitar `React.ComponentProps<any>`

### 3. **API Responses**
- Tipar como `unknown` primeiro
- Narrowing após validação

### 4. **Context Providers**
- Tipos explícitos para context

---

## 🚀 Como Contribuir

### Para Desenvolvedores
1. **Sempre usar** `tsconfig.strict.json` para novos arquivos
2. **Corrigir** 1-2 arquivos por semana
3. **Testar** após cada correção
4. **Documentar** padrões utilizados

### Para Code Review
1. **Verificar** uso de `any`
2. **Sugerir** tipos mais específicos
3. **Validar** strict mode compliance
4. **Promover** patterns consistentes

---

## 🎯 Objetivo Final

**Data Limite**: 8 semanas
**Meta**: 100% TypeScript Strict Mode
**Benefício**: Maior type safety e developer experience

### Resultado Esperado:
- ✅ Zero uso de `any`
- ✅ 100% type safety
- ✅ Melhores IDE suggestions
- ✅ Menos bugs em runtime

---

## 📞 Suporte

### Dúvidas Comuns:
1. **"Como tipar API response?"** → Usar `unknown` + narrowing
2. **"Props muito complexas?"** → Interface dedicada
3. **"Hook com many any?"** → Priorizar pelos mais usados

### Recursos:
- [TypeScript Strict Mode Guide](https://www.typescriptlang.org/tsconfig#strict)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Este repositório - exemplos de correção]
