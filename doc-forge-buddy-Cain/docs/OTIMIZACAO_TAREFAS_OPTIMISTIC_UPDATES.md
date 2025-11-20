# Otimização da Página de Tarefas com Optimistic Updates

## Visão Geral

A página `/tarefas` foi otimizada para exibir alterações instantaneamente no front-end, sem aguardar confirmação do back-end. Isso proporciona uma experiência de usuário fluida e responsiva.

## Implementação

### 1. Optimistic Updates no Hook `useTasks`

O hook `useTasks` foi modificado para implementar **optimistic updates** em todas as operações CRUD:

#### Criar Tarefa (`createTaskMutation`)
- **onMutate**: Adiciona a tarefa imediatamente ao cache com um ID temporário
- **onError**: Reverte para o estado anterior em caso de erro
- **onSuccess**: Sincroniza com o servidor e substitui o ID temporário pelo ID real

#### Atualizar Tarefa (`updateTaskMutation`)
- **onMutate**: Atualiza a tarefa imediatamente no cache
- **onError**: Reverte para o estado anterior em caso de erro
- **onSuccess**: Sincroniza com o servidor

#### Deletar Tarefa (`deleteTaskMutation`)
- **onMutate**: Remove a tarefa imediatamente do cache
- **onError**: Restaura a tarefa em caso de erro
- **onSuccess**: Confirma a exclusão no servidor

#### Mudar Status (`changeStatusMutation`)
- **onMutate**: Atualiza o status imediatamente no cache
- **onError**: Reverte para o status anterior em caso de erro
- **onSuccess**: Sincroniza com o servidor e atualiza EXP do usuário se necessário

### 2. Melhorias na Página `Tarefas.tsx`

#### Feedback Imediato
- Modais fecham imediatamente após ações do usuário
- Alterações aparecem instantaneamente na interface
- Toasts discretos confirmam sucesso (sem poluir a UI)

#### Tratamento de Erros
- Em caso de erro de sincronização:
  - Mudanças são revertidas automaticamente pelo rollback do optimistic update
  - Modais são reabertos quando necessário
  - Mensagens de erro claras informam o usuário sobre problemas de sincronização

#### Drag & Drop Otimizado
- Mudanças de status via drag & drop são aplicadas instantaneamente
- Sincronização acontece em background sem interromper a experiência

## Fluxo de Operação

### Exemplo: Criar Tarefa

1. **Usuário preenche formulário e clica em "Salvar"**
   - Modal fecha imediatamente
   - Tarefa aparece na lista com ID temporário (`temp-{timestamp}`)

2. **Em background:**
   - Requisição é enviada ao servidor
   - Se sucesso: ID temporário é substituído pelo ID real do servidor
   - Se erro: Tarefa é removida e modal é reaberto com mensagem de erro

3. **Feedback ao usuário:**
   - Toast discreto confirma sucesso (2 segundos)
   - Em caso de erro: Toast de erro mais longo (5 segundos) com instruções

### Exemplo: Mudar Status via Drag & Drop

1. **Usuário arrasta tarefa para nova coluna**
   - Tarefa move instantaneamente para nova coluna
   - Contadores de status são atualizados imediatamente

2. **Em background:**
   - Requisição é enviada ao servidor
   - Se sucesso: Sincronização confirmada
   - Se erro: Tarefa retorna à coluna original automaticamente

3. **Feedback ao usuário:**
   - Nenhum toast durante drag & drop (para não poluir a UI)
   - Toast de erro apenas se houver problema de sincronização

## Tratamento de Conectividade

### Sem Conexão
- Alterações são aplicadas localmente
- Quando a conexão for restaurada, o React Query tentará sincronizar automaticamente
- Em caso de erro persistente, o usuário é notificado

### Erros de Sincronização
- Rollback automático para o estado anterior
- Mensagens de erro claras e acionáveis
- Possibilidade de tentar novamente

## Benefícios

1. **Imediaticidade**: Alterações aparecem instantaneamente
2. **Responsividade**: Interface não trava aguardando servidor
3. **Confiabilidade**: Rollback automático em caso de erro
4. **Usabilidade**: Feedback visual claro e não intrusivo
5. **Performance**: Operações assíncronas não bloqueiam a UI

## Compatibilidade

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ React Query para gerenciamento de estado e cache
- ✅ Supabase para persistência de dados
- ✅ Acessibilidade mantida (ARIA labels, feedback visual)

## Segurança

- Validação de autenticação antes de todas as operações
- Verificação de propriedade (`user_id`) em todas as queries
- Nenhuma informação sensível exposta durante atualizações otimistas

## Manutenção

### Para Desenvolvedores

#### Adicionar Nova Operação com Optimistic Update

```typescript
const newMutation = useMutation({
  mutationFn: async (data) => {
    // Operação no servidor
  },
  onMutate: async (data) => {
    // Cancelar queries em andamento
    await queryClient.cancelQueries({ queryKey: ['tasks', user.id] });
    
    // Snapshot do estado anterior
    const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user.id]);
    
    // Atualizar cache otimisticamente
    queryClient.setQueryData<Task[]>(['tasks', user.id], (old = []) => {
      // Lógica de atualização otimista
      return updatedTasks;
    });
    
    return { previousTasks };
  },
  onError: (err, variables, context) => {
    // Reverter em caso de erro
    if (context?.previousTasks) {
      queryClient.setQueryData(['tasks', user.id], context.previousTasks);
    }
  },
  onSuccess: () => {
    // Sincronizar com servidor
    queryClient.invalidateQueries({ queryKey: ['tasks', user.id] });
  },
});
```

#### Tratamento de Erros

Sempre inclua:
1. Rollback do estado anterior
2. Mensagem de erro clara ao usuário
3. Log do erro para debugging
4. Possibilidade de tentar novamente

## Testes

### Cenários de Teste

1. **Criar tarefa com conexão normal**
   - ✅ Tarefa aparece instantaneamente
   - ✅ Sincronização bem-sucedida

2. **Criar tarefa sem conexão**
   - ✅ Tarefa aparece localmente
   - ✅ Erro é tratado adequadamente
   - ✅ Rollback quando conexão é restaurada

3. **Atualizar tarefa com erro de servidor**
   - ✅ Alterações são revertidas
   - ✅ Modal é reaberto
   - ✅ Mensagem de erro é exibida

4. **Drag & drop com múltiplas tarefas**
   - ✅ Todas as mudanças aparecem instantaneamente
   - ✅ Sincronização em background não bloqueia UI

## Limitações Conhecidas

1. **IDs Temporários**: Tarefas criadas têm IDs temporários até sincronização
   - Impacto: Mínimo, IDs são substituídos após sincronização
   - Solução: IDs temporários são únicos e não conflitam

2. **Conflitos de Sincronização**: Se múltiplas abas modificam a mesma tarefa
   - Impacto: Última alteração vence
   - Solução: React Query invalida cache após sincronização

3. **Offline Prolongado**: Alterações offline podem ficar pendentes
   - Impacto: Usuário pode não perceber alterações não sincronizadas
   - Solução: React Query tenta sincronizar automaticamente quando conexão é restaurada

## Próximos Passos

- [ ] Adicionar indicador visual de sincronização pendente
- [ ] Implementar fila de sincronização para operações offline
- [ ] Adicionar notificações push para sincronização bem-sucedida
- [ ] Implementar resolução de conflitos para edições simultâneas

