 # Sistema de Design de Botões

## 📐 Componente ActionButton

Componente padronizado para todos os botões de ação na aplicação.

### Localização
`src/components/ui/action-button.tsx`

---

## 🎨 Variantes de Cor

### **Primary** (Ações Principais)
- **Cor**: Gradiente azul-indigo (`from-blue-500 to-indigo-600`)
- **Uso**: Ações primárias como "Criar", "Salvar", "Gerar Documento"
- **Exemplo**: Botão "Nova Análise", "Gerar Documento"

### **Secondary** (Ações Secundárias)
- **Cor**: Cinza escuro (`bg-slate-700`)
- **Uso**: Ações secundárias como "Salvar Análise", "Atualizar"
- **Exemplo**: Botão "Salvar Análise", "Cadastrar Prestador"

### **Success** (Confirmações)
- **Cor**: Verde (`bg-green-600`)
- **Uso**: Ações de confirmação ou sucesso
- **Exemplo**: Botões de confirmação

### **Danger** (Ações Destrutivas)
- **Cor**: Vermelho (`bg-red-600`)
- **Uso**: Ações destrutivas como deletar, limpar
- **Exemplo**: Botão "Deletar", "Limpar Tudo"

### **Warning** (Avisos)
- **Cor**: Laranja (`bg-orange-600`)
- **Uso**: Ações que requerem atenção
- **Exemplo**: Botões de alerta

### **Ghost** (Ações Sutis)
- **Cor**: Transparente com borda (`border-slate-600/50`)
- **Uso**: Ações secundárias discretas como editar
- **Exemplo**: Botão "Editar" nos cards

---

## 📏 Tamanhos

### **Small (sm)**
- Altura: `32px` (h-8)
- Ícone: `14px` (h-3.5 w-3.5)
- Uso: Botões em cards, ações inline

### **Medium (md)** - Padrão
- Altura: `36px` (h-9)
- Ícone: `16px` (h-4 w-4)
- Uso: Botões principais, formulários

### **Large (lg)**
- Altura: `40px` (h-10)
- Ícone: `20px` (h-5 w-5)
- Uso: Botões de destaque, CTAs

---

## 💡 Modos de Uso

### **Com Label**
```tsx
<ActionButton
  icon={Plus}
  label="Nova Análise"
  variant="primary"
  size="md"
  onClick={handleClick}
/>
```

### **Apenas Ícone**
```tsx
<ActionButton
  icon={Edit}
  variant="ghost"
  size="sm"
  iconOnly
  onClick={handleEdit}
  title="Editar"
/>
```

### **Com Loading**
```tsx
<ActionButton
  icon={Save}
  label="Salvando..."
  variant="secondary"
  loading={isSaving}
  onClick={handleSave}
/>
```

---

## 📋 Padrões por Contexto

### **Páginas de Listagem**
- **Criar Novo**: `variant="primary"`, `size="md"`, com label
- **Editar**: `variant="ghost"`, `size="sm"`, apenas ícone
- **Deletar**: `variant="danger"`, `size="sm"`, apenas ícone

### **Formulários**
- **Salvar/Criar**: `variant="primary"`, `size="md"`, com label
- **Cancelar**: `variant="ghost"`, `size="md"`, com label
- **Limpar**: `variant="danger"`, `size="sm"`, com label

### **Modais/Dialogs**
- **Confirmar**: `variant="primary"`, `size="md"`, com label
- **Cancelar**: `variant="ghost"`, `size="md"`, com label
- **Deletar**: `variant="danger"`, `size="md"`, com label

---

## ✅ Páginas Atualizadas

- ✅ **VistoriaAnalises** - Botões padronizados
- ✅ **AnaliseVistoria** - Botões principais padronizados
- ✅ **Prestadores** - Todos os botões padronizados

---

## 🎯 Benefícios

1. **Consistência Visual**: Todos os botões seguem o mesmo padrão
2. **Manutenibilidade**: Mudanças centralizadas em um componente
3. **Acessibilidade**: Títulos e labels consistentes
4. **Performance**: Componente memoizado evita re-renders
5. **UX**: Estados de loading e disabled padronizados
