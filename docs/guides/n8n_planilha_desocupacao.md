# Plano Operacional: Sincronização App ↔ n8n ↔ Planilha de Desocupação

## 1. Eventos do Aplicativo que Devem Disparar o n8n

| Evento | Origem no código | Descrição | Observações |
| --- | --- | --- | --- |
| `contrato.criado` | `src/pages/CadastrarContrato.tsx` (`handleSubmit` ramo insert) | Disparado após inserção bem-sucedida na tabela `saved_terms`. | Necessário enviar `contract_id` retornado e `form_data` completo.
| `contrato.atualizado` | `src/pages/CadastrarContrato.tsx` (`handleSubmit` ramo update) e `src/pages/EditarContrato.tsx` (`handleSubmit`) | Acionado quando um contrato existente sofre alteração de qualquer campo. | Incluir diff calculado no frontend (campos alterados) para permitir atualização seletiva na planilha.
| `contrato.status_conta.alterado` | `src/hooks/useContractBills.ts` (`toggleBillDelivery` e `updateBillWithDate`) | Atualização de status de cada comprovante de consumo. | Enviar `bill_type`, `delivered`, `delivered_at` e `contract_id`.
| `contrato.vistoria.atualizada` | `src/features/notifications/utils/notificationAutoCreator.ts` (chamada indireta via agendamento de vistoria) | Quando houver novas datas de vistoria associadas ao contrato. | Vistoria gera colunas de monitoramento (`data_vistoria`, `dias_para_vistoria`).
| `contrato.notificacao.criada` | `NotificationAutoCreator` (`onContractCreated`, `onContractUpdated`) | Keep log para auditoria da planilha (coluna "Última ação n8n"). | Opcional: usar para preencher histórico/log.

## 2. Payload Canonical para o n8n

```json
{
  "evento": "contrato.criado",
  "timestamp": "2025-11-09T18:30:00.000Z",
  "versao": 3,
  "origem": "doc-forge-buddy-app",
  "usuario_id": "uuid",
  "contrato": {
    "id": "uuid",
    "numero": "13734",
    "status": "pendente",
    "dados": { /* form_data completo */ },
    "totem_metadados": {
      "hash": "sha256(form_data)",
      "ultima_atualizacao": "2025-11-09T18:30:00.000Z"
    }
  },
  "alteracoes": [
    {
      "campo": "dataTerminoRescisao",
      "valor_antigo": "2025-07-22",
      "valor_novo": "2025-07-25"
    }
  ],
  "contas": [
    {
      "tipo": "energia",
      "entregue": true,
      "data_entrega": "2025-06-30T12:00:00.000Z"
    }
  ],
  "vistoria": {
    "data": "2025-07-05",
    "dias_para_vistoria": 12
  }
}
```

- `versao`: inteiro incremental por contrato (começa em 1 na criação, somado a cada atualização). Servirá para controle de concorrência na planilha.
- `alteracoes`: pode ser vazio; preencher apenas quando detectar diffs relevantes no frontend.
- `contas`: refletir estado atual de cada comprovante.
- `vistoria`: opcional; preencher quando houver dados disponíveis em `contract.form_data.dataRealizacaoVistoria` ou `contract.data_vistoria`.

## 3. Estrutura da Planilha Oficial de Desocupação

| Coluna | Tipo | Fonte | Observações |
| --- | --- | --- | --- |
| `Contrato ID` | Texto | `contrato.id` | Chave primária; usar validação para evitar duplicatas. |
| `Número do Contrato` | Texto | `form_data.numeroContrato` | Usar fallback `contract.title` quando ausente. |
| `Locador` | Texto | `form_data.nomeProprietario` | Aplicar `splitNames` para primeira referência. |
| `Locatário` | Texto | `form_data.nomeLocatario` | Idem acima. |
| `Endereço` | Texto | `form_data.enderecoImovel` | Igual ao export atual. |
| `Motivo Desocupação` | Texto | `form_data.motivoDesocupacao` | |
| `Data Início Rescisão` | Data | `form_data.dataInicioRescisao` | n8n deve normalizar para AAAA-MM-DD. |
| `Data Término Rescisão` | Data | `form_data.dataTerminoRescisao` | |
| `Data Comunicação` | Data | `form_data.dataComunicacao` | |
| `Dias até Vistoria` | Número | Calculado (`vistoria.dias_para_vistoria`) | Atualizar a cada evento com data de vistoria. |
| `Status Energia` | Texto | `contas[tipo="energia"].entregue` → "Entregue"/"Pendente" | Pode usar validação de dados. |
| `Status Água` | Texto | idem | |
| `Status Condomínio` | Texto | idem | |
| `Status Gás` | Texto | idem | |
| `Status Notificação Rescisão` | Texto | idem | |
| `Status Entrega de Chaves` | Texto | idem | |
| `Última Atualização` | Data/hora | `timestamp` | Controlar gatilhos de auditoria. |
| `Versão` | Número | `versao` | Permite resolver conflitos. |
| `Última Ação` | Texto | `evento` + resumo (ex.: "contrato.atualizado: dataTerminoRescisao") | |
| `Hash Form Data` | Texto | `contrato.totem_metadados.hash` | Para verificação de integridade. |

### Abas Opcionais
- `Histórico`: log append-only com todos os eventos recebidos (colunas principais + JSON consolidado).
- `Inconsistências`: preenchida por job de reconciliação para listar divergências com Supabase.

## 4. Responsabilidades do n8n

1. Receber webhook autenticado → validar assinatura/API Key.
2. Enfileirar processamento (Queue ou Wait Node) para garantir idempotência por `contrato.id` + `versao`.
3. Atualizar planilha via nó oficial (Google Sheets/Excel) com upsert por `Contrato ID`.
4. Registrar no histórico e enviar alerta (Slack/Email) quando detectar `alteracoes` críticas (datas, motivo, status consumo).
5. Expor endpoint de reconciliamento (HTTP Node) para ser acionado pelo app/manual e gerar relatório na aba `Inconsistências`.

## 5. Próximos Passos Técnicos

- Definir variáveis de ambiente do app: `VITE_N8N_BASE_URL=https://cainbrasil.app.n8n.cloud`, `VITE_N8N_API_KEY=<MESMA_CHAVE_DO_WORKFLOW>`, `VITE_N8N_CONTRACT_WEBHOOK=https://cainbrasil.app.n8n.cloud/webhook/planilha/desocupacao`.
- Implementar serviço `src/integrations/n8n/contractsSync.ts` com funções `notifyContractCreated`, `notifyContractUpdated`, `notifyBillStatus`.
- Ajustar `handleSubmit` de cadastro/edição para enviar payload usando o serviço e atualizar `versao` local (armazenar em `saved_terms.form_data.versao`).
- Instrumentar `useContractBills` para chamar `notifyBillStatus` após atualizações bem-sucedidas.
- Criar testes unitários `src/integrations/n8n/__tests__/contractsSync.test.ts` simulando sucessos/erros e garantindo retries.
- No n8n, construir workflow com nós: `Webhook` → `Switch evento` → `Function (normalização)` → `Google Sheets (Upsert)` → `Append History` → `If (falha)` → `Slack/Email`.

## 6. Planilha Oficial em Produção

- URL: `https://docs.google.com/spreadsheets/d/1gm_e8QF3kpHJldP4WSDNkHstirVBqGPXE4mW4l8vKYo/edit?gid=1608369257#gid=1608369257`
- Abas ativas: `Janeiro 2025` a `Dezembro 2025` (todas as 12 abas já criadas, cada uma com o cabeçalho padrão descrito acima).
- Requisito de atualização: o workflow deve pesquisar o `Contrato ID` em **todas** as abas de 2025 antes de decidir se cria ou atualiza uma linha.
- Atualização de contratos existentes: ao receber `contrato.atualizado`, localizar a linha correspondente ao `Contrato ID` em qualquer aba de 2025, atualizar os campos necessários e manter a aba original.
- Criação de novos contratos: ao receber `contrato.criado`, inserir a linha na aba referente ao mês/ano atual (ex.: evento em março → aba `Março 2025`). Se a aba ainda não existir, criá-la automaticamente com o cabeçalho padrão.

### 7. Deploy – Variáveis na Vercel

1. Abra o projeto na Vercel e vá em **Settings → Environment Variables**.
2. Crie/atualize as chaves a seguir (use o arquivo `.env.production.example` como referência):
   - `VITE_N8N_BASE_URL` → `https://cainbrasil.app.n8n.cloud`
   - `VITE_N8N_CONTRACT_WEBHOOK` → `https://cainbrasil.app.n8n.cloud/webhook/planilha/desocupacao`
   - `VITE_N8N_API_KEY` → mesma chave cadastrada no node “Workflow Configuration” do n8n.
3. Salve as variáveis e inicie um **redeploy** (Botão “Deploy” ou “Redeploy” na aba Deployments).
4. Após o deploy, execute um teste real (criar/editar contrato) e verifique no n8n se o workflow rodou.
