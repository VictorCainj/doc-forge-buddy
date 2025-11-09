# Check Notifications Edge Function

Esta função verifica periodicamente contratos próximos de expiração e vistorias agendadas, criando notificações automaticamente.

## Configuração

A função deve ser executada via cron job. Configure no Supabase Dashboard:

```sql
-- Executar diariamente às 9h
SELECT cron.schedule(
  'check-notifications-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/check-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  );
  $$
);
```

## Funcionalidades

1. Verifica contratos que expiram nos próximos 30 dias
2. Cria notificações de lembrete para vistorias agendadas para hoje ou amanhã
3. Limpa notificações expiradas e lidas

## Variáveis de Ambiente

- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
