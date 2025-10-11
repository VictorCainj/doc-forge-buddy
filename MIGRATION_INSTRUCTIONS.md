# Instruções de Migração - Sistema de Contas de Consumo

## 📋 Visão Geral

Este documento contém as instruções para aplicar a migração do banco de dados que adiciona o sistema de rastreamento de contas de consumo (energia, água, condomínio, gás) aos contratos.

## 🗄️ Migração SQL

### Opção 1: Usando o Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `agzutoonsruttqbjnclo`
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo: `supabase/migrations/20250111_create_contract_bills.sql`
6. Clique em **Run** para executar a migração

### Opção 2: Usando Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Navegar até o diretório do projeto
cd "C:\Users\Victor Cain\Documents\Project\doc-forge-buddy"

# Aplicar a migração
supabase db push
```

## ✅ Verificação da Migração

Após aplicar a migração, verifique se a tabela foi criada corretamente:

1. No Supabase Dashboard, vá em **Table Editor**
2. Procure pela tabela `contract_bills`
3. Verifique se ela tem as seguintes colunas:
   - `id` (uuid)
   - `contract_id` (uuid)
   - `bill_type` (text)
   - `delivered` (boolean)
   - `delivered_at` (timestamp)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)
   - `user_id` (uuid)

## 🔐 Políticas RLS

A migração cria automaticamente as seguintes políticas de Row Level Security (RLS):

- ✅ **SELECT**: Usuários autenticados podem visualizar contas
- ✅ **INSERT**: Usuários autenticados podem criar contas
- ✅ **UPDATE**: Usuários autenticados podem atualizar contas
- ✅ **DELETE**: Usuários autenticados podem deletar contas

## 📝 O que a Migração Faz

1. **Cria a tabela `contract_bills`**: Armazena o status de entrega das contas de consumo
2. **Adiciona índices**: Para otimizar consultas por `contract_id` e `user_id`
3. **Configura RLS**: Protege os dados com políticas de segurança
4. **Cria trigger**: Atualiza automaticamente `updated_at` quando um registro é modificado
5. **Define constraint**: Garante que cada contrato não tenha contas duplicadas do mesmo tipo

## 🎯 Funcionalidades Implementadas

Após aplicar a migração, o sistema terá:

- ✅ **Badges clicáveis** nos cards de contratos
- ✅ **Rastreamento individual** de cada conta (energia, água, condomínio, gás)
- ✅ **Feedback visual** com cores (cinza = não entregue, verde = entregue)
- ✅ **Persistência automática** no Supabase
- ✅ **Criação automática** de contas baseada na configuração de cada contrato

## 🚀 Próximos Passos

Após aplicar a migração:

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Acesse a página de contratos
3. Verifique se a seção "Contas de Consumo" aparece nos cards
4. Teste clicando nos badges para alternar o status de entrega

## ⚠️ Importante

- A migração é **não destrutiva** e não afeta dados existentes
- As contas são criadas **automaticamente** quando um contrato é visualizado
- Apenas as contas configuradas em cada contrato são exibidas
- A energia é **sempre** exibida por padrão

## 🐛 Solução de Problemas

### Erro: "relation contract_bills already exists"

A tabela já foi criada. Você pode pular esta migração.

### Erro: "foreign key violation"

Certifique-se de que a tabela `saved_terms` existe no banco de dados.

### Contas não aparecem nos cards

1. Verifique se a migração foi aplicada com sucesso
2. Limpe o cache do navegador
3. Verifique o console do navegador para erros

## 📞 Suporte

Se encontrar problemas, verifique:

- Console do navegador (F12)
- Logs do Supabase Dashboard
- Políticas RLS estão habilitadas
