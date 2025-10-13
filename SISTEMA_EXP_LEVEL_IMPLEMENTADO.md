# Sistema de EXP e Níveis - Implementação Completa

## 🎯 Visão Geral

Sistema de gamificação implementado no módulo de Tarefas, permitindo que os usuários ganhem experiência (EXP) ao completar tarefas e progridam através de diferentes níveis com títulos exclusivos.

## ✨ Características Implementadas

### 1. Sistema de Experiência

- **+10 EXP** por tarefa completada
- EXP acumulado permanentemente no perfil do usuário
- Atualização automática do nível baseado no EXP total

### 2. Sistema de Níveis

Progressão linear: **100 EXP por nível**

| Nível | Título     | EXP Necessário | Ícone |
| ----- | ---------- | -------------- | ----- |
| 1     | Iniciante  | 0-99           | 🌱    |
| 2     | Aprendiz   | 100-199        | 📚    |
| 3     | Competente | 200-299        | ⚡    |
| 4     | Experiente | 300-399        | 🔥    |
| 5     | Mestre     | 400-499        | 👑    |
| 6     | Lenda      | 500+           | ⭐    |

### 3. Visualização no Menu Lateral (Sidebar)

- Título atual com ícone acima do nome do usuário
- Nível atual exibido (ex: "Nv.3")
- Barra de progresso mostrando o avanço até o próximo nível
- Indicador de EXP atual/necessário (ex: "45/100 EXP")
- Percentual de progresso

### 4. Card de Estatísticas Detalhadas (Página Tarefas)

- **Progresso Atual**:
  - Nível e título com ícone
  - Barra de progresso detalhada
  - EXP atual e necessário para próximo nível
- **Estatísticas Pessoais**:
  - EXP total acumulado
  - Número de tarefas completadas
  - Total de tarefas criadas

- **Todos os Títulos**:
  - Visualização de todos os 6 níveis
  - Indicação visual de títulos desbloqueados
  - Destaque para o título atual
  - Títulos bloqueados mostrados em cinza

### 5. Feedback Visual

- Toast "+10 EXP" ao completar tarefa (fundo verde)
- Toast especial "Level Up!" ao subir de nível (fundo amarelo)
- Animação de delay entre os toasts para melhor UX
- Cores vibrantes e emojis para gamificação

## 🗄️ Banco de Dados

### Migração Criada

**Arquivo**: `supabase/migrations/20250113000003_add_exp_level_to_profiles.sql`

Adiciona à tabela `profiles`:

- Campo `exp` (INTEGER, padrão 0)
- Campo `level` (INTEGER, padrão 1)
- Trigger automático para atualizar level quando EXP muda
- Índices para otimizar consultas de level e exp

### Trigger Automático

```sql
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcula level baseado em exp (100 exp por level)
  NEW.level = GREATEST(1, (NEW.exp / 100) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/hooks/useUserLevel.ts`**: Hook para gerenciar níveis e EXP
2. **`src/components/UserStatsCard.tsx`**: Card de estatísticas detalhadas
3. **`supabase/migrations/20250113000003_add_exp_level_to_profiles.sql`**: Migração do banco

### Arquivos Modificados

1. **`src/types/admin.ts`**: Adicionados campos exp e level
2. **`src/types/task.ts`**: Sistema completo de níveis com funções auxiliares
3. **`src/hooks/useTasks.ts`**: Lógica de adicionar EXP ao completar tarefas
4. **`src/components/Sidebar.tsx`**: Exibição de título e barra de progresso
5. **`src/pages/Tarefas.tsx`**: Integração do UserStatsCard
6. **`src/integrations/supabase/types.ts`**: Tipos TypeScript do Supabase atualizados

## 🔧 Como Funciona

### Fluxo de Experiência

1. **Usuário completa uma tarefa**:
   - Status muda para "completed"
   - Sistema verifica se tarefa não estava completa antes
2. **Sistema adiciona EXP**:
   - Busca EXP atual do perfil
   - Adiciona +10 EXP
   - Atualiza banco de dados
3. **Trigger automático do banco**:
   - Recalcula o nível baseado no novo EXP
   - Atualiza campo level automaticamente
4. **Feedback ao usuário**:
   - Toast de "+10 EXP" aparece
   - Se subiu de nível, toast de "Level Up!" aparece após 500ms
5. **Atualização da UI**:
   - React Query invalida cache
   - Sidebar e página de Tarefas atualizam automaticamente
   - Barra de progresso reflete novo valor

### Cálculo de Níveis

```typescript
// Nível baseado no EXP
level = Math.max(1, Math.floor(exp / 100) + 1);

// Exemplos:
// 0 EXP = Nível 1
// 99 EXP = Nível 1
// 100 EXP = Nível 2
// 250 EXP = Nível 3
// 500 EXP = Nível 6
```

### Cálculo de Progresso

```typescript
// EXP para próximo nível: sempre 100
// Progresso dentro do nível atual:
const currentLevelMinExp = (level - 1) * 100;
const currentLevelExp = exp - currentLevelMinExp;
const progress = (currentLevelExp / 100) * 100;
```

## 🎨 Design e UX

### Cores e Estética

- **Card de Estatísticas**: Gradiente amber-orange com bordas suaves
- **Barra de Progresso**: Destaque visual com cores vibrantes
- **Títulos**: Cores específicas por nível (cinza, azul, verde, roxo, laranja, amarelo)
- **Badges**: "Atual" em amber para o nível ativo
- **Ícones**: Emojis temáticos para cada nível

### Responsividade

- Grid de 3 colunas no desktop (md:grid-cols-3)
- Empilhamento em mobile (grid-cols-1)
- Card adaptável à largura da tela
- Barra de progresso responsiva

## 🚀 Próximos Passos Possíveis

### Melhorias Futuras (Opcionais)

1. **Sistema de Conquistas**: Badges especiais por marcos alcançados
2. **Ranking de Usuários**: Leaderboard com top performers
3. **Multiplicador de EXP**: Dias consecutivos aumentam EXP ganho
4. **Missões Diárias**: Tarefas especiais com bônus de EXP
5. **Notificações Push**: Alertas quando próximo de subir de nível
6. **Histórico de Progresso**: Gráfico de evolução de EXP ao longo do tempo
7. **EXP Variável**: Baseado em prioridade/complexidade da tarefa

## ✅ Checklist de Implementação

- [x] Migração SQL criada e documentada
- [x] Types TypeScript atualizados
- [x] Hook useUserLevel criado
- [x] Sistema de EXP no useTasks
- [x] Sidebar atualizado com título e progresso
- [x] UserStatsCard criado
- [x] Integração na página Tarefas
- [x] Supabase types atualizados
- [x] Feedback visual implementado
- [x] Documentação completa

## 📝 Notas Técnicas

### Performance

- Cache de 5 minutos no React Query para reduzir consultas
- Índices no banco para consultas rápidas
- Invalidação seletiva do cache apenas quando necessário

### Segurança

- RLS (Row Level Security) do Supabase mantido
- Usuários só acessam próprio EXP/Level
- Trigger roda no servidor, não pode ser manipulado pelo cliente

### Manutenibilidade

- Código modular e bem organizado
- Funções auxiliares reutilizáveis
- Constantes centralizadas em types/task.ts
- Comentários explicativos onde necessário

---

**Data de Implementação**: Janeiro de 2025
**Status**: ✅ Completo e Testado
