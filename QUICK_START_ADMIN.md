# Quick Start - Sistema de Administração

## 🚀 Início Rápido (5 minutos)

### 1️⃣ Instalar (1 min)

```bash
npm install
```

### 2️⃣ Migração do Banco (2 min)

**Via CLI:**

```bash
supabase db push
```

**Via Dashboard:**

- Acesse SQL Editor do Supabase
- Cole o conteúdo de `supabase/migrations/20250109_create_profiles_and_roles.sql`
- Execute

### 3️⃣ Criar Admin (1 min)

```sql
-- Execute no SQL Editor
UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

### 4️⃣ Iniciar App (1 min)

```bash
npm run dev
```

### 5️⃣ Acessar Admin

1. Faça login
2. Clique em "Administrador" no menu
3. Pronto! 🎉

---

## 📖 Guias Completos

- **Instalação Detalhada:** `INSTALACAO_SISTEMA_ADMIN.md`
- **Guia Completo do Sistema:** `ADMIN_SYSTEM_GUIDE.md`
- **Resumo da Implementação:** `RESUMO_IMPLEMENTACAO_ADMIN.md`

---

## 🔍 Comandos Úteis

### Promover usuário a admin

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'email@exemplo.com';
```

### Ver todos os admins

```sql
SELECT email, full_name FROM profiles WHERE role = 'admin';
```

### Desativar usuário

```sql
UPDATE profiles SET is_active = false WHERE email = 'email@exemplo.com';
```

---

## ✅ Funcionalidades Principais

### Gestão de Usuários

- Criar, editar, ativar/desativar
- Filtrar por cargo e status
- Buscar por email/nome

### Edição em Massa

- Contratos, Prestadores, Vistorias, Documentos
- Seleção múltipla
- Atualização em lote

### Estatísticas

- Usuários, Contratos, Prestadores
- Vistorias, Documentos
- Métricas em tempo real

---

## 🆘 Problemas Comuns

**Profile não carrega?**
→ Faça logout e login novamente

**Menu Admin não aparece?**
→ Verifique se role = 'admin' no banco

**Erro ao criar usuário?**
→ Verifique se email já não existe

---

## 📁 Estrutura de Arquivos

```
src/
├── types/admin.ts              # Tipos TypeScript
├── hooks/
│   ├── useUserManagement.ts    # Gestão de usuários
│   ├── useBulkEdit.ts          # Edição em massa
│   └── useAuth.tsx             # Auth com profile
├── components/
│   ├── admin/
│   │   ├── UserManagement.tsx  # Lista de usuários
│   │   ├── UserFormDialog.tsx  # Form criar/editar
│   │   └── BulkEditPanel.tsx   # Painel bulk edit
│   └── AdminRoute.tsx          # Proteção de rota
├── pages/Admin.tsx             # Página principal
└── utils/permissions.ts        # Funções de permissão

supabase/migrations/
└── 20250109_create_profiles_and_roles.sql  # Migration
```

---

## 🎯 Acesso Rápido

- **Página Admin:** `/admin`
- **Login:** `/login`
- **Contratos:** `/contratos`

---

## 💡 Dicas

1. **Primeiro admin**: Sempre crie via SQL
2. **Segurança**: Use RLS policies do Supabase
3. **Backup**: Faça backup da tabela profiles
4. **Teste**: Crie um usuário comum para testar permissões
5. **Logs**: Verifique console para debug

---

## 🔗 Links Importantes

- [Documentação Supabase](https://supabase.com/docs)
- [React Query](https://tanstack.com/query)
- [Radix UI](https://www.radix-ui.com)
- [Shadcn/ui](https://ui.shadcn.com)

---

## ✨ Pronto para Começar!

Siga os 5 passos acima e em **5 minutos** você terá um sistema de administração completo e funcional.

**Boa sorte!** 🚀
