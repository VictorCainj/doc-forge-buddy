# 🎨 Sistema de Classificação Visual de Apontamentos

## 🎯 Objetivo

Facilitar a compreensão dos locatários sobre suas responsabilidades através de um sistema visual com cores que classifica automaticamente os apontamentos em duas categorias claras.

## 🚀 Funcionalidade Implementada

### 📊 Resumo Visual com Cores

O sistema agora inclui duas seções destacadas no **início do documento de Análise de Vistoria**:

#### 1. 🟢 **Responsabilidades do Locatário** (Verde)

- **Cor**: Fundo verde claro com borda verde
- **Conteúdo**: Itens confirmados como responsabilidade do locatário
- **Significado**: Estes apontamentos deverão ser reparados ou pagos pelo locatário

#### 2. 🔴 **Passíveis de Revisão** (Vermelho)

- **Cor**: Fundo vermelho claro com borda vermelha
- **Conteúdo**: Itens contestados que necessitam reavaliação
- **Significado**: Estes apontamentos estão sendo questionados e podem ser reavaliados

## 🔍 Como Funciona a Classificação Automática

### Palavras-Chave para Responsabilidade do Locatário (Verde)

O sistema identifica automaticamente apontamentos com:

- "responsabilidade do locatário"
- "responsabilidade locatário"
- "deverá ser reparado"
- "deve ser consertado"
- "dano causado"
- "mau uso"
- "negligência"
- "obrigação do locatário"

### Palavras-Chave para Passíveis de Revisão (Vermelho)

O sistema identifica automaticamente apontamentos com:

- "contestado"
- "revisar"
- "revisão"
- "discordar"
- "não procede"
- "passível de revisão"
- "necessita reavaliação"
- "análise necessária"

### Lógica de Classificação

```typescript
1. Se a observação contém palavras de REVISÃO → Adiciona à lista VERMELHA
2. Se a observação contém palavras de RESPONSABILIDADE → Adiciona à lista VERDE
3. Se não contém nenhuma palavra-chave mas tem observação → Adiciona à lista VERDE (padrão)
4. Se não tem observação → Não aparece no resumo visual
```

## 📐 Design e Layout

### Posicionamento

- **Localização**: Logo após as informações do contrato
- **Antes de**: Detalhamento completo dos apontamentos

### Estrutura Visual

```
┌─────────────────────────────────────────┐
│     RESUMO DE APONTAMENTOS              │
├─────────────────┬───────────────────────┤
│                 │                       │
│   🟢 VERDE      │    🔴 VERMELHO        │
│  Responsab.     │   Passíveis           │
│  Locatário      │   Revisão             │
│                 │                       │
│  • Item 1       │   • Item 1            │
│  • Item 2       │   • Item 2            │
│  • Item 3       │                       │
│                 │                       │
│  3 itens        │   2 itens             │
└─────────────────┴───────────────────────┘
         ▼
  Legenda Explicativa
```

### Elementos de Design

1. **Gradientes Suaves**: Cores não agressivas, fáceis de visualizar
2. **Bordas Destacadas**: 2px de borda colorida para ênfase
3. **Badges de Contador**: Mostra quantidade de itens em cada categoria
4. **Ícones Visuais**: ✓ (verde) e ⚠ (vermelho)
5. **Legenda Explicativa**: Texto claro explicando o significado de cada cor

## 💡 Benefícios

### Para os Locatários

✅ **Clareza Imediata**: Identificam rapidamente o que é sua responsabilidade  
✅ **Fácil Compreensão**: Sistema de cores intuitivo (verde = OK, vermelho = atenção)  
✅ **Organização Visual**: Informação resumida antes dos detalhes  
✅ **Reduz Confusão**: Não precisam ler todo o documento para entender o resumo

### Para a Imobiliária

✅ **Menos Questionamentos**: Locatários entendem melhor suas obrigações  
✅ **Comunicação Clara**: Menos necessidade de explicações adicionais  
✅ **Profissionalismo**: Documento visualmente organizado e moderno  
✅ **Automático**: Sistema classifica automaticamente baseado nas observações

## 📝 Exemplo de Uso

### Como Escrever Observações para Classificação Correta

#### ✅ Para marcar como Responsabilidade do Locatário (Verde):

```
"Este dano é de responsabilidade do locatário e deverá ser reparado."
"Mau uso do equipamento causou o dano. Responsabilidade do locatário."
"Obrigação do locatário consertar conforme contrato."
```

#### ⚠️ Para marcar como Passível de Revisão (Vermelho):

```
"Este apontamento não procede e está sendo contestado."
"Passível de revisão, pois o dano já existia na entrada."
"Necessita reavaliação - fotos da entrada comprovam estado anterior."
"Discordamos deste apontamento, item precisa ser revisado."
```

## 🎨 Exemplo Visual do Resultado

### Seção Verde (Responsabilidades)

```html
╔══════════════════════════════════════════╗ ║ ✓ RESPONSABILIDADES DO LOCATÁRIO
║ ║ Itens confirmados como responsabilidade ║
╠══════════════════════════════════════════╣ ║ ║ ║ • SALA - Pintar as paredes ║
║ • COZINHA - Reparar armário ║ ║ • QUARTO - Substituir piso danificado ║ ║ ║ ║
[ 3 itens ] ║ ╚══════════════════════════════════════════╝
```

### Seção Vermelha (Passíveis de Revisão)

```html
╔══════════════════════════════════════════╗ ║ ⚠ PASSÍVEIS DE REVISÃO ║ ║ Itens
contestados que necessitam ║ ║ reavaliação ║
╠══════════════════════════════════════════╣ ║ ║ ║ • BANHEIRO - Manchas no teto
║ ║ • ÁREA DE SERVIÇO - Torneira ║ ║ ║ ║ [ 2 itens ] ║
╚══════════════════════════════════════════╝
```

## 🔧 Detalhes Técnicos

### Arquivo Modificado

- **Arquivo**: `src/templates/analiseVistoria.ts`
- **Linhas**: 169-307 (nova seção de classificação)

### Lógica de Implementação

```typescript
// 1. Classificar apontamentos
dados.apontamentos.forEach((apontamento) => {
  const observacao = apontamento.observacao?.toLowerCase() || '';
  const descricao = apontamento.descricao?.toLowerCase() || '';

  // Verificar palavras-chave
  if (temPalavrasRevisao) {
    passiveisRevisao.push(apontamento);
  } else if (temPalavrasResponsabilidade) {
    responsabilidadesLocatario.push(apontamento);
  }
});

// 2. Gerar HTML das seções coloridas
// 3. Adicionar antes do detalhamento dos apontamentos
```

### Quando Aparece o Resumo

O resumo visual **só aparece** quando:

- ✅ Modo do documento é "Análise" (não aparece em "Orçamento")
- ✅ Há pelo menos 1 apontamento classificado (verde ou vermelho)

## 🎯 Casos de Uso

### Caso 1: Análise com Responsabilidades Claras

```
Situação: 5 apontamentos, todos com observações claras
Resultado:
  - 4 itens na seção VERDE (responsabilidade confirmada)
  - 1 item na seção VERMELHA (contestado)
```

### Caso 2: Análise Totalmente Contestada

```
Situação: 3 apontamentos, todos contestados
Resultado:
  - 0 itens na seção VERDE
  - 3 itens na seção VERMELHA
```

### Caso 3: Análise sem Classificação

```
Situação: Apontamentos sem observações detalhadas
Resultado:
  - Resumo visual não aparece
  - Documento segue formato padrão
```

## 📊 Especificações de Cores

### Verde (Responsabilidades)

```css
Background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)
Border: 2px solid #10B981
Badge: #10B981
Text: #065F46
```

### Vermelho (Passíveis de Revisão)

```css
Background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)
Border: 2px solid #EF4444
Badge: #EF4444
Text: #991B1B
```

### Legenda

```css
Background: #F9FAFB
Border-left: 4px solid #6B7280
Text: #374151
```

## ✨ Recursos Adicionais

### Responsividade

- Layout em grid de 2 colunas
- Se apenas uma seção tiver itens, mantém layout lado a lado
- Design adaptável para impressão

### Acessibilidade

- Cores com contraste adequado
- Ícones complementam as cores
- Texto explicativo claro
- Legenda detalhada

### Impressão

- Cores otimizadas para impressão
- Layout mantém estrutura em papel
- Texto legível em preto e branco

## 🚀 Próximos Passos (Sugestões)

1. **Personalização**: Permitir que o usuário defina manualmente a categoria de cada apontamento
2. **Mais Categorias**: Adicionar categoria "Neutro" (amarelo) para itens sem definição clara
3. **Exportar Resumo**: Opção de exportar apenas o resumo visual
4. **Estatísticas**: Gráfico mostrando proporção de responsabilidades vs. revisões

## 📅 Implementação

- **Data**: 8 de outubro de 2025
- **Status**: ✅ **Implementado e Funcional**
- **Modo**: Apenas para documentos de "Análise" (não aparece em "Orçamento")
- **Automático**: Classificação baseada em palavras-chave nas observações

---

## 🎉 Conclusão

O sistema de classificação visual torna os documentos de análise de vistoria **muito mais fáceis de compreender** para os locatários, reduzindo confusões e questionamentos. A classificação automática baseada em palavras-chave garante consistência, enquanto o design minimalista e profissional mantém a credibilidade do documento.

**Resultado**: Comunicação mais clara, menos conflitos, e melhor experiência para todos! 🎯
