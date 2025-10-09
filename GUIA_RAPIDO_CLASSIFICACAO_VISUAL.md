# 🎨 Guia Rápido: Sistema de Classificação Visual

## ⚡ Resumo Ultra Rápido

**Novidade**: Documentos de Análise de Vistoria agora têm um **resumo visual colorido** no início!

- 🟢 **Verde** = Responsabilidade do Locatário
- 🔴 **Vermelho** = Passível de Revisão

---

## 📝 Como Usar (3 Passos)

### 1️⃣ Escreva as Observações Normalmente

Ao criar/editar apontamentos, preencha o campo **"Considerações Departamento de Rescisão"** com:

#### Para marcar como VERDE (Responsabilidade):

```
✅ "Responsabilidade do locatário"
✅ "Deverá ser reparado pelo inquilino"
✅ "Dano causado por mau uso"
✅ "Obrigação do locatário consertar"
```

#### Para marcar como VERMELHO (Revisão):

```
⚠️ "Passível de revisão"
⚠️ "Apontamento contestado"
⚠️ "Não procede, necessita reavaliação"
⚠️ "Discordamos deste item"
```

### 2️⃣ Gere o Documento

Clique em **"Gerar Documento"** como sempre.

### 3️⃣ Veja o Resultado

O documento terá automaticamente:

- ✅ Resumo visual colorido no início
- ✅ Classificação automática dos itens
- ✅ Contador de itens por categoria
- ✅ Legenda explicativa

---

## 🎯 Palavras Mágicas (Classificação Automática)

### 🟢 VERDE - Responsabilidade do Locatário

| Palavra/Frase                   | Exemplo de Uso                                 |
| ------------------------------- | ---------------------------------------------- |
| `responsabilidade do locatário` | "Este é de responsabilidade do locatário"      |
| `responsabilidade locatário`    | "Responsabilidade locatário conforme contrato" |
| `deverá ser reparado`           | "O dano deverá ser reparado"                   |
| `deve ser consertado`           | "Deve ser consertado pelo inquilino"           |
| `dano causado`                  | "Dano causado durante a locação"               |
| `mau uso`                       | "Resultado de mau uso do equipamento"          |
| `negligência`                   | "Negligência na manutenção"                    |
| `obrigação do locatário`        | "É obrigação do locatário reparar"             |

### 🔴 VERMELHO - Passível de Revisão

| Palavra/Frase           | Exemplo de Uso                       |
| ----------------------- | ------------------------------------ |
| `contestado`            | "Apontamento contestado pela defesa" |
| `revisar`               | "Item precisa ser revisado"          |
| `revisão`               | "Necessita revisão das evidências"   |
| `discordar`             | "Discordamos deste apontamento"      |
| `não procede`           | "O apontamento não procede"          |
| `passível de revisão`   | "Item passível de revisão"           |
| `necessita reavaliação` | "Necessita reavaliação técnica"      |
| `análise necessária`    | "Análise necessária das fotos"       |

---

## 📋 Exemplos Práticos

### Exemplo 1: Responsabilidade Clara (Verde)

**Campo "Considerações":**

```
O dano na porta é claramente visível nas fotos da vistoria final e não
consta no laudo de entrada. Este item é de responsabilidade do locatário
e deverá ser reparado ou ressarcido.
```

**Resultado**: Aparecerá na seção **VERDE** ✅

---

### Exemplo 2: Item Contestado (Vermelho)

**Campo "Considerações":**

```
Este apontamento está sendo contestado pois as fotos da vistoria de
entrada mostram que a mancha já existia. O item é passível de revisão
e não deve ser cobrado do locatário.
```

**Resultado**: Aparecerá na seção **VERMELHA** ⚠️

---

### Exemplo 3: Múltiplas Classificações

**Apontamento 1 - SALA:**

```
Responsabilidade do locatário. Pintura necessária.
```

→ VERDE ✅

**Apontamento 2 - COZINHA:**

```
Item contestado, necessita revisão das fotos.
```

→ VERMELHO ⚠️

**Apontamento 3 - QUARTO:**

```
Dano causado durante a locação, deverá ser reparado.
```

→ VERDE ✅

**Resultado no Documento:**

```
┌─────────────────────────────────┐
│  🟢 RESPONSABILIDADES (Verde)   │
│  • SALA - Pintura               │
│  • QUARTO - Dano na porta       │
│  [2 itens]                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🔴 PASSÍVEIS REVISÃO (Vermelho)│
│  • COZINHA - Armário danificado │
│  [1 item]                       │
└─────────────────────────────────┘
```

---

## ⚙️ Configurações e Comportamento

### Quando o Resumo Aparece?

✅ **SIM** - Aparece quando:

- Documento em modo **"Análise"**
- Há pelo menos 1 apontamento com observação
- Observação contém palavras-chave de classificação

❌ **NÃO** - Não aparece quando:

- Documento em modo **"Orçamento"**
- Nenhum apontamento tem observação
- Observações não contêm palavras-chave

### Classificação Padrão

Se um apontamento **TEM observação** mas **NÃO TEM palavras-chave**:
→ Vai para a seção **VERDE** (responsabilidade) por padrão

Se um apontamento **NÃO TEM observação**:
→ Não aparece no resumo visual

---

## 🎨 Aparência do Resumo

### Layout Lado a Lado

```
╔════════════════════╦════════════════════╗
║                    ║                    ║
║   🟢 VERDE         ║   🔴 VERMELHO      ║
║   Responsab.       ║   Revisão          ║
║                    ║                    ║
║   • Item 1         ║   • Item 1         ║
║   • Item 2         ║   • Item 2         ║
║   • Item 3         ║                    ║
║                    ║                    ║
║   [3 itens]        ║   [2 itens]        ║
║                    ║                    ║
╚════════════════════╩════════════════════╝

        📖 LEGENDA EXPLICATIVA
```

### Cores Usadas

| Elemento | Cor Verde              | Cor Vermelha              |
| -------- | ---------------------- | ------------------------- |
| Fundo    | Verde claro (#D1FAE5)  | Vermelho claro (#FEE2E2)  |
| Borda    | Verde escuro (#10B981) | Vermelho escuro (#EF4444) |
| Badge    | Verde (#10B981)        | Vermelho (#EF4444)        |
| Texto    | Verde escuro (#065F46) | Vermelho escuro (#991B1B) |

---

## 💡 Dicas e Boas Práticas

### ✅ DO (Faça)

1. **Seja Claro**: Use as palavras-chave exatas
2. **Seja Específico**: Explique o motivo da classificação
3. **Seja Consistente**: Use o mesmo padrão em todos os apontamentos
4. **Revise**: Verifique se a classificação está correta antes de gerar

### ❌ DON'T (Não Faça)

1. **Não Seja Vago**: "Problema na parede" → Não será classificado
2. **Não Misture**: Não use palavras de ambas as categorias na mesma observação
3. **Não Esqueça**: Sempre preencha as observações para classificar
4. **Não Improvise**: Use as palavras-chave documentadas

---

## 🔍 Troubleshooting (Resolução de Problemas)

### ❓ "O resumo não aparece no documento"

**Possíveis causas:**

1. Documento está em modo "Orçamento" → Mude para "Análise"
2. Nenhum apontamento tem observação → Adicione observações
3. Observações não têm palavras-chave → Use as palavras mágicas

---

### ❓ "Item foi para a categoria errada"

**Solução:**

1. Verifique as palavras-chave usadas
2. Prioridade: VERMELHO > VERDE
3. Se tem palavra de revisão, sempre vai para VERMELHO
4. Edite a observação e regenere o documento

---

### ❓ "Quero que item X fique em categoria diferente"

**Solução:**

1. Edite o apontamento
2. Modifique a observação para incluir as palavras-chave corretas:
   - Para VERDE: adicione "responsabilidade do locatário"
   - Para VERMELHO: adicione "passível de revisão"
3. Gere o documento novamente

---

## 📞 Suporte Rápido

### Quer Classificar Como VERDE?

Use: **"responsabilidade do locatário"** ✅

### Quer Classificar Como VERMELHO?

Use: **"passível de revisão"** ⚠️

### Não Quer Classificar?

Deixe o campo de observação vazio ou não use palavras-chave ⭕

---

## 🎯 Checklist Antes de Gerar

- [ ] Revisei todos os apontamentos
- [ ] Preenchi as observações com palavras-chave adequadas
- [ ] Verifiquei que está em modo "Análise" (não "Orçamento")
- [ ] Conferi se as classificações estão corretas
- [ ] Pronto para gerar o documento! 🚀

---

## 📊 Estatísticas de Uso

Após gerar o documento, você verá:

- ✅ Quantidade de itens na seção VERDE
- ⚠️ Quantidade de itens na seção VERMELHA
- 📋 Total de apontamentos processados

---

## 🎉 Resultado Final

Um documento profissional, claro e fácil de entender que:

- ✅ Facilita a compreensão do locatário
- ✅ Reduz questionamentos
- ✅ Agiliza o processo de rescisão
- ✅ Mantém organização visual

**Use as palavras-chave, gere o documento e veja a mágica acontecer!** 🪄✨
