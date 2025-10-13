# Guia de Uso - Sistema de Tarefas

## Acesso ao Sistema

1. Faça login na aplicação DocForge
2. No menu lateral, clique em **"Tarefas"** (ícone de prancheta com lista)

## Criando uma Nova Tarefa

### Passo 1: Abrir o formulário

- Clique no botão **"Nova Tarefa"** no canto superior direito

### Passo 2: Preencher os dados

- **Título\*** (obrigatório): Um título curto e descritivo
  - Exemplo: "Cobrar conta de consumo do contrato 12342"
- **Subtítulo** (opcional): Informação adicional
  - Exemplo: "Pendência financeira"
- **Descrição\*** (obrigatório): Detalhes completos da tarefa
  - Exemplo: "Entrar em contato com o locatário para cobrar a conta de água do mês de setembro, valor de R$ 150,00. O pagamento está atrasado há 10 dias."

### Passo 3: Revisar com IA (opcional)

- Clique no botão **"Revisar com IA"** para melhorar a descrição
- A IA vai corrigir gramática e tornar o texto mais claro e profissional

### Passo 4: Definir status

- Escolha o status inicial:
  - **Não Iniciada**: Tarefa ainda não começou
  - **Em Andamento**: Tarefa já foi iniciada
  - **Concluída**: Tarefa finalizada

### Passo 5: Salvar

- Clique em **"Criar Tarefa"**
- Uma notificação confirmará a criação

## Gerenciando Tarefas

### Visualizar Tarefas

- Use as **tabs** para filtrar:
  - **Todas**: Mostra todas as tarefas
  - **Não Iniciadas**: Apenas tarefas pendentes
  - **Em Andamento**: Tarefas em execução
  - **Concluídas**: Tarefas finalizadas

### Estatísticas

- No topo da página, veja contadores de:
  - Total de tarefas
  - Tarefas não iniciadas
  - Tarefas em andamento
  - Tarefas concluídas

### Ações no Card da Tarefa

Clique no ícone de menu (⋮) no card para:

1. **Editar**: Modificar título, subtítulo, descrição ou status
2. **Mudar Status**:
   - Marcar como Não Iniciada
   - Marcar como Em Andamento
   - Marcar como Concluída
3. **Excluir**: Remover a tarefa permanentemente (pede confirmação)

## Resumo do Dia

### Como Gerar

1. Clique no botão **"Resumir Dia"** no header
2. Aguarde enquanto a IA analisa suas tarefas do dia
3. O resumo será exibido em uma janela

### O que o Resumo Inclui

- Nome do gestor (do seu perfil)
- Todas as tarefas criadas hoje
- Todas as tarefas concluídas hoje
- Horários e datas formatados
- Narrativa profissional em terceira pessoa

### Exemplo de Resumo

```
O gestor Victor Cain Jorge iniciou suas atividades no dia 13/10/2025
criando uma nova tarefa às 09:15, informando a necessidade de cobrar
a conta de consumo do contrato 12342, referente a uma pendência
financeira. Esta tarefa foi marcada como em andamento às 10:30.

Posteriormente, às 11:45, o gestor criou uma segunda tarefa
relacionada a ligar para o locatário e avisar sobre a reprovação da
vistoria. Esta tarefa foi concluída no mesmo dia às 14:20, com o
gestor confirmando que o locatário atendeu à ligação e tomou ciência
da reprovação.
```

### Opções do Resumo

- **Copiar Texto**: Copia o resumo para a área de transferência
- **Exportar PDF**: Baixa um PDF formatado com o resumo

## Exemplo de Fluxo Completo

### Cenário: Cobrança de Conta

1. **Criar Tarefa**
   - Título: "Cobrar conta de consumo do contrato 12342"
   - Subtítulo: "Pendência financeira - Água"
   - Descrição: "entrar em contato com locatario sobre conta agua setembro R$ 150 atrasada"
   - Clica em "Revisar com IA"
   - IA melhora para: "Entrar em contato com o locatário para cobrar a conta de água referente ao mês de setembro, no valor de R$ 150,00, que está atrasada."
   - Status: Não Iniciada
   - Salvar

2. **Iniciar Tarefa**
   - Clicar no menu (⋮) da tarefa
   - Selecionar "Marcar como Em Andamento"

3. **Concluir Tarefa**
   - Após fazer a cobrança, clicar no menu (⋮)
   - Selecionar "Marcar como Concluída"
   - A data e hora de conclusão são registradas automaticamente

4. **Gerar Resumo**
   - No final do dia, clicar em "Resumir Dia"
   - Revisar o resumo gerado pela IA
   - Exportar como PDF para registro

## Dicas e Boas Práticas

### Títulos Efetivos

✅ **Bom**: "Cobrar aluguel do contrato 5678 - Outubro"
❌ **Ruim**: "Ligar"

### Descrições Detalhadas

✅ **Bom**: "Ligar para o locatário João Silva (11) 98765-4321 para confirmar agendamento da vistoria de saída no dia 20/10 às 14h no imóvel da Rua das Flores, 123."
❌ **Ruim**: "Ligar para locatário"

### Use o Revisor de IA

- Sempre que tiver dúvidas sobre gramática ou clareza
- Para tornar descrições mais profissionais
- Para padronizar a linguagem

### Mantenha Status Atualizados

- Mude o status assim que iniciar uma tarefa
- Marque como concluída imediatamente após finalizar
- Isso garante resumos diários precisos

### Organize por Status

- Use "Não Iniciada" para planejamento
- Mude para "Em Andamento" ao começar
- "Concluída" é automática ao marcar como finalizada

## Segurança e Privacidade

- ✅ Apenas você pode ver suas tarefas
- ✅ Outros usuários não têm acesso às suas informações
- ✅ Dados armazenados com segurança no Supabase
- ✅ Resumos são gerados apenas com suas tarefas

## Suporte

Se encontrar algum problema:

1. Verifique sua conexão com a internet
2. Recarregue a página
3. Verifique se está logado corretamente
4. Entre em contato com o administrador do sistema

---

**Desenvolvido para DocForge - Gestão Imobiliária**
