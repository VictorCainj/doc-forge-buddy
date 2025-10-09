# 📝 Passo a Passo: Aplicar Migrations no Supabase

## 🎯 Objetivo

Aplicar as 3 migrations SQL necessárias para o funcionamento completo do painel admin.

---

## ⏱️ Tempo Estimado: 5-10 minutos

---

## 📋 Pré-requisitos

- ✅ Conta no Supabase
- ✅ Projeto criado no Supabase
- ✅ Acesso ao painel do projeto

---

## 🚀 Passo a Passo

### Passo 1: Acessar o Supabase Studio

1. Abra seu navegador
2. Acesse: [https://app.supabase.com](https://app.supabase.com)
3. Faça login com sua conta
4. **Selecione seu projeto** na lista

---

### Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **"SQL Editor"**
3. Você verá a tela do editor SQL

---

### Passo 3: Criar Nova Query

1. Clique no botão **"New query"** (ou "+ New Query")
2. Uma nova aba de editor será aberta

---

### Passo 4: Aplicar Migration 1 - Sistema de Auditoria

#### 4.1. Abrir o arquivo da migration

No seu projeto local, navegue até:

```
supabase/migrations/20250109_create_audit_system.sql
```

#### 4.2. Copiar o conteúdo

1. Abra o arquivo `20250109_create_audit_system.sql`
2. Selecione **TODO o conteúdo** (Ctrl+A ou Cmd+A)
3. Copie (Ctrl+C ou Cmd+C)

#### 4.3. Colar no SQL Editor

1. Volte para o Supabase Studio
2. Cole o conteúdo no editor (Ctrl+V ou Cmd+V)
3. O editor deve mostrar um script SQL grande

#### 4.4. Executar a migration

1. Clique no botão **"Run"** (ou pressione Ctrl+Enter / Cmd+Enter)
2. Aguarde a execução (pode levar 5-15 segundos)
3. Você deve ver: **"Success. No rows returned"** (isso é normal!)

✅ **Migration 1 aplicada com sucesso!**

---

### Passo 5: Aplicar Migration 2 - 2FA e Sessões

#### 5.1. Criar nova query

1. Clique em **"New query"** novamente
2. Uma nova aba limpa será aberta

#### 5.2. Copiar e colar

1. Abra o arquivo: `supabase/migrations/20250109_add_2fa_support.sql`
2. Selecione todo o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor (Ctrl+V)

#### 5.3. Executar

1. Clique em **"Run"**
2. Aguarde a execução
3. Deve ver: **"Success. No rows returned"**

✅ **Migration 2 aplicada com sucesso!**

---

### Passo 6: Aplicar Migration 3 - Sistema de Permissões

#### 6.1. Criar nova query

1. Clique em **"New query"** mais uma vez

#### 6.2. Copiar e colar

1. Abra o arquivo: `supabase/migrations/20250109_create_permissions_system.sql`
2. Selecione todo o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor (Ctrl+V)

#### 6.3. Executar

1. Clique em **"Run"**
2. Aguarde a execução (esta pode demorar um pouco mais, 10-20 segundos)
3. Você verá várias mensagens, mas no final deve aparecer: **"Success"**

✅ **Migration 3 aplicada com sucesso!**

---

### Passo 7: Verificar a Instalação

#### 7.1. Criar query de verificação

1. Clique em **"New query"**
2. Abra o arquivo: `verificar_instalacao.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"**

#### 7.2. Analisar os resultados

Você deve ver várias tabelas com resultados. Procure por:

- ✅ **Tabelas criadas: 7 de 7**
- ✅ **Funções RPC criadas: 11+ de 11+**
- ✅ **Triggers: 4 de 4**
- ✅ **Permissões: 38+ de 38+**

Se todos mostrarem ✅, **parabéns!** Tudo está instalado corretamente.

---

### Passo 8: Testar no Painel Admin

#### 8.1. Voltar para sua aplicação

1. Abra sua aplicação local
2. Acesse: `http://localhost:5173/admin`

#### 8.2. Recarregar a página

1. Pressione **F5** ou **Ctrl+R** para recarregar
2. Faça login como admin (se necessário)

#### 8.3. Testar as abas

1. Clique na aba **"Auditoria"** - deve carregar sem erros
2. Clique na aba **"Relatórios"** - deve carregar sem erros
3. Clique na aba **"Integridade"** - deve carregar sem erros

---

## ✅ Checklist de Conclusão

Marque cada item após completar:

- [ ] Abri o Supabase Studio
- [ ] Executei Migration 1 (audit_system)
- [ ] Executei Migration 2 (2fa_support)
- [ ] Executei Migration 3 (permissions_system)
- [ ] Executei o script de verificação
- [ ] Todos os itens mostraram ✅
- [ ] Recarreguei a página do admin
- [ ] Testei a aba Auditoria
- [ ] Testei a aba Relatórios
- [ ] Testei a aba Integridade

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "relation already exists"

**O que significa:** Alguma tabela já existe no banco.

**Solução:**

- Isso pode ser normal se você já tentou executar antes
- Continue com as próximas migrations
- Se persistir, veja o arquivo `CORRIGIR_ERRO_RPC.md`

### Problema 2: "permission denied"

**O que significa:** Seu usuário não tem permissão.

**Solução:**

```sql
-- Execute no SQL Editor:
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
```

### Problema 3: "type already exists"

**O que significa:** Os tipos ENUM já existem.

**Solução:**

- Isso é normal em alguns casos
- Continue, as migrations têm `IF NOT EXISTS` em muitos lugares

### Problema 4: Após aplicar, ainda dá erro 404

**Solução:**

1. Verifique se você executou **TODAS as 3 migrations**
2. Execute o script de verificação
3. Se faltar algo, re-execute a migration que faltou
4. Recarregue a página (F5) após aplicar

---

## 📞 Precisa de Ajuda?

Se após seguir todos os passos ainda houver problemas:

1. Execute o script de verificação (`verificar_instalacao.sql`)
2. Copie os resultados
3. Consulte `CORRIGIR_ERRO_RPC.md` para soluções específicas

---

## 🎉 Sucesso!

Se chegou até aqui e todos os testes passaram, **parabéns!**

Seu painel de administração está completamente funcional com:

- ✅ Sistema de auditoria
- ✅ Relatórios administrativos
- ✅ Segurança avançada
- ✅ Validação de dados
- ✅ Verificação de integridade
- ✅ Permissões granulares

---

**Versão:** 1.0  
**Data:** 09 de Janeiro de 2025
