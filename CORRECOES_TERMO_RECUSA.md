# Correções no Termo de Recusa de Assinatura PDF

## Data: 12 de outubro de 2025

## Solicitações do Usuário

1. **Correção do tratamento de gênero**: Alterar "Prezado(a)" para tratamento automático baseado no gênero do locatário
2. **Opção de data personalizável**: Permitir escolher a data da Vistoria ou Revistoria (antes estava fixo como "11 de outubro de 2025")

## Mudanças Implementadas

### 1. Template do PDF (`src/templates/documentos.ts`)

**Linha 518 - Antes:**

```html
<p style="margin-bottom: 20px;">
  Prezado (a) - <strong>{{nomeLocatarioFormatado}}</strong>
</p>
```

**Linha 518 - Depois:**

```html
<p style="margin-bottom: 20px;">
  {{locatarioPrezado}} Sr.(a) <strong>{{nomeLocatarioFormatado}}</strong>
</p>
```

**Linha 520 - Antes:**

```html
<p style="margin-bottom: 20px; text-align: justify;">
  Informamos que a vistoria de saída do imóvel localizado em
  <strong>{{enderecoImovel}}</strong> foi realizada na data de
  <strong>{{dataVistoria}}</strong>, conforme previsto em contrato.
</p>
```

**Linha 520 - Depois:**

```html
<p style="margin-bottom: 20px; text-align: justify;">
  Informamos que a {{tipoVistoriaTextoMinusculo}} do imóvel localizado em
  <strong>{{enderecoImovel}}</strong> foi realizada na data de
  <strong>{{dataVistoria}}</strong>, conforme previsto em contrato.
</p>
```

#### Benefícios:

- `{{locatarioPrezado}}` gera automaticamente "Prezado" ou "Prezada" baseado no gênero do locatário
- `{{tipoVistoriaTextoMinusculo}}` exibe "vistoria" ou "revistoria" automaticamente
- `{{dataVistoria}}` agora é preenchido com a data personalizada do modal

### 2. Página de Contratos (`src/pages/Contratos.tsx`)

#### Mudança 1: Suporte ao PDF no modal de Recusa (linhas 183-187)

```typescript
} else if (documentType === 'Termo de Recusa de Assinatura - E-mail' ||
           documentType === 'Termo de Recusa de Assinatura - PDF') {
  actions.selectContract(contract);
  actions.setPendingDocument({ contract, template, documentType });
  actions.openModal('recusaAssinatura');
```

#### Mudança 2: Geração de variáveis de tipo de vistoria (linhas 329-338)

```typescript
const tipoVistoriaTexto =
  state.formData.tipoVistoriaRecusa === 'revistoria'
    ? 'revistoria'
    : 'vistoria';
enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
enhancedData.tipoVistoriaTextoMinusculo = tipoVistoriaTexto.toLowerCase();
enhancedData.tipoVistoriaTextoMaiusculo = tipoVistoriaTexto.toUpperCase();

// Usar dataRealizacaoVistoria como dataVistoria para o template
enhancedData.dataVistoria = state.formData.dataRealizacaoVistoria;
```

#### Mudança 3: Usar template dinâmico (linhas 340-348)

```typescript
// Usar o template correto baseado no tipo de documento
const template = state.pendingDocument.template;
const documentType = state.pendingDocument.documentType;

const processedTemplate = processContractTemplate(template, enhancedData);
const documentTitle = `${documentType} - ${state.selectedContract.title}`;
```

### 3. Modal de Contratos (`src/features/contracts/components/ContractModals.tsx`)

**Linha 167 - Título dinâmico do modal:**

```typescript
<DialogTitle>{pendingDocument?.documentType || 'Termo de Recusa de Assinatura'}</DialogTitle>
```

## Funcionalidades Implementadas

### Modal de Configuração

O modal permite ao usuário configurar:

1. **Tipo de Vistoria**: Escolher entre "Vistoria" ou "Revistoria"
2. **Data Personalizada**: Inserir a data da vistoria/revistoria em formato livre (ex: "11 de outubro de 2025")
3. **Assinante**: Selecionar quem irá assinar o documento

### Tratamento Automático de Gênero

- **Masculino**: "Prezado Sr.(a) [Nome]"
- **Feminino**: "Prezada Sr.(a) [Nome]"
- **Múltiplos locatários**: "Prezado Sr.(a) [Nomes]"

### Texto Dinâmico de Vistoria

- Se selecionado "Vistoria": "Informamos que a **vistoria** do imóvel..."
- Se selecionado "Revistoria": "Informamos que a **revistoria** do imóvel..."

## Variáveis Disponíveis

### Variáveis de Gênero do Locatário

- `{{locatarioPrezado}}`: "Prezado" ou "Prezada" (gerado automaticamente)
- `{{locatarioPrezadoWhatsapp}}`: Primeiro(s) nome(s) formatado(s)
- `{{locatarioDocumentacao}}`: "do locatário" ou "da locatária"

### Variáveis de Tipo de Vistoria

- `{{tipoVistoriaTexto}}`: "vistoria" ou "revistoria"
- `{{tipoVistoriaTextoMinusculo}}`: "vistoria" ou "revistoria" (minúsculo)
- `{{tipoVistoriaTextoMaiusculo}}`: "VISTORIA" ou "REVISTORIA" (maiúsculo)

### Variáveis de Data

- `{{dataVistoria}}`: Data personalizada da vistoria/revistoria
- `{{dataRealizacaoVistoria}}`: Mesma data (alias)
- `{{dataAtual}}`: Data atual formatada

## Fluxo de Geração

1. Usuário clica em "Termo de Recusa - PDF" (ou E-mail) no menu de ações rápidas
2. Sistema abre modal com campos de configuração
3. Usuário seleciona:
   - Tipo: Vistoria ou Revistoria
   - Data: Data personalizada (ex: "11 de outubro de 2025")
   - Assinante: Victor Cain Jorge ou Sérgio Henrique Cruz
4. Sistema gera documento com:
   - Tratamento de gênero correto ("Prezado" ou "Prezada")
   - Tipo de vistoria correto no texto
   - Data personalizada inserida
5. Documento é navegado para página de geração de PDF

## Resultado Final

O documento PDF agora:

- ✅ Trata automaticamente o gênero do destinatário
- ✅ Permite escolher entre Vistoria ou Revistoria
- ✅ Permite inserir qualquer data personalizada
- ✅ Mantém todos os outros dados do contrato
- ✅ Funciona tanto para E-mail quanto para PDF

## Arquivos Modificados

1. `src/templates/documentos.ts` - Template atualizado
2. `src/pages/Contratos.tsx` - Lógica de geração de documentos
3. `src/features/contracts/components/ContractModals.tsx` - Título dinâmico do modal
