# Workflow n8n: Planilha Oficial de Desocupação

## Visão Geral

Este fluxo recebe eventos do aplicativo, normaliza os dados e atualiza duas abas da planilha oficial (principal e histórico). Ele também emite alertas no Slack quando há divergências ou falhas.

## Pré-requisitos

1. Conector Google Sheets configurado com acesso de edição à planilha oficial.
2. Credenciais do Slack (Webhook ou Bot) para envio de alertas.
3. Variáveis no n8n:
   - `N8N_PLANILHA_ID` – ID da planilha oficial.
   - `N8N_TAB_PRINCIPAL` – Nome da aba principal (ex.: `Oficial`).
   - `N8N_TAB_HISTORICO` – Nome da aba de histórico (ex.: `Historico`).
4. Mesma chave de API definida no app (`VITE_N8N_API_KEY`) cadastrada no n8n em `Credentials > HTTP Header Auth`.
## Estrutura do Workflow

1. **Webhook (Entrada App)**
   - Método: `POST`
   - Path sugerido: `planilha/desocupacao`
   - Autenticação: usar credencial de API Key.
2. **Function - Normalizar Evento**
   - Código abaixo (transforma payload para formato comum e calcula diffs faltantes).
3. **Switch - Tipo de Evento**
   - Expressão: `{{$json.evento}}`
   - Saídas: `contrato.criado`, `contrato.atualizado`, `contrato.status_conta.alterado`.
4. **Function - Montar Upsert**
   - Por ramo, normaliza colunas esperadas.
5. **Google Sheets - Upsert Principal**
   - Operação: `Upsert`
   - Chave: `Contrato ID`.
6. **Google Sheets - Append Histórico**
   - Operação: `Append`
   - Inserir linha com timestamp + resumo.
7. **IF - Verificar Erros/Alterações Críticas**
   - Condição: diffs contendo datas ou motivo.
8. **Slack - Alertar** (ramo verdadeiro)
   - Mensagem com resumo do evento e link da planilha.
9. **Respond to Webhook**
   - Retorno JSON `{ "status": "ok" }` e HTTP 200.
## Function Node: Normalizar Evento

```javascript
const payload = $json;

const vistoriaData = payload.vistoria?.data ?? null;
const diasVistoria = payload.vistoria?.dias_para_vistoria ?? null;

return [
  {
    ...payload,
    contratoId: payload.contrato.id,
    contratoNumero: payload.contrato.numero ?? 'N/A',
    contratoStatus: payload.contrato.status ?? 'indefinido',
    hashAtual: payload.contrato.totem_metadados?.hash ?? '',
    ultimaAtualizacao: payload.contrato.totem_metadados?.ultima_atualizacao,
    diasVistoria,
    vistoriaData,
    timestampRecebido: new Date().toISOString(),
  },
];
```

> Dica: adicione validações extras conforme necessário (ex.: verificar `versao`).
## Function Node: Montar Upsert (ex.: ramo contrato.atualizado)

```javascript
const evento = $json;

const contas = (evento.contas || []).reduce((acc, conta) => {
  acc[`Status ${conta.tipo.replace('_', ' ')}`] = conta.entregue ? 'Entregue' : 'Pendente';
  acc[`Data ${conta.tipo.replace('_', ' ')}`] = conta.data_entrega ?? '';
  return acc;
}, {});

return [
  {
    fields: {
      'Contrato ID': evento.contratoId,
      'Número do Contrato': evento.contratoNumero,
      'Locador': evento.contrato.dados?.nomeProprietario ?? '',
      'Locatário': evento.contrato.dados?.nomeLocatario ?? '',
      'Endereço': evento.contrato.dados?.enderecoImovel ?? '',
      'Motivo Desocupação': evento.contrato.dados?.motivoDesocupacao ?? '',
      'Data Início Rescisão': evento.contrato.dados?.dataInicioRescisao ?? '',
      'Data Término Rescisão': evento.contrato.dados?.dataTerminoRescisao ?? '',
      'Data Comunicação': evento.contrato.dados?.dataComunicacao ?? '',
      'Dias até Vistoria': evento.diasVistoria ?? '',
      'Última Atualização': evento.timestamp,
      'Versão': evento.versao,
      'Última Ação': `${evento.evento} - ${(evento.alteracoes || []).map((d) => d.campo).join(', ')}`,
      'Hash Form Data': evento.hashAtual,
      ...contas,
    },
    resumo: {
      evento: evento.evento,
      contratoId: evento.contratoId,
      contratoNumero: evento.contratoNumero,
      versao: evento.versao,
      timestamp: evento.timestampRecebido,
      diffs: evento.alteracoes ?? [],
    },
  },
];
```

> Crie variações do node para cada ramo, se necessário, reutilizando a mesma estrutura e ajustando campos específicos.
## Configuração dos Nós Google Sheets

- **Upsert Principal**
  - Planilha: `{{$env.N8N_PLANILHA_ID}}`
  - Aba: `{{$env.N8N_TAB_PRINCIPAL}}`
  - Modo: `Upsert`
  - Coluna de chave: `Contrato ID`
  - Campos → Bind pelo objeto `item.fields` vindo do Function.
- **Append Histórico**
  - Planilha: `{{$env.N8N_PLANILHA_ID}}`
  - Aba: `{{$env.N8N_TAB_HISTORICO}}`
  - Campos sugeridos: `timestamp`, `evento`, `contratoId`, `contratoNumero`, `versao`, `resumo` (`JSON.stringify(item.resumo)`).

## Slack Alert Node

Mensagem sugerida:

```
:warning: *{{ $json.evento }}* para contrato {{ $json.contratoNumero }} (ID {{ $json.contratoId }})
• Versão: {{ $json.versao }}
• Diffs: {{ ($json.alteracoes || []).map(d => `${d.campo}: ${d.valor_antigo} → ${d.valor_novo}`).join(', ') || 'sem alterações'}
```

Use bloco condicional para enviar apenas quando houver alterações críticas ou falhas no Google Sheets.
## Monitoramento e Observabilidade

- Adicione um nó **Function** após o Webhook para registrar métricas em `console.log` (o n8n salva em execução).
- Use o recurso **Execution Logging** do n8n para auditar chamadas e exportar relatórios semanais.
- Configure retries automáticos nos nós HTTP/Sheets (seção *Options → Continue On Fail* + *Retry*).
- Opcional: conecte um nó **Queue** (n8n Worker ou RabbitMQ) caso deseje serializar eventos por `contratoId`.

## Testes

1. Utilize o botão *Test* do Webhook, enviando o payload de exemplo do app (`scripts/payloads/contrato-criado.json` – crie conforme necessidade).
2. Valide se a linha é criada/atualizada corretamente na aba principal.
3. Confirme que o histórico recebe um append por evento.
4. Force um erro (ex.: desconecte o Google Sheets) e verifique se o Slack alerta foi emitido.
