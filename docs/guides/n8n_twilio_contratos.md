# Workflow n8n + Twilio para Notificar Criação ou Edição de Contratos

## 1. Pré-requisitos
1. Conta ativa no [n8n Cloud](https://cainbrasil23.app.n8n.cloud/).
2. Conta no [Twilio](https://console.twilio.com/) com acesso ao Sandbox de WhatsApp.
3. Ferramenta para disparar requisições HTTP (Postman, curl ou sistema que envia os contratos).
4. Tokens guardados com segurança: `Account SID`, `Auth Token` (Twilio) e URL do webhook do n8n.

## 2. Conectar ao Twilio WhatsApp Sandbox
1. Acesse `Messaging > Try it out > Send a WhatsApp message` no console Twilio.
2. No painel **Connect to sandbox**, escaneie o QR code ou envie manualmente o texto sugerido para o número do sandbox.
3. Aguarde a confirmação via WhatsApp de que o sandbox foi vinculado ao seu número.
4. Registre os dados exibidos: `Sandbox Number`, `Sandbox Keyword` e `ACCOUNT SID/AUTH TOKEN` (menu **Account Info**).
5. Ainda no Twilio, abra a aba **Sandbox settings** e copie a URL base de API: `https://api.twilio.com/2010-04-01/Accounts/{AccountSID}/Messages.json`.

## 3. Criar o Workflow no n8n
1. Entre em `My workflow` no n8n e clique em `Add first step` escolhendo **Webhook**.
2. Em **Path**, informe `/contratos` (ou outro identificador) e mantenha `HTTP Method` como `POST`.
3. Clique em **Save** para gerar as URLs de teste e produção.
4. Pressione **Listen for test event** para deixar o webhook aguardando requisições.
5. Copie a `Test URL` para usar nos testes iniciais.

## 4. Adicionar o nó de requisição HTTP
1. Clique no `+` após o nó `Webhook` e selecione **HTTP Request**.
2. Configure conforme abaixo:
   - `Method`: `POST`
   - `URL`: `https://api.twilio.com/2010-04-01/Accounts/{{$env.TWILIO_ACCOUNT_SID}}/Messages.json`
   - `Authentication`: `Basic Auth`
   - `Username`: `{{$env.TWILIO_ACCOUNT_SID}}`
   - `Password`: `{{$env.TWILIO_AUTH_TOKEN}}`
3. Em **Send Body** altere para `JSON` e habilite `Use JSON/RAW Parameters`.
4. No campo `Body Parameters`, inclua:
   - `To`: número do destinatário no formato E.164 (ex.: `55XXXXXXXXXXX`).
   - `From`: número do sandbox Twilio (ex.: `whatsapp:+14155238886`).
   - `Body`: mensagem personalizada. Use expressões do n8n com o ícone `{ }`:
     ```
     Contrato {{$json.id}} ({{$json.status}}) para o cliente Sr. {{$json.cliente}} foi atualizado em {{$json.dataAtual | formatDate("DD [de] MMMM [de] YYYY")}}.
     ```
5. Caso a entrada não possua `dataAtual`, adicione um nó **Set** antes do HTTP Request com o campo `dataAtual` e valor `={{$now}}`.

## 5. Testar o Fluxo Completo
1. No n8n, clique em **Test workflow**.
2. Envie um `POST` para a `Test URL` usando curl ou Postman com JSON de exemplo:
   ```json
   {
     "id": 456,
     "cliente": "Sr. Carlos Souza",
     "status": "assinado",
     "valor": 12000
   }
   ```
3. Verifique se o nó `Webhook` registrou os dados em `OUTPUT`.
4. Observe o nó `HTTP Request`. Se retornar `Status 201`, a mensagem foi aceita pelo Twilio.
5. Confirme no aplicativo WhatsApp que a mensagem foi recebida com o texto corretamente formatado.
## 6. Ativar em Produção
1. No nó `Webhook`, copie a `Production URL` exibida após salvar.
2. Desative o modo de teste (botão `Stop listening`) e altere o toggle global de `Inactive` para `Active`.
3. Configure o seu sistema de contratos para enviar `POST` para a `Production URL` sempre que um contrato for criado ou atualizado.
4. Opcional: use um nó **IF** antes do HTTP Request para disparar apenas quando `status` estiver em valores específicos (ex.: `assinado`).

## 7. Boas Práticas e Observações
- Armazene `TWILIO_ACCOUNT_SID` e `TWILIO_AUTH_TOKEN` em `Settings > Credentials` do n8n, usando credenciais do tipo **HTTP Basic Auth**; atualize o nó `HTTP Request` para referenciá-las.
- No ambiente de produção Twilio (fora do Sandbox) é necessário criar templates aprovados e ativar um número oficial.
- Para múltiplos destinatários, use um nó **Split In Batches** após o Webhook, enviando uma mensagem por iteração.
- Registre logs das execuções em `Executions` no n8n; configure alertas caso o nó `HTTP Request` retorne erros repetidos.
- Respeite a LGPD: envie somente os dados necessários na mensagem e obtenha consentimento dos clientes para notificações via WhatsApp.

## 8. Checklist Rápido
- [ ] Webhook do n8n criado, salvo e ativo.
- [ ] Twilio Sandbox conectado e credenciais armazenadas.
- [ ] Mensagem personalizada usando variáveis do contrato.
- [ ] Teste executado com sucesso (Status 201 e WhatsApp recebido).
- [ ] Sistema de contratos apontando para a `Production URL`.

## 9. Automação via API (opcional)
1. No n8n Cloud, vá em `Settings > User Management > Personal Access Tokens` e clique em `Create Token`. Copie o token gerado.
2. Faça download do arquivo `scripts/n8n_workflow_contratos.json` deste repositório para a máquina que executará o comando.
3. Execute o `curl` abaixo (substitua `<TOKEN>` pelo Personal Access Token e `<SUBDOMINIO>` pelo prefixo do seu workspace, ex.: `cainbrasil23`).
   ```bash
   curl -X POST "https://<SUBDOMINIO>.app.n8n.cloud/rest/workflows" ^
     -H "Content-Type: application/json" ^
     -H "X-N8N-API-KEY: <TOKEN>" ^
     --data-binary @scripts/n8n_workflow_contratos.json
   ```
4. O workflow será criado em estado inativo. Abra o n8n para:
   - Ajustar o campo `To` com o número real;
   - Configurar as credenciais Basic Auth (Twilio) no nó `HTTP Request`;
   - Ativar o fluxo quando estiver pronto.
5. Para atualizar o workflow futuramente, use `PATCH /api/v1/workflows/<ID>` com o mesmo arquivo (e o campo `id` preenchido) ou atualize manualmente na interface.
