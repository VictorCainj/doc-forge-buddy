# 🔍 Debug da Seleção de Contratos

## Instruções para Testar

1. **Acesse o Painel Admin**: `/admin`
2. **Vá para "Edição em Massa"**
3. **Selecione "saved_terms" no dropdown**
4. **Abra o Console do Navegador** (F12 → Console)

## O que Verificar nos Logs

### ✅ Logs Esperados

```javascript
// 1. Dados carregados
Dados carregados: { selectedEntity: "saved_terms", items: [...] }

// 2. Estado de seleção
Estado atual: { selectedIds: [], selectedCount: 0, itemsLength: X }

// 3. Renderização dos itens
Renderizando item: { id: "uuid-123", title: "Contrato 123", isSelected: false }

// 4. Quando clicar no checkbox
Checkbox clicado: { id: "uuid-123", checked: true }
```

### ❌ Possíveis Problemas

1. **"items: null"** → Problema na consulta ao banco
2. **"items: []"** → Nenhum contrato encontrado
3. **"isSelected: undefined"** → Problema no hook useBulkEdit
4. **Checkbox não responde** → Problema no componente Checkbox

## Teste Manual

1. Clique em um checkbox
2. Verifique se aparece: `Checkbox clicado: { id: "...", checked: true }`
3. Verifique se o `selectedCount` aumenta
4. Verifique se o texto "ID: ... | Selecionado: Sim" aparece

## Se Ainda Não Funcionar

Me envie os logs do console para eu poder diagnosticar o problema específico.
