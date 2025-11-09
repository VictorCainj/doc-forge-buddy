# OpenAI Proxy - Edge Function

Esta edge function faz proxy das chamadas à API da OpenAI para resolver problemas de CORS no frontend.

## Configuração

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Link ao projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

### 4. Configurar a API Key da OpenAI

Configure a variável de ambiente no Supabase:

```bash
supabase secrets set OPENAI_API_KEY=sk-sua-chave-aqui
```

Ou através do Dashboard do Supabase:

1. Acesse: Settings > Edge Functions
2. Adicione a variável: `OPENAI_API_KEY` com sua chave da OpenAI

### 5. Deploy da Function

```bash
supabase functions deploy openai-proxy
```

## Uso

A função aceita requisições POST com o seguinte formato:

```typescript
{
  action: 'correctText' | 'generateTask' | 'generateDailySummary',
  data: {
    text?: string,           // Para correctText
    situation?: string,      // Para generateTask
    tasks?: any[]           // Para generateDailySummary
  }
}
```

### Exemplos de Requisição

#### Corrigir Texto

```typescript
const { data, error } = await supabase.functions.invoke('openai-proxy', {
  body: {
    action: 'correctText',
    data: { text: 'texto com erros de gramatica' },
  },
});
```

#### Gerar Tarefa

```typescript
const { data, error } = await supabase.functions.invoke('openai-proxy', {
  body: {
    action: 'generateTask',
    data: { situation: 'Cliente atrasado há 3 meses...' },
  },
});
```

#### Gerar Resumo Diário

```typescript
const { data, error } = await supabase.functions.invoke('openai-proxy', {
  body: {
    action: 'generateDailySummary',
    data: {
      tasks: [{ status: 'completed', title: '...', description: '...' }],
    },
  },
});
```

## Resposta

```typescript
{
  success: boolean,
  content: string | object,  // String para correção/resumo, Object para tarefa
  error?: string             // Se success === false
}
```

## Logs e Debugging

Para ver os logs da função:

```bash
supabase functions logs openai-proxy
```

## Segurança

- A função valida os tipos de ação permitidos
- A API Key da OpenAI nunca é exposta ao frontend
- Headers CORS estão configurados para permitir requisições do frontend
- Todas as chamadas à OpenAI são feitas server-side

## Troubleshooting

### Erro 400: "OpenAI API Key não configurada"

- Verifique se a variável `OPENAI_API_KEY` está configurada
- Execute: `supabase secrets list` para ver as variáveis configuradas

### Erro de CORS

- Verifique se os headers CORS estão corretos
- O frontend deve usar `supabase.functions.invoke()` ao invés de `fetch()`

### Timeout

- Edge functions têm timeout de 60 segundos por padrão
- Para tarefas mais longas, considere aumentar o timeout ou dividir a operação
