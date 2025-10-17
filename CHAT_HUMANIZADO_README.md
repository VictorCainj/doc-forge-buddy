# Sistema de Chat Humanizado e Adaptativo

## Visão Geral

O sistema de Chat Humanizado foi completamente reconfigurado para funcionar como um **gerador de respostas automáticas inteligentes** que aprende com o estilo de comunicação do usuário e adapta respostas de acordo com o tom emocional das mensagens recebidas de locadores/locatários.

## Funcionalidades Implementadas

### 🧠 1. Sistema de Análise Emocional e Contextual

**Arquivos principais:**

- `src/utils/sentimentAnalysis.ts` - Análise de sentimento local
- `src/types/conversationProfile.ts` - Tipos para análise de mensagens

**Capacidades:**

- ✅ Detecção de emoções (irritação, dúvida, preocupação, gentileza, urgência)
- ✅ Identificação de nível de formalidade (formal, informal, neutro)
- ✅ Extração de contexto e intenção da mensagem
- ✅ Classificação de tipo de solicitação (pergunta técnica, reclamação, agradecimento, etc.)
- ✅ Análise via IA usando OpenAI para maior precisão
- ✅ Fallback para análise heurística local

### 👥 2. Sistema de Perfis de Comunicação por Pessoa

**Arquivos principais:**

- `src/hooks/useConversationProfiles.ts` - Gerenciamento de perfis
- `src/types/conversationProfile.ts` - Estrutura de dados

**Funcionalidades:**

- ✅ Perfis individuais para cada locador/locatário
- ✅ Histórico emocional e padrões de comunicação
- ✅ Armazenamento no localStorage com prefixo `conversation-profile-{personId}`
- ✅ Aprendizado automático baseado em interações
- ✅ Ajuste de tom e formalidade baseado no histórico
- ✅ Análise de padrões conversacionais

### 📋 3. Integração com Dados de Contratos

**Arquivos principais:**

- `src/utils/contextEnricher.ts` - Enriquecimento de contexto
- `src/hooks/useContractData.ts` - Acesso aos dados

**Capacidades:**

- ✅ Busca automática de informações do contrato
- ✅ Extração de dados relevantes (nome, endereço, datas, valores)
- ✅ Contextualização automática baseada na mensagem
- ✅ Preparação de contexto completo para a IA

### 🤖 4. Gerador de Respostas Humanizadas

**Arquivos principais:**

- `src/utils/responseGenerator.ts` - Orquestração da geração
- `supabase/functions/openai-proxy/index.ts` - Edge function OpenAI
- `src/utils/responseTemplates.ts` - Templates contextuais

**Funcionalidades:**

- ✅ Prompts adaptativos baseados na emoção detectada
- ✅ Uso de vocabulário similar ao perfil aprendido
- ✅ Manutenção do nível de formalidade adequado
- ✅ Geração de respostas empáticas e naturais
- ✅ Inclusão de informações do contrato quando relevante
- ✅ Fallback para templates quando a IA falha

### 🎨 5. Interface do Chat Aprimorada

**Arquivos principais:**

- `src/pages/Chat.tsx` - Interface principal atualizada
- `src/components/EmotionalInsightPanel.tsx` - Painel de análise emocional
- `src/types/chatModes.ts` - Configurações de modos

**Melhorias:**

- ✅ Seletor de modo de operação (Livre, Gerador, Assistente)
- ✅ Dropdown para seleção de contrato ativo
- ✅ Badges informativos (perfil ativo, contrato)
- ✅ Painel de análise emocional colapsável
- ✅ Instruções contextuais por modo
- ✅ Indicadores visuais de tom/emoção

### 📚 6. Sistema de Aprendizado Contínuo

**Arquivos principais:**

- `src/hooks/useConversationProfiles.ts` - Lógica de aprendizado
- `src/components/ChatMessage.tsx` - Botões de feedback

**Funcionalidades:**

- ✅ Feedback de respostas (👍 Resposta boa, 👎 Inadequada)
- ✅ Ajuste automático de perfis baseado no feedback
- ✅ Análise de padrões conversacionais ao longo do tempo
- ✅ Sugestões de melhorias baseadas no histórico
- ✅ Aprendizado incremental sem reconfiguração manual

### 🔊 7. Conversão Texto-para-Áudio (TTS)

**Arquivos principais:**

- `supabase/functions/openai-proxy/index.ts` - Implementação TTS
- `src/utils/responseGenerator.ts` - Integração TTS

**Capacidades:**

- ✅ Geração de áudio usando OpenAI TTS (modelo `tts-1`)
- ✅ Voz natural em português (`nova`)
- ✅ Retorno em base64 ou URL de dados
- ✅ Player de áudio integrado nas mensagens
- ✅ Opção de download do áudio gerado

### ⚙️ 8. Modos de Operação do Chat

**Arquivos principais:**

- `src/types/chatModes.ts` - Definição dos modos
- `src/pages/Chat.tsx` - Interface de seleção

**Modos disponíveis:**

- ✅ **Conversa Livre**: Assistente geral para qualquer assunto
- ✅ **Gerador de Respostas**: Gera respostas adaptadas para mensagens recebidas
- ✅ **Assistente de Contrato**: Assistente especializado com contexto do contrato

### 📝 9. Templates de Resposta Contextual

**Arquivos principais:**

- `src/utils/responseTemplates.ts` - Biblioteca de templates

**Templates por situação:**

- ✅ Solicitação de informação (ex: cor da tinta)
- ✅ Agendamento de vistoria
- ✅ Reclamação/insatisfação
- ✅ Dúvida sobre contrato
- ✅ Cobrança/pagamento

## Como Usar

### 1. Modo Gerador de Respostas

1. **Selecione o modo**: No cabeçalho, escolha "Gerador de Respostas"
2. **Vincule um contrato**: Use o dropdown para selecionar o contrato relevante
3. **Cole a mensagem**: Cole a mensagem recebida do locador/locatário
4. **Analise o resultado**: Veja a análise emocional e a resposta gerada
5. **Dê feedback**: Use os botões 👍/👎 para melhorar o aprendizado

### 2. Modo Assistente de Contrato

1. **Selecione o modo**: Escolha "Assistente de Contrato"
2. **Vincule um contrato**: Selecione o contrato para contextualizar
3. **Faça perguntas**: Pergunte sobre dados específicos do contrato
4. **Receba respostas**: Obtenha informações precisas e contextuais

### 3. Análise Emocional

1. **Envie uma mensagem**: No modo Gerador de Respostas
2. **Visualize a análise**: O painel emocional mostra:
   - Emoção detectada (positiva, negativa, frustrada, etc.)
   - Nível de formalidade
   - Urgência da mensagem
   - Tom sugerido para resposta
   - Contexto identificado
   - Sugestões de melhoria

## Exemplos de Funcionamento

### Entrada:

```
bom dia quero saber a cor da tinta pra pintar a parede.
```

### Resposta gerada pela IA:

```
Bom dia, [nome da pessoa, se disponível], tudo bem?
Vou verificar com o proprietário qual é a cor da tinta e te retorno assim que possível, tudo bem?
```

### Entrada:

```
Não concordo com os apontamentos e não irei assinar.
```

### Resposta gerada pela IA:

```
Entendo, Sr. [nome].
Podemos comparar a vistoria de entrada e a de saída para confirmar se todos os apontamentos estão corretos. Assim conseguimos esclarecer tudo da melhor forma.
```

## Arquitetura Técnica

### Fluxo de Geração de Resposta

1. **Análise da Mensagem**: Sistema detecta emoção, formalidade e contexto
2. **Busca de Perfil**: Localiza ou cria perfil conversacional da pessoa
3. **Enriquecimento de Contexto**: Busca dados relevantes do contrato
4. **Geração via IA**: OpenAI gera resposta adaptativa
5. **Validação**: Sistema valida qualidade da resposta
6. **Aprendizado**: Atualiza perfil baseado na interação
7. **Geração de Áudio**: Opcionalmente gera versão em áudio

### Estrutura de Dados

```typescript
interface ConversationProfile {
  personId: string;
  personName: string;
  personType: 'locador' | 'locatario';
  contractId?: string;
  communicationStyle: {
    formality: 'formal' | 'informal' | 'neutral';
    typicalTone: 'friendly' | 'professional' | 'direct' | 'empathetic';
    vocabularyLevel: 'simple' | 'intermediate' | 'complex';
  };
  emotionalHistory: Array<{
    message: string;
    detectedEmotion: string;
    timestamp: Date;
  }>;
  messagePatterns: {
    commonQuestions: string[];
    typicalGreetings: string[];
    responsePreferences: string[];
  };
  lastInteraction: Date;
}
```

## Benefícios

### Para o Usuário

- ✅ **Eficiência**: Respostas automáticas adaptadas ao contexto
- ✅ **Consistência**: Tom uniforme baseado no estilo de comunicação
- ✅ **Personalização**: Aprendizado contínuo de preferências
- ✅ **Profissionalismo**: Respostas sempre empáticas e adequadas

### Para o Negócio

- ✅ **Produtividade**: Redução do tempo gasto respondendo mensagens
- ✅ **Qualidade**: Padronização de comunicação profissional
- ✅ **Escalabilidade**: Sistema aprende e melhora automaticamente
- ✅ **Satisfação**: Clientes recebem respostas mais humanizadas

## Próximos Passos

### Testes (Pendente)

- [ ] Testes unitários para análise de sentimento
- [ ] Testes de integração para perfis conversacionais
- [ ] Testes de geração de respostas
- [ ] Testes de performance com múltiplos perfis

### Melhorias Futuras

- [ ] Integração com WhatsApp Business API
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard de métricas de comunicação
- [ ] Integração com CRM externo
- [ ] Análise de sentimento em tempo real

## Conclusão

O sistema de Chat Humanizado e Adaptativo foi completamente implementado com todas as funcionalidades solicitadas. O sistema agora é capaz de:

1. **Analisar** mensagens emocionalmente e contextualmente
2. **Adaptar** respostas ao estilo de comunicação aprendido
3. **Aprender** continuamente com feedback e interações
4. **Gerar** respostas humanizadas e profissionais
5. **Integrar** dados de contratos para contexto rico
6. **Suportar** múltiplos modos de operação
7. **Converter** texto em áudio natural

O sistema está pronto para uso em produção e pode ser facilmente expandido com novas funcionalidades conforme necessário.
