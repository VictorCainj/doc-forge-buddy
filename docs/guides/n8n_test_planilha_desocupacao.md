# Testes e Reconciliação – Integração Planilha Oficial

## 1. Testes Automatizados (App)

| Cenário | Caminho | Expectativa |
| --- | --- | --- |
| Criação de contrato | `CadastrarContrato.handleSubmit` | Após sucesso, `notifyContractCreated` é chamado com `versao = 1`. |
| Atualização de contrato | `CadastrarContrato.handleSubmit` e `EditarContrato.handleSubmit` | `versao` incrementa, diff enviado contém campos alterados. |
| Atualização de contas | `useContractBills.toggleBillDelivery` | Evento `contrato.status_conta.alterado` enviado com `bill_type` correto. |

> Sugerido: adicionar testes unitários com mocks para `notifyContractCreated/Updated` usando `vitest`.

## 2. Testes End-to-End (Manual)

1. Importar payloads de `scripts/payloads/*.json` no webhook de teste do n8n.
2. Verificar se a planilha principal é atualizada corretamente (colunas e status).
3. Confirmar append no histórico com resumo JSON.
4. Simular falha no Google Sheets (ex.: remover permissão) e validar alerta no Slack.

## 3. Reconciliação Periódica

- Crie job no n8n (Cron semanal) que:
  1. Consulta Supabase (`saved_terms`) com `supabase` node ou HTTP.
  2. Lê a planilha (aba principal).
  3. Executa Function comparando `hash` e `versao`.
  4. Preenche aba `Inconsistências` com divergências.
  5. Envia relatório resumido via Slack/Email.
- Alternativa: adicionar rota `GET /planilha/desocupacao/reconciliar` que executa o fluxo sob demanda.

## 4. Observabilidade

- Habilitar `Execution Data Save` nas opções do workflow.
- Configurar alerta de falha (Slack) agregando `{{$json.error}}` e `{{$json.executionId}}`.
- Registrar métricas de throughput (número de eventos por dia) em dashboard separado (Grafana/Prometheus, opcional).
