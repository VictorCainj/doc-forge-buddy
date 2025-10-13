# 🎮 Guia Rápido - Sistema de EXP e Níveis

## Como Usar

### Para Usuários

#### 1. Ganhar Experiência

- Complete qualquer tarefa para ganhar **+10 EXP**
- A cada tarefa completada, você verá uma notificação verde com "+10 EXP"
- Quando completar 10 tarefas (100 EXP), você sobe de nível!

#### 2. Acompanhar Progresso

**No Menu Lateral (Sidebar)**:

- Seu título atual aparece acima do nome
- Exemplo: "🌱 Iniciante • Nv.1"
- Barra de progresso mostra quanto falta para o próximo nível
- "45/100 EXP" indica 45 de 100 EXP necessários

**Na Página de Tarefas**:

- Card grande colorido no topo com todas as estatísticas
- Veja seu nível atual, EXP total e progresso
- Visualize todos os títulos disponíveis
- Títulos desbloqueados aparecem em cores
- Títulos bloqueados aparecem em cinza

#### 3. Subir de Nível

Quando você alcançar 100 EXP, 200 EXP, etc:

- Notificação especial amarela: "🎊 Level Up!"
- Seu título muda automaticamente
- Nova barra de progresso começa do zero
- Título antigo fica marcado como desbloqueado

### Para Desenvolvedores

#### Executar Migração

```bash
# Aplicar a migração no Supabase
# (se estiver usando Supabase CLI)
supabase db push

# Ou executar manualmente no Supabase Dashboard
# SQL Editor > Nova Query > Colar conteúdo do arquivo:
# supabase/migrations/20250113000003_add_exp_level_to_profiles.sql
```

#### Verificar Implementação

```bash
# Rodar o projeto
npm run dev

# Ou se estiver usando bun
bun run dev

# Testar:
# 1. Fazer login
# 2. Ir para /tarefas
# 3. Criar e completar uma tarefa
# 4. Verificar toast de +10 EXP
# 5. Verificar atualização no sidebar
```

#### Estrutura do Código

```typescript
// Hook principal para níveis
import { useUserLevel } from '@/hooks/useUserLevel';

const {
  exp, // EXP total
  level, // Nível atual (1-6)
  title, // Título ("Iniciante", "Mestre", etc)
  icon, // Emoji do nível
  progress, // Progresso até próximo nível (0-100%)
  currentLevelExp, // EXP dentro do nível atual
  nextLevelExp, // EXP necessário (sempre 100)
} = useUserLevel();
```

#### Modificar Sistema de EXP

**Mudar EXP por tarefa**:

```typescript
// Em src/types/task.ts
export const EXP_PER_TASK = 20; // Era 10
```

**Adicionar mais níveis**:

```typescript
// Em src/types/task.ts
export const USER_LEVELS: UserLevel[] = [
  // ... níveis existentes ...
  {
    level: 7,
    title: 'Imortal',
    minExp: 600,
    maxExp: Infinity,
    color: 'text-red-600',
    icon: '🔱',
  },
];
```

**Mudar progressão de níveis**:

```sql
-- Em supabase/migrations/...
-- Modificar função update_user_level()
-- Exemplo: progressão exponencial
NEW.level = GREATEST(1, FLOOR(SQRT(NEW.exp / 10)));
```

## 🐛 Troubleshooting

### EXP não atualiza

1. Verificar se migração foi executada
2. Checar console do navegador por erros
3. Verificar RLS policies no Supabase
4. Confirmar que usuário tem profile criado

### Barra de progresso não aparece

1. Verificar se componente Progress está importado
2. Checar se useUserLevel retorna dados
3. Verificar console por erros do React Query

### Nível não sobe automaticamente

1. Trigger deve estar criado no banco
2. Verificar logs do Supabase
3. Testar função manualmente no SQL Editor

## 📊 Exemplos de Uso

### Resetar EXP de um usuário (Admin)

```sql
UPDATE profiles
SET exp = 0
WHERE user_id = 'uuid-do-usuario';
-- O level será atualizado automaticamente para 1
```

### Dar EXP bônus (Admin)

```sql
UPDATE profiles
SET exp = exp + 100
WHERE user_id = 'uuid-do-usuario';
-- O level será recalculado automaticamente
```

### Ver ranking de usuários

```sql
SELECT
  full_name,
  level,
  exp,
  (SELECT COUNT(*) FROM tasks WHERE user_id = profiles.user_id AND status = 'completed') as tasks_completed
FROM profiles
ORDER BY exp DESC
LIMIT 10;
```

## 🎯 Dicas

### Para Gamificação Efetiva

1. Celebrate conquistas: Use toasts e animações
2. Feedback imediato: Sempre mostre quando EXP é ganho
3. Progresso visível: Barra de progresso sempre à vista
4. Meta clara: Usuário sempre sabe quanto falta
5. Recompensas: Títulos dão senso de conquista

### Para Performance

1. Cache está configurado para 5 minutos
2. Usar índices criados na migração
3. Invalidar cache apenas quando necessário
4. Trigger no banco é mais rápido que cálculo no cliente

---

**Dúvidas?** Consulte `SISTEMA_EXP_LEVEL_IMPLEMENTADO.md` para documentação completa.
