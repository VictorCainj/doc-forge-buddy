# Devolutiva de Solicitação de Comprovantes de Consumo

## Template Criado

Foi criado o template `DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE` no arquivo `src/templates/documentos.ts`.

## Variáveis do Template

### Variáveis Obrigatórias:
- `{{dataAtual}}` - Data atual no formato brasileiro
- `{{numeroContrato}}` - Número do contrato
- `{{enderecoImovel}}` - Endereço completo do imóvel
- `{{saudacaoLocatario}}` - Saudação personalizada (ex: "Prezado João")
- `{{locatarioTerm}}` - Termo do locatário (o locatário, a locatária, os locatários)
- `{{mesesComprovantes}}` - Período dos comprovantes (ex: "outubro, novembro, dezembro de 2024")

### Variáveis de Documentos (Condicionais):
- `{{cpfl}}` - Se "SIM", solicita comprovante CPFL
- `{{statusAgua}}` - Se "SIM", solicita comprovante de água
- `{{solicitarGas}}` - Se "sim", solicita comprovante de gás
- `{{solicitarCondominio}}` - Se "sim", solicita comprovante de condomínio
- `{{solicitarCND}}` - Se "sim", solicita Certidão Negativa de Débitos
- `{{tipoAgua}}` - Tipo da concessionária de água (DAEV, SANASA)

## Exemplo de Uso

```typescript
// Dados do contrato
const contractData = {
  numeroContrato: "12345",
  enderecoImovel: "Rua das Flores, 123 - Centro - Valinhos/SP",
  nomeLocatario: "João Silva",
  generoLocatario: "masculino",
  mesesComprovantes: "outubro, novembro, dezembro de 2024",
  // ... outros dados
};

// Configuração dos documentos solicitados
const documentosData = {
  cpfl: "SIM", // Solicita comprovante CPFL
  statusAgua: "SIM", // Solicita comprovante de água
  tipoAgua: "DAEV",
  solicitarGas: "sim", // Solicita comprovante de gás
  solicitarCondominio: "nao", // Não solicita condomínio
  solicitarCND: "sim" // Solicita CND
};

// Processar dados com as variáveis de gênero
const processedData = applyConjunctions({
  ...contractData,
  ...documentosData
});

// Gerar documento
const documentContent = replaceTemplateVariables(
  DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
  processedData
);
```

## Características do Template

1. **Design Responsivo**: Layout adaptável para impressão e visualização
2. **Destaque Visual**: Seção destacada em azul para os documentos solicitados
3. **Concordância de Gênero**: Usa as variáveis `locatarioTerm` e `locatarioResponsabilidade`
4. **Flexibilidade**: Mostra apenas os documentos que devem ser solicitados
5. **Tom Profissional**: Linguagem formal mas respeitosa
6. **Foco em Documentação**: Solicita comprovantes e faturas dos últimos 3 meses
7. **Referência ao Contrato**: Menciona o endereço do imóvel e as contas configuradas no cadastro
8. **Flexibilidade do Gás**: Indica "(se houver)" para contas de gás

## Implementação no Sistema

Para implementar no sistema, será necessário:

1. Adicionar campos no formulário para capturar os valores das contas pendentes
2. Criar uma nova página/rota para gerar este tipo de documento
3. Integrar com o sistema de geração de documentos existente
4. Adicionar opção no menu de documentos disponíveis

## Exemplo de Saída

O documento gerado terá:
- Cabeçalho com logo da empresa
- Saudação personalizada
- Explicação sobre a solicitação de comprovantes com endereço do imóvel
- Referência às contas de consumo configuradas no cadastro do contrato
- Lista destacada dos documentos solicitados (comprovantes e faturas)
- Indicação "(se houver)" para contas de gás
- Instruções claras sobre envio dos documentos
- Tom profissional e respeitoso
- Foco na documentação dos últimos 3 meses
