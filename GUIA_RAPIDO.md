# 🚀 Guia Rápido - Sistema de Contas de Consumo

## ⏱️ Setup em 5 Minutos

### Passo 1: Aplicar Migração no Supabase (2 min)

1. Acesse: https://supabase.com/dashboard/project/agzutoonsruttqbjnclo/sql
2. Clique em **"New Query"**
3. Abra o arquivo: `supabase/migrations/20250111_create_contract_bills.sql`
4. Copie **todo** o conteúdo
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** (botão verde ou tecle F5)
7. Aguarde mensagem: ✅ "Success. No rows returned"

### Passo 2: Reiniciar Servidor (1 min)

```bash
# Se o servidor estiver rodando, pare com Ctrl+C
# Depois execute:
npm run dev
```

### Passo 3: Testar (2 min)

1. Abra o navegador em: http://localhost:5173
2. Vá para a página **"Contratos"**
3. Veja os cards de contratos
4. Procure a seção **"CONTAS DE CONSUMO"**
5. Clique em qualquer badge para testar
6. ✅ Pronto!

---

## 💡 Como Usar

### Marcar Conta como Entregue

1. Localize o contrato desejado
2. Veja a seção "CONTAS DE CONSUMO"
3. Clique no badge da conta (ex: "Energia")
4. Badge fica **verde** com ícone ✓
5. Toast confirma: "Energia marcada como entregue"

### Desmarcar Conta

1. Clique novamente no badge verde
2. Badge volta para **cinza**
3. Toast confirma: "Energia marcada como não entregue"

### Visualizar Status

- **Cinza + círculo vazio (○)**: Não entregue
- **Verde + check (✓)**: Entregue

---

## 📱 Visual do Sistema

```
╔═══════════════════════════════════╗
║ CONTAS DE CONSUMO                 ║
╠═══════════════════════════════════╣
║  ┌──────────┐    ┌──────────┐    ║
║  │⚡ Energia │    │ 💧 Água   │    ║
║  │      ✓   │    │      ○   │    ║
║  └──────────┘    └──────────┘    ║
║                                   ║
║  ┌──────────┐    ┌──────────┐    ║
║  │🏢Condomínio│   │ 🔥 Gás    │   ║
║  │      ✓   │    │      ○   │    ║
║  └──────────┘    └──────────┘    ║
╚═══════════════════════════════════╝

Cada conta tem seu ícone:
⚡ Energia  💧 Água  🏢 Condomínio  🔥 Gás
```

---

## 🎯 Regras de Exibição

| Conta         | Quando Aparece                      |
| ------------- | ----------------------------------- |
| ⚡ Energia    | **Sempre** (obrigatória)            |
| 💧 Água       | Se `statusAgua` = "SIM" no contrato |
| 🏢 Condomínio | Se `solicitarCondominio` = "sim"    |
| 🔥 Gás        | Se `solicitarGas` = "sim"           |

**Resultado**: Cada contrato mostra apenas as contas que foram configuradas!

---

## ✅ Checklist Rápido

- [ ] Migração aplicada no Supabase
- [ ] Servidor reiniciado
- [ ] Seção "Contas de Consumo" aparece nos cards
- [ ] Clique funciona e muda cor
- [ ] Status persiste após atualizar página (F5)

---

## 🆘 Problemas Comuns

### "Seção não aparece"

→ Aplicar migração SQL no Supabase

### "Erro ao clicar"

→ Verificar console do navegador (F12)

### "Nenhuma conta aparece"

→ Verificar se contrato tem contas configuradas (energia sempre aparece)

---

## 📞 Onde Obter Ajuda

- **Console do navegador**: F12 → Console (mostra erros)
- **Supabase Dashboard**: Verificar Table Editor → contract_bills
- **Documentação completa**: `IMPLEMENTATION_SUMMARY.md`
- **Checklist detalhado**: `CHECKLIST.md`
- **Instruções de migração**: `MIGRATION_INSTRUCTIONS.md`

---

## 🎉 Pronto!

Depois de aplicar a migração e reiniciar, o sistema está **100% funcional**!

Cada clique salva automaticamente no Supabase. Não precisa clicar em "Salvar".

**É só clicar e pronto!** ⚡
