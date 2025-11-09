# Send Email - Edge Function

Esta edge function envia e-mails HTML com imagens embutidas usando a API Resend.

## Configuração

### 1. Obter API Key do Resend

1. Acesse https://resend.com
2. Crie uma conta (ou faça login)
3. Obtenha sua API Key na seção "API Keys"

### 2. Configurar variável de ambiente

```bash
supabase secrets set RESEND_API_KEY=re_sua_chave_aqui
```

Ou através do Dashboard do Supabase:
1. Acesse: Settings > Edge Functions
2. Adicione a variável: `RESEND_API_KEY` com sua chave da Resend

### 3. Configurar domínio no Resend

1. No dashboard do Resend, adicione seu domínio
2. Configure os registros DNS necessários
3. Use o domínio verificado no campo `from`

### 4. Deploy da Function

```bash
supabase functions deploy send-email
```

## Uso

### Requisição

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'destinatario@exemplo.com',
    subject: 'Assunto do e-mail',
    htmlContent: '<html>...</html>',
    fromEmail: 'DocForge <noreply@seudominio.com>', // Opcional
    fromName: 'DocForge', // Opcional
  },
});
```

### Resposta

```typescript
{
  success: true,
  messageId: "re_...",
  message: "E-mail enviado com sucesso"
}
```

## Formato HTML para E-mail

O HTML deve:
- Usar inline styles (não CSS externo)
- Usar imagens embutidas (base64) ou URLs públicas
- Ser compatível com clientes de e-mail (Gmail, Outlook, etc.)
- Ter largura máxima de 600px para melhor compatibilidade

## Exemplo de HTML Compatível

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Título</h1>
    <img src="data:image/jpeg;base64,..." style="max-width: 100%;">
    <p>Conteúdo...</p>
  </div>
</body>
</html>
```

