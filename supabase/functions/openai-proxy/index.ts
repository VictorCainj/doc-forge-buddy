import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface OpenAIRequest {
  action:
    | 'correctText'
    | 'improveText'
    | 'generateTask'
    | 'generateDailySummary'
    | 'analyzeContracts'
    | 'chatCompletion'
    | 'analyzeImage'
    | 'generateImage'
    | 'transcribeAudio'
    | 'extractApontamentos'
    | 'analyzeMessageContext'
    | 'generateHumanizedResponse'
    | 'textToSpeech'
    | 'generateDualResponses'
    | 'extractNames';
  data: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, data }: OpenAIRequest = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API Key não configurada');
    }

    let messages: any[] = [];
    let maxTokens = 5000;
    let temperature = 0.3;
    let responseFormat: any = undefined;
    let model = 'gpt-4o-mini';

    // Configurar a chamada baseada na ação
    switch (action) {
      case 'correctText':
        if (!data.text) {
          throw new Error('Texto não fornecido');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente especializado em correção de texto em português brasileiro. 
          
          Suas tarefas são:
          1. Corrigir erros de gramática, ortografia e pontuação
          2. Melhorar a clareza e fluidez do texto
          3. Manter o tom e estilo original do autor
          4. Preservar a estrutura e formatação do texto
          5. Não alterar o significado ou conteúdo principal
          
          Responda APENAS com o texto corrigido, sem explicações adicionais.`,
          },
          {
            role: 'user',
            content: `Por favor, corrija o seguinte texto em português brasileiro:\n\n${data.text}`,
          },
        ];
        break;

      case 'improveText':
        if (!data.text) {
          throw new Error('Texto não fornecido');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente especializado em melhorar textos para máxima clareza e compreensão do destinatário em português brasileiro.
          
          Suas tarefas são:
          1. Corrigir erros de gramática, ortografia e pontuação
          2. Reestruturar o texto para máxima clareza e compreensão
          3. Melhorar a organização das ideias e fluxo lógico
          4. Tornar o texto mais direto e objetivo quando apropriado
          5. Garantir que o destinatário entenda perfeitamente a mensagem
          6. Manter o tom profissional e adequado ao contexto
          7. Preservar todas as informações importantes
          
          Responda APENAS com o texto melhorado, sem explicações adicionais.`,
          },
          {
            role: 'user',
            content: `Por favor, melhore o seguinte texto para que o destinatário entenda perfeitamente a mensagem:\n\n${data.text}`,
          },
        ];
        maxTokens = 5000;
        temperature = 0.4;
        break;

      case 'generateTask':
        if (!data.situation) {
          throw new Error('Situação não fornecida');
        }
        messages = [
          {
            role: 'system',
            content: `Você cria tarefas objetivas e diretas para gestão de contratos imobiliários.

Responda APENAS com JSON no formato:
{
  "title": "Título da tarefa (máximo 60 caracteres)",
  "subtitle": "Subtítulo breve (máximo 80 caracteres)",
  "description": "Descrição simples e direta do que precisa ser feito",
  "status": "not_started" | "in_progress" | "completed",
  "contractNumber": "número do contrato se mencionado (apenas dígitos)"
}

REGRAS:
1. Título: Direto ao ponto, verbo de ação. Se houver número de contrato, mencione no formato "Tarefa - Contrato XXXX"
2. Subtítulo: Informação complementar curta com contexto relevante
3. Descrição: Máximo 2-3 frases objetivas, sem explicações longas
4. Status: "not_started" (padrão), "in_progress" (se já iniciado), "completed" (se concluído)
5. contractNumber: Extraia o número do contrato se mencionado na situação (apenas os dígitos)

EXEMPLOS DE DETECÇÃO DE CONTRATO:
- "contrato 12345" → contractNumber: "12345"
- "contrato nº 67890" → contractNumber: "67890"
- "do contrato 11111" → contractNumber: "11111"

Seja conciso e prático. NÃO contextualize demais.`,
          },
          {
            role: 'user',
            content: data.situation,
          },
        ];
        maxTokens = 500;
        temperature = 0.4;
        responseFormat = { type: 'json_object' };
        break;

      case 'generateDailySummary':
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Lista de tarefas não fornecida');
        }

        {
          const tasksInfo = data.tasks
            .map((task: any, index: number) => {
              const createdDate = new Date(task.created_at).toLocaleDateString(
                'pt-BR'
              );
              const createdTime = new Date(task.created_at).toLocaleTimeString(
                'pt-BR',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );

              let info = `\n=== TAREFA ${index + 1} ===`;
              info += `\n📋 Título: "${task.title}"`;

              if (task.subtitle && task.subtitle.trim()) {
                info += `\n📌 Subtítulo: "${task.subtitle}"`;
              }

              info += `\n📝 Descrição Completa: "${task.description}"`;

              if (task.observacao && task.observacao.trim()) {
                info += `\n📍 OBSERVAÇÕES E ATUALIZAÇÕES (IMPORTANTE):`;
                info += `\n${task.observacao}`;
              }

              const statusLabel =
                task.status === 'completed'
                  ? '✅ Concluída'
                  : task.status === 'in_progress'
                    ? '🔄 Em Andamento'
                    : '⏸️ Não Iniciada';
              info += `\n🔖 Status: ${statusLabel}`;
              info += `\n🕐 Criada: ${createdDate} às ${createdTime}`;

              if (task.completed_at) {
                const completedDate = new Date(
                  task.completed_at
                ).toLocaleDateString('pt-BR');
                const completedTime = new Date(
                  task.completed_at
                ).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                info += `\n✅ Concluída: ${completedDate} às ${completedTime}`;
              }

              return info;
            })
            .join('\n');

          messages = [
            {
              role: 'system',
              content: `Você é um assistente executivo especializado em criar resumos narrativos DETALHADOS e COMPLETOS de atividades profissionais diárias.

REGRAS OBRIGATÓRIAS - NÃO PULE NENHUMA INFORMAÇÃO:

1. COMPLETUDE ABSOLUTA:
   - TODAS as tarefas devem estar no resumo, sem exceção
   - TODAS as descrições devem ser incluídas de forma narrativa
   - TODAS as observações (quando presentes) são CRÍTICAS e devem ser incorporadas completamente
   - TODOS os horários e datas devem ser mencionados
   - TODOS os status e mudanças devem ser documentados

2. OBSERVAÇÕES TÊM PRIORIDADE MÁXIMA:
   - As "OBSERVAÇÕES E ATUALIZAÇÕES" são informações VITAIS do gestor
   - Estas observações contêm atualizações, progresso, problemas e decisões
   - NUNCA omita ou resuma observações - incorpore-as integralmente na narrativa
   - Se houver múltiplas atualizações nas observações, mencione TODAS em ordem cronológica

3. ESTRUTURA NARRATIVA:
   - Iniciar mencionando o gestor ${data.userName} e a data
   - Apresentar CADA tarefa em ordem cronológica de criação
   - Para CADA tarefa, incluir:
     * Título e contexto (subtítulo se houver)
     * Descrição completa do que precisa ser feito
     * Observações detalhadas (progresso, atualizações, problemas)
     * Status atual e horários relevantes
     * Conclusão e horário de finalização (se aplicável)

4. DETALHAMENTO PROFISSIONAL:
   - Transformar informações técnicas em narrativa fluida
   - Manter todos os detalhes importantes
   - Usar linguagem profissional e objetiva
   - Destacar ações, decisões e resultados

5. FORMATO DE SAÍDA:
   - Texto corrido em parágrafos bem estruturados
   - Começar com contexto geral do dia
   - Desenvolver cada tarefa com seus detalhes
   - Finalizar com síntese das realizações
   - SEM títulos, bullets ou formatação markdown

IMPORTANTE: Este resumo será usado para documentação oficial. NENHUMA informação pode ser perdida ou omitida.`,
            },
            {
              role: 'user',
              content: `Crie um resumo narrativo COMPLETO e DETALHADO das atividades diárias do gestor ${data.userName}.

INSTRUÇÕES ESPECÍFICAS:
- Leia TODAS as informações de cada tarefa
- Preste atenção especial às "OBSERVAÇÕES E ATUALIZAÇÕES" - estas são cruciais
- Inclua TODOS os detalhes, não resuma nem omita nada
- Mantenha a ordem cronológica
- Transforme em uma narrativa profissional fluida

DADOS DAS TAREFAS:
${tasksInfo}

Agora crie o resumo narrativo completo:`,
            },
          ];
          model = 'gpt-4o';
          maxTokens = 4000;
          temperature = 0.5;
        }
        break;

      case 'analyzeContracts':
        if (!data.query) {
          throw new Error('Query não fornecida');
        }
        if (!data.contracts || !Array.isArray(data.contracts)) {
          throw new Error('Contratos não fornecidos');
        }

        {
          let contractsContext = '';
          if (data.completeContracts && data.completeContracts.length > 0) {
            contractsContext = data.completeContracts
              .map(
                (contract: any, index: number) => `
Contrato ${index + 1} (Dados Completos):
- ID: ${contract.id}
- Título: ${contract.title}
- Número do Contrato: ${contract.form_data.numeroContrato || 'N/A'}
- Data de Firmamento: ${contract.form_data.dataFirmamentoContrato || 'N/A'}
- Endereço do Imóvel: ${contract.form_data.enderecoImovel || 'N/A'}
- Quantidade de Chaves: ${contract.form_data.quantidadeChaves || 'N/A'}

DADOS DOS LOCADORES:
- Gênero: ${contract.form_data.generoProprietario || 'N/A'}
- Nome: ${contract.form_data.nomeProprietario || 'N/A'}
- Qualificação Completa: ${contract.form_data.qualificacaoCompletaLocadores || 'N/A'}

DADOS DOS LOCATÁRIOS:
- Gênero: ${contract.form_data.generoLocatario || 'N/A'}
- Nome: ${contract.form_data.nomeLocatario || 'N/A'}
- Qualificação Completa: ${contract.form_data.qualificacaoCompletaLocatarios || 'N/A'}
- Celular: ${contract.form_data.celularLocatario || 'N/A'}
- Email: ${contract.form_data.emailLocatario || 'N/A'}

DADOS DE RESCISÃO:
- Data Início: ${contract.form_data.dataInicioRescisao || 'N/A'}
- Data Término: ${contract.form_data.dataTerminoRescisao || 'N/A'}

DOCUMENTOS SOLICITADOS:
- Condomínio: ${contract.form_data.solicitarCondominio || 'N/A'}
- Água: ${contract.form_data.solicitarAgua || 'N/A'}
- Gás: ${contract.form_data.solicitarGas || 'N/A'}
- CND: ${contract.form_data.solicitarCND || 'N/A'}

- Criado em: ${contract.created_at}
- Atualizado em: ${contract.updated_at}
`
              )
              .join('\n');
          } else {
            contractsContext = data.contracts
              .map(
                (contract: any, index: number) => `
Contrato ${index + 1} (Dados Básicos):
- ID: ${contract.id}
- Número do Contrato: ${contract.numero_contrato}
- Locatário: ${contract.nome_locatario}
- Endereço: ${contract.endereco_imovel}
- Proprietário: ${contract.nome_proprietario}
- Email do Proprietário: ${contract.email_proprietario}
- Data da Comunicação: ${contract.data_comunicacao}
- Data Início Desocupação: ${contract.data_inicio_desocupacao}
- Data Término Desocupação: ${contract.data_termino_desocupacao}
- Prazo (dias): ${contract.prazo_dias}
- Criado em: ${contract.created_at}
- Atualizado em: ${contract.updated_at}
`
              )
              .join('\n');
          }

          messages = [
            {
              role: 'system',
              content: `Você é um assistente especializado em contratos imobiliários com acesso completo a todos os dados dos contratos. Você tem uma vasta memória e pode responder perguntas sobre qualquer aspecto dos contratos de forma natural e conversacional.

          Suas capacidades incluem:
          - Responder perguntas sobre contratos específicos
          - Fornecer estatísticas e informações gerais
          - Analisar padrões e tendências quando solicitado
          - Explicar detalhes sobre locatários, proprietários e imóveis
          - Calcular prazos, datas e cronologias
          - Identificar informações geográficas e relacionamentos
          - Sugerir insights baseados nos dados disponíveis

          IMPORTANTE: Responda sempre em formato conversacional, como se estivesse conversando com uma pessoa. Seja natural, amigável e direto. Use linguagem clara e acessível. Quando fornecer informações, explique de forma que seja fácil de entender. Se não souber algo específico ou não tiver dados suficientes, seja honesto sobre isso.`,
            },
            {
              role: 'user',
              content: `Aqui estão os dados de todos os contratos disponíveis:

${contractsContext}

Pergunta: ${data.query}

Por favor, responda de forma conversacional e natural, como se estivesse conversando comigo.`,
            },
          ];
          model = 'gpt-4o';
          maxTokens = 4000;
          temperature = 0.7;
        }
        break;

      case 'chatCompletion':
        if (!data.prompt) {
          throw new Error('Prompt não fornecido');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente de IA avançado e versátil, capaz de ajudar com qualquer tipo de pergunta ou tarefa.
          
          Suas características:
          - Responda de forma natural, clara e amigável
          - Adapte-se ao contexto da conversa
          - Forneça informações precisas e úteis
          - Seja criativo quando necessário
          - Mantenha um tom profissional mas acessível
          - Se não souber algo, seja honesto e sugira alternativas
          
          Você pode ajudar com:
          - Análise de documentos e contratos
          - Questões técnicas e programação
          - Escrita criativa e revisão de textos
          - Matemática e ciências
          - Pesquisa e informações gerais
          - Brainstorming e resolução de problemas
          - E qualquer outro assunto que o usuário precisar
          
          Importante: Interprete o contexto da conversa para entender se o usuário quer gerar uma imagem, analisar algo ou apenas conversar. Não peça confirmação, apenas responda de acordo com a intenção percebida.`,
          },
          {
            role: 'user',
            content: data.prompt,
          },
        ];
        model = 'gpt-4o';
        maxTokens = 3000;
        temperature = 0.7;
        break;

      case 'analyzeImage':
        if (!data.imageBase64) {
          throw new Error('Imagem não fornecida');
        }
        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  data.userPrompt ||
                  'Analise esta imagem em detalhes. Se for um documento, extraia todas as informações relevantes. Se for uma foto, descreva o que você vê.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: data.imageBase64,
                },
              },
            ],
          },
        ];
        model = 'gpt-4o';
        maxTokens = 4000;
        temperature = 0.7;
        break;

      case 'generateImage':
        if (!data.prompt) {
          throw new Error('Prompt não fornecido');
        }
        {
          // Gerar imagem com DALL-E
          const imageResponse = await fetch(
            'https://api.openai.com/v1/images/generations',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: `Create a professional, high-quality image: ${data.prompt}`,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
              }),
            }
          );

          if (!imageResponse.ok) {
            const error = await imageResponse.text();
            console.error('DALL-E API Error:', error);
            throw new Error(`Erro na API DALL-E: ${imageResponse.status}`);
          }

          const imageData = await imageResponse.json();
          const imageUrl = imageData.data[0]?.url;

          if (!imageUrl) {
            throw new Error('URL da imagem não retornada pela API');
          }

          return new Response(
            JSON.stringify({
              success: true,
              content: imageUrl,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

      case 'transcribeAudio':
        if (!data.audioBase64) {
          throw new Error('Áudio não fornecido');
        }
        {
          // Converter base64 para Blob
          const audioBuffer = Uint8Array.from(atob(data.audioBase64), (c) =>
            c.charCodeAt(0)
          );
          const audioBlob = new Blob([audioBuffer]);

          // Criar FormData para Whisper API
          const formData = new FormData();
          formData.append('file', audioBlob, data.fileName || 'audio.webm');
          formData.append('model', 'whisper-1');
          formData.append('language', 'pt');
          formData.append('response_format', 'text');

          const transcribeResponse = await fetch(
            'https://api.openai.com/v1/audio/transcriptions',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
              },
              body: formData,
            }
          );

          if (!transcribeResponse.ok) {
            const error = await transcribeResponse.text();
            console.error('Whisper API Error:', error);
            throw new Error(
              `Erro na API Whisper: ${transcribeResponse.status}`
            );
          }

          const transcription = await transcribeResponse.text();

          if (!transcription) {
            throw new Error('Resposta vazia da API de transcrição');
          }

          return new Response(
            JSON.stringify({
              success: true,
              content: transcription,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

      case 'extractApontamentos':
        if (!data.text) {
          throw new Error('Texto não fornecido');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente especializado em análise de vistorias imobiliárias. Sua tarefa é extrair apontamentos estruturados de textos de vistoria.

⚠️ EXTREMAMENTE IMPORTANTE: PROCESSE TODO O TEXTO FORNECIDO INTEGRALMENTE ⚠️
- Você DEVE processar TODOS os apontamentos presentes no texto, do início ao fim
- NUNCA omita, resuma ou pule nenhum apontamento
- NUNCA truncar a lista de apontamentos
- Cada apontamento encontrado DEVE estar presente na resposta final
- Se houver 50 apontamentos no texto, você DEVE retornar os 50 apontamentos

FORMATO DO TEXTO DE ENTRADA:
- O texto começa com o nome do AMBIENTE em MAIÚSCULAS (ex: SALA, COZINHA, DORMITÓRIO E., WC SUÍTE)
- Após o ambiente, vem o SUBTÍTULO (linha completa da ação, ex: "Pintar as paredes", "Reparar e remover manchas do sofá")
- Após o subtítulo, vem a DESCRIÇÃO detalhada do problema
- Os apontamentos são separados por "---------"
- Quando aparece um novo AMBIENTE em MAIÚSCULAS, todos os apontamentos seguintes pertencem a esse ambiente até aparecer outro

EXEMPLO DE ENTRADA:
SALA
Pintar as paredes
estão excessivamente sujas. Na vistoria de entrada estavam em bom estado.
---------
Reparar e remover manchas do sofá
os encostos retráteis não estão travando. E remover as manchas diversas no sofá.
---------
COZINHA
Limpar a Air fryer
está suja
---------

REGRAS DE EXTRAÇÃO:
1. Identifique o AMBIENTE (palavras em MAIÚSCULAS que indicam cômodo)
2. O SUBTÍTULO é a primeira linha após o ambiente ou após o separador "---------"
3. A DESCRIÇÃO é todo o texto após o subtítulo até o próximo separador "---------" ou próximo ambiente
4. Mantenha o ambiente atual para todos os apontamentos até aparecer um novo ambiente
5. PROCESSE TODOS OS APONTAMENTOS - não omita nenhum, mesmo que o texto seja longo

FORMATO DE SAÍDA:
Retorne um objeto JSON com a chave "apontamentos" contendo um array:
{
  "apontamentos": [
    {
      "ambiente": "SALA",
      "subtitulo": "Pintar as paredes",
      "descricao": "estão excessivamente sujas. Na vistoria de entrada estavam em bom estado."
    },
    {
      "ambiente": "SALA",
      "subtitulo": "Reparar e remover manchas do sofá",
      "descricao": "os encostos retráteis não estão travando. E remover as manchas diversas no sofá."
    },
    {
      "ambiente": "COZINHA",
      "subtitulo": "Limpar a Air fryer",
      "descricao": "está suja"
    }
  ]
}

IMPORTANTE:
- Retorne APENAS o JSON válido, sem markdown, sem explicações
- Use o nome do ambiente EXATAMENTE como aparece no texto (em MAIÚSCULAS)
- O subtítulo deve ser a linha completa da ação (ex: "Pintar as paredes", não apenas "Pintar")
- A descrição é todo o texto após o subtítulo COMPLETO e sem omissões
- Mantenha o ambiente para apontamentos consecutivos até aparecer novo ambiente
- PROCESSE TODO O TEXTO - Não omita nenhum apontamento por razões de tamanho`,
          },
          {
            role: 'user',
            content: `Extraia os apontamentos do seguinte texto de vistoria. IMPORTANTE: Processe TODO o texto e retorne TODOS os apontamentos encontrados:\n\n${data.text}`,
          },
        ];
        model = 'gpt-4o';
        maxTokens = 16000;
        temperature = 0.3;
        responseFormat = { type: 'json_object' };
        break;

      case 'analyzeMessageContext':
        if (!data.message) {
          throw new Error('Mensagem não fornecida');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um especialista em análise de comunicação e sentimentos. Analise a mensagem fornecida e retorne informações estruturadas sobre emoção, formalidade, urgência e intenção.

IMPORTANTE: Retorne APENAS um JSON válido no formato especificado abaixo.

FORMATO DE RESPOSTA:
{
  "emotion": "positive" | "negative" | "neutral" | "frustrated" | "concerned" | "grateful" | "urgent",
  "formality": "formal" | "informal" | "neutral",
  "urgency": "low" | "medium" | "high",
  "intent": "question" | "complaint" | "request" | "greeting" | "gratitude" | "information",
  "context": "string descrevendo o contexto detectado",
  "suggestedTone": "empathetic" | "professional" | "friendly" | "direct" | "reassuring",
  "confidence": 0.0-1.0
}

CRITÉRIOS DE ANÁLISE:
- EMOTION: Identifique a emoção dominante na mensagem
- FORMALITY: Avalie o nível de formalidade (formal=linguagem técnica/polida, informal=gírias/coloquial, neutral=padrão)
- URGENCY: Detecte se há sinais de urgência (palavras como "urgente", "agora", "já", "!", etc.)
- INTENT: Classifique a intenção principal da mensagem
- CONTEXT: Descreva brevemente o contexto detectado (ex: "pintura", "vistoria", "contrato", "geral")
- SUGGESTED_TONE: Sugira o tom mais apropriado para resposta
- CONFIDENCE: Avalie sua confiança na análise (0.0-1.0)`,
          },
          {
            role: 'user',
            content: `Analise a seguinte mensagem:\n\n"${data.message}"`,
          },
        ];
        model = 'gpt-4o-mini';
        maxTokens = 500;
        temperature = 0.3;
        responseFormat = { type: 'json_object' };
        break;

      case 'generateHumanizedResponse':
        if (!data.message) {
          throw new Error('Mensagem não fornecida');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente imobiliário profissional e experiente. Sua tarefa é gerar respostas formais, inteligentes e bem estruturadas para mensagens de locadores e locatários.

CONTEXTO:
- Mensagem recebida: "${data.message}"
- Emoção detectada: ${data.analysis?.emotion || 'neutral'}
- Formalidade: ${data.analysis?.formality || 'neutral'}
- Urgência: ${data.analysis?.urgency || 'low'}
- Intenção: ${data.analysis?.intent || 'information'}
- Perfil da pessoa: ${data.profile ? JSON.stringify(data.profile) : 'N/A'}
- Contexto do contrato: ${data.context || 'N/A'}

INSTRUÇÕES OBRIGATÓRIAS PARA A RESPOSTA:
1. TOM SEMPRE FORMAL E PROFISSIONAL:
   - Use sempre "Prezado(a)" como saudação
   - Linguagem técnica e precisa
   - Estrutura completa e organizada
   - Encerramento com "Atenciosamente"

2. ADAPTE À EMOÇÃO DETECTADA:
   - Frustrado/Preocupado: Reconheça a preocupação e demonstre comprometimento
   - Urgente: Priorize rapidez e estabeleça prazos claros
   - Grato/Positivo: Mantenha cordialidade e profissionalismo
   - Neutro: Seja direto e objetivo

3. SEJA INTELIGENTE E CONTEXTUAL:
   - Use informações do contrato quando relevante
   - Referencie dados específicos (endereço, valores, datas)
   - Demonstre conhecimento técnico do setor imobiliário
   - Forneça informações precisas e úteis

4. ESTRUTURA PROFISSIONAL:
   - Saudação formal
   - Reconhecimento da questão/situação
   - Informação técnica e precisa
   - Compromisso de ação
   - Encerramento formal

5. LINGUAGEM TÉCNICA:
   - Use terminologia imobiliária adequada
   - Seja preciso em prazos e procedimentos
   - Demonstre expertise profissional
   - Evite linguagem coloquial

EXEMPLOS DE RESPOSTAS FORMALES:
- "Prezado(a) [nome], reconhecemos sua preocupação e lamentamos o inconveniente. Vamos analisar a situação e implementar as medidas necessárias para resolver a questão. Retornaremos em breve com uma solução adequada. Atenciosamente."
- "Prezado(a) [nome], agradecemos seu contato. Vamos verificar as informações solicitadas e retornaremos com as respostas no menor prazo possível. Atenciosamente."

IMPORTANTE: Gere uma resposta única, formal, inteligente e adequada ao contexto. Demonstre expertise profissional e comprometimento com a solução.`,
          },
          {
            role: 'user',
            content: `Gere uma resposta formal e inteligente para a mensagem: "${data.message}"`,
          },
        ];
        model = 'gpt-4o';
        maxTokens = 800;
        temperature = 0.5;
        break;

      case 'generateDualResponses':
        if (!data.message) {
          throw new Error('Mensagem não fornecida');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente imobiliário experiente e humano. Sua tarefa é gerar DUAS respostas inteligentes, contextuais e humanas baseadas na mensagem recebida.

CONTEXTO:
- Mensagem recebida: "${data.message}"
- Remetente detectado: ${data.detectedSender || 'unknown'}
- Nomes disponíveis: ${JSON.stringify(data.names || {})}
- Saudação já usada: ${data.hasUsedGreeting ? 'Sim' : 'Não'}
- Dados do contrato: ${data.contract ? JSON.stringify(data.contract) : 'N/A'}

ANÁLISE DE SENTIMENTO:
- Emoção detectada: ${data.sentiment?.emotion || 'neutral'}
- Tom da mensagem: ${data.sentiment?.tone || 'informal'}
- Intenção: ${data.sentiment?.intent || 'information'}
- Urgência: ${data.sentiment?.urgency || 'low'}
- Poder de decisão: ${data.sentiment?.decisionPower || 'neutral'}
- Confiança da detecção: ${data.detectionConfidence || 0.5}

INSTRUÇÕES CRÍTICAS:

1. SEJA INTELIGENTE E CONTEXTUAL:
   - Analise DETALHADAMENTE o conteúdo da mensagem
   - Identifique informações específicas solicitadas (cores, marcas, datas, valores, etc.)
   - Gere respostas que façam sentido no contexto imobiliário
   - NÃO use respostas genéricas - seja específico e útil

2. GERAÇÃO DE RESPOSTAS INTELIGENTES:
   - Se LOCATÁRIO pergunta sobre cor da tinta → LOCADOR deve receber pergunta específica sobre a cor da tinta
   - Se LOCATÁRIO pede autorização → LOCADOR deve receber pergunta sobre a autorização específica
   - Se LOCADOR aprova algo → LOCATÁRIO deve receber confirmação específica do que foi aprovado
   - Se há problema relatado → Gere respostas que abordem o problema específico

3. EXEMPLOS DE RESPOSTAS INTELIGENTES E HUMANAS:
   - Locatário pergunta cor da tinta → Locador: "Boa tarde Sr [NOME], tudo bem? O locatário gostaria de gentilmente verificar com o senhor a cor da tinta usada nas paredes do imóvel. O senhor se recorda?"
   - Locatário pergunta cor da tinta → Locatário: "Bom dia/Boa tarde, Sr [NOME], tudo bem obrigado. Maravilha, irei verificar com o locador e retorno assim que possível."
   - Locatário pede autorização → Locador: "Boa tarde Sr [NOME], tudo bem? O locatário solicitou autorização para [tipo específico]. O senhor autoriza?"
   - Locatário relata problema → Locador: "Boa tarde Sr [NOME], tudo bem? O locatário relatou um problema com [problema específico]. Como devemos proceder?"

4. LINGUAGEM NATURAL E HUMANA:
   - Use cumprimentos naturais: "Bom dia", "Boa tarde", "tudo bem?"
   - Linguagem conversacional e respeitosa
   - Use "Sr [NOME]" quando disponível
   - Seja gentil e cordial
   - Evite linguagem muito formal ou robótica

5. CONTEXTUALIZAÇÃO:
   - Use nomes quando disponíveis
   - Referencie dados específicos da mensagem
   - Demonstre que entendeu o contexto
   - Faça perguntas específicas quando necessário

6. DETECÇÃO INTELIGENTE:
   - Analise palavras-chave para identificar o contexto
   - Se contém "solicito", "peço", "gostaria" → provavelmente locatário
   - Se contém "aprovado", "autorizado", "pode" → provavelmente locador
   - Se contém perguntas específicas → gere respostas específicas

7. HUMANIZAÇÃO BASEADA EM SENTIMENTO:
   - Se emoção é "frustrated": seja empático, reconheça o problema, foque em soluções
   - Se emoção é "urgent": seja direto e conciso, forneça timeline claro
   - Se emoção é "concerned": seja tranquilizador, explique o processo, próximos passos
   - Se emoção é "satisfied": mantenha tom positivo, reforce relacionamento
   - Se tom é "formal": use linguagem respeitosa e estruturada
   - Se tom é "casual": seja amigável mas mantenha profissionalismo
   - Se tom é "authoritative": reconheça autoridade, apresente opções claras

8. ADAPTAÇÃO POR PAPEL:
   - Para respostas ao LOCADOR: use linguagem respeitosa, apresente opções, reconheça autoridade
   - Para respostas ao LOCATÁRIO: seja claro, orientador, mencione direitos e deveres quando relevante
   - Espelhe sutilmente o estilo do remetente mantendo sempre profissionalismo

IMPORTANTE: Seja HUMANO, NATURAL e INTELIGENTE. Use linguagem conversacional e respeitosa. Não use respostas genéricas ou robóticas. Analise o contexto e gere respostas que façam sentido e sejam úteis para ambas as partes. Use cumprimentos naturais e seja gentil. Adapte o tom baseado no sentimento detectado.

PROIBIDO: NUNCA use frases como "Obrigado pela paciência", "Obrigado pela compreensão", "Agradecemos a paciência" ou similares. Seja direto e objetivo.

RESPONDA APENAS COM UM JSON no formato:
{
  "locadorResponse": "resposta específica e contextual para o locador",
  "locatarioResponse": "resposta específica e contextual para o locatário",
  "detectedSender": "locador|locatario|unknown",
  "extractedNames": {
    "locador": "nome do locador se encontrado",
    "locatario": "nome do locatário se encontrado"
  }
}`,
          },
          {
            role: 'user',
            content: `Analise a mensagem e gere as duas respostas inteligentes e contextuais: "${data.message}"`,
          },
        ];
        model = 'gpt-4o';
        maxTokens = 1500;
        temperature = 0.7;
        responseFormat = { type: 'json_object' };
        break;

      case 'extractNames':
        if (!data.message) {
          throw new Error('Mensagem não fornecida');
        }
        messages = [
          {
            role: 'system',
            content: `Você é um assistente especializado em extrair nomes de locadores e locatários de mensagens.

Analise a mensagem e identifique:
1. Nomes de pessoas mencionadas
2. Se são locadores ou locatários (baseado no contexto)
3. Padrões como "Fulano (locador)", "Ciclano (locatário)", etc.

RESPONDA APENAS COM UM JSON no formato:
{
  "locador": "nome do locador se encontrado",
  "locatario": "nome do locatário se encontrado"
}

Se não encontrar nomes específicos, retorne objetos vazios.`,
          },
          {
            role: 'user',
            content: `Extraia os nomes da mensagem: "${data.message}"`,
          },
        ];
        model = 'gpt-4o';
        maxTokens = 200;
        temperature = 0.3;
        responseFormat = { type: 'json_object' };
        break;

      case 'transcribeAudio':
        if (!data.audio) {
          throw new Error('Áudio não fornecido');
        }

        // Para transcrição de áudio, precisamos usar a API de áudio da OpenAI
        // Por enquanto, retornar um placeholder
        return {
          transcription:
            'Transcrição de áudio não implementada ainda. Por favor, digite a mensagem.',
        };

      case 'textToSpeech':
        if (!data.text) {
          throw new Error('Texto não fornecido');
        }
        {
          // Gerar áudio com OpenAI TTS
          const ttsResponse = await fetch(
            'https://api.openai.com/v1/audio/speech',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'tts-1',
                input: data.text,
                voice: 'nova', // Voz natural em português
                response_format: 'mp3',
              }),
            }
          );

          if (!ttsResponse.ok) {
            const error = await ttsResponse.text();
            console.error('TTS API Error:', error);
            throw new Error(`Erro na API TTS: ${ttsResponse.status}`);
          }

          // Converter resposta para base64
          const audioBuffer = await ttsResponse.arrayBuffer();
          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(audioBuffer))
          );

          return new Response(
            JSON.stringify({
              success: true,
              content: base64Audio,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

      default:
        throw new Error(`Ação inválida: ${action}`);
    }

    // Fazer a chamada à OpenAI (apenas para ações que usam chat completions)
    if (
      action !== 'generateImage' &&
      action !== 'transcribeAudio' &&
      action !== 'textToSpeech'
    ) {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
            ...(responseFormat && { response_format: responseFormat }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API Error:', error);
        throw new Error(`Erro na API da OpenAI: ${response.status}`);
      }

      const completion = await response.json();
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // Processar resposta baseada na ação
      let processedContent = content;

      if (action === 'generateTask' || action === 'extractApontamentos') {
        processedContent = JSON.parse(content);
      } else {
        processedContent = content.trim();
      }

      // Retornar resultado
      return new Response(
        JSON.stringify({
          success: true,
          content: processedContent,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
