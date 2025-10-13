import OpenAI from 'openai';
import { Contract } from '@/hooks/useContractAnalysis';
import { CompleteContractData } from '@/hooks/useCompleteContractData';
import { log } from '@/utils/logger';

const openai = new OpenAI({
  apiKey:
    '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',
  dangerouslyAllowBrowser: true, // Apenas para desenvolvimento
});

export const correctTextWithAI = async (text: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
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
          content: `Por favor, corrija o seguinte texto em português brasileiro:\n\n${text}`,
        },
      ],
      max_tokens: 5000,
      temperature: 0.3,
    });

    const correctedText = completion.choices[0]?.message?.content;

    if (!correctedText) {
      throw new Error('Resposta vazia da API');
    }

    return correctedText.trim();
  } catch {
    // // console.error('Erro na API da OpenAI:', error);
    throw new Error('Erro ao corrigir o texto. Tente novamente.');
  }
};

export const improveTextWithAI = async (text: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
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
          content: `Por favor, melhore o seguinte texto para que o destinatário entenda perfeitamente a mensagem:\n\n${text}`,
        },
      ],
      max_tokens: 5000,
      temperature: 0.4,
    });

    const improvedText = completion.choices[0]?.message?.content;

    if (!improvedText) {
      throw new Error('Resposta vazia da API');
    }

    return improvedText.trim();
  } catch {
    // // console.error('Erro na API da OpenAI:', error);
    throw new Error('Erro ao melhorar o texto. Tente novamente.');
  }
};

export const analyzeContractsWithAI = async (
  query: string,
  contracts: Contract[],
  completeContracts?: CompleteContractData[]
): Promise<string> => {
  try {
    // console.log('Iniciando análise de contratos...');
    // console.log('Query:', query);
    // console.log('Contratos básicos:', contracts.length);
    // console.log('Contratos completos:', completeContracts?.length || 0);

    // Preparar informações dos contratos para o contexto
    let contractsContext = '';

    if (completeContracts && completeContracts.length > 0) {
      // Usar dados completos se disponíveis
      contractsContext = completeContracts
        .map(
          (contract, index) => `
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
      // Usar dados básicos se dados completos não estiverem disponíveis
      contractsContext = contracts
        .map(
          (contract, index) => `
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

    // console.log('Chamando API da OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
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

Pergunta: ${query}

Por favor, responda de forma conversacional e natural, como se estivesse conversando comigo.`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // console.log('Resposta da API recebida:', completion.choices[0]?.message?.content?.substring(0, 100) + '...');

    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      // console.error('Resposta vazia da API');
      throw new Error('Resposta vazia da API');
    }

    // console.log('Retornando análise:', analysis.trim().substring(0, 100) + '...');
    return analysis.trim();
  } catch {
    // console.error('Erro na API da OpenAI para análise:', error);
    throw new Error('Erro ao analisar os contratos. Tente novamente.');
  }
};

export const chatCompletionWithAI = async (prompt: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
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
          content: prompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('Resposta vazia da API');
    }

    return response.trim();
  } catch {
    throw new Error('Erro ao processar sua mensagem. Tente novamente.');
  }
};

export const analyzeImageWithAI = async (
  imageBase64: string,
  userPrompt?: string
): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                userPrompt ||
                'Analise esta imagem em detalhes. Se for um documento, extraia todas as informações relevantes. Se for uma foto, descreva o que você vê.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error('Resposta vazia da API');
    }

    return analysis.trim();
  } catch (error) {
    log.error('Erro ao analisar imagem:', error);
    throw new Error('Erro ao analisar a imagem. Tente novamente.');
  }
};

export const generateImageWithAI = async (prompt: string): Promise<string> => {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a professional, high-quality image: ${prompt}`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('URL da imagem não retornada pela API');
    }

    return imageUrl;
  } catch {
    throw new Error('Erro ao gerar imagem. Tente novamente.');
  }
};

export const transcribeAudioWithAI = async (
  audioFile: File
): Promise<string> => {
  try {
    log.info('Iniciando transcrição de áudio:', audioFile.name);

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt', // Português
      response_format: 'text',
    });

    if (!response) {
      throw new Error('Resposta vazia da API de transcrição');
    }

    log.info('Transcrição concluída com sucesso');
    return response as string;
  } catch (error) {
    log.error('Erro ao transcrever áudio:', error);
    throw new Error('Erro ao transcrever o áudio. Tente novamente.');
  }
};

export interface ExtractedApontamento {
  ambiente: string;
  subtitulo: string;
  descricao: string;
}

export const extractApontamentosFromText = async (
  text: string
): Promise<ExtractedApontamento[]> => {
  try {
    log.info('Iniciando extração de apontamentos do texto');
    log.info(`Tamanho do texto de entrada: ${text.length} caracteres`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
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
          content: `Extraia os apontamentos do seguinte texto de vistoria. IMPORTANTE: Processe TODO o texto e retorne TODOS os apontamentos encontrados:\n\n${text}`,
        },
      ],
      max_tokens: 16000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    const finishReason = completion.choices[0]?.finish_reason;

    if (!response) {
      throw new Error('Resposta vazia da API');
    }

    // Verificar se a resposta foi truncada
    if (finishReason === 'length') {
      log.warn(
        '⚠️ AVISO: A resposta da API foi truncada devido ao limite de tokens!'
      );
      log.warn(
        'Isso pode significar que alguns apontamentos não foram processados.'
      );
      log.warn(
        'Considere dividir o texto em partes menores ou entrar em contato com o suporte.'
      );
    }

    log.debug(
      'Resposta da API (primeiros 500 caracteres):',
      response.substring(0, 500)
    );
    log.debug('Finish reason:', finishReason);
    log.info(`Tamanho da resposta: ${response.length} caracteres`);

    // Tentar parsear a resposta JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError) {
      log.error('Erro ao parsear JSON:', parseError);
      log.error('Resposta recebida:', response);
      throw new Error('Erro ao processar resposta da IA. Resposta inválida.');
    }

    // A resposta pode vir em diferentes formatos, verificar estrutura
    let apontamentos: ExtractedApontamento[] = [];

    if (Array.isArray(parsedResponse)) {
      apontamentos = parsedResponse;
    } else if (
      parsedResponse.apontamentos &&
      Array.isArray(parsedResponse.apontamentos)
    ) {
      apontamentos = parsedResponse.apontamentos;
    } else if (parsedResponse.items && Array.isArray(parsedResponse.items)) {
      apontamentos = parsedResponse.items;
    } else if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      apontamentos = parsedResponse.data;
    } else {
      // Tentar encontrar qualquer array no objeto
      const keys = Object.keys(parsedResponse);
      for (const key of keys) {
        if (Array.isArray(parsedResponse[key])) {
          apontamentos = parsedResponse[key];
          break;
        }
      }

      if (apontamentos.length === 0) {
        log.error('Formato de resposta inesperado:', parsedResponse);
        throw new Error(
          'Não foi possível encontrar apontamentos na resposta da IA. Tente reformular o texto.'
        );
      }
    }

    // Validar estrutura dos apontamentos
    const validApontamentos = apontamentos.filter(
      (item: any) =>
        item &&
        typeof item === 'object' &&
        item.ambiente &&
        item.subtitulo &&
        item.descricao
    );

    if (validApontamentos.length === 0) {
      throw new Error(
        'Nenhum apontamento válido foi encontrado. Verifique o formato do texto.'
      );
    }

    // Log detalhado dos apontamentos extraídos
    log.info(
      `✅ Extraídos ${validApontamentos.length} apontamentos com sucesso`
    );
    log.info('Resumo dos ambientes processados:');
    const ambientesCounts = validApontamentos.reduce((acc: any, item: any) => {
      acc[item.ambiente] = (acc[item.ambiente] || 0) + 1;
      return acc;
    }, {});
    Object.entries(ambientesCounts).forEach(([ambiente, count]) => {
      log.info(`  - ${ambiente}: ${count} apontamento(s)`);
    });

    // Verificar se houve apontamentos inválidos filtrados
    const invalidCount = apontamentos.length - validApontamentos.length;
    if (invalidCount > 0) {
      log.warn(
        `⚠️ ${invalidCount} apontamento(s) foram filtrados por não terem estrutura válida`
      );
    }

    return validApontamentos;
  } catch (error) {
    log.error('Erro ao extrair apontamentos:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao extrair apontamentos do texto. Tente novamente.');
  }
};

export interface DailySummaryTask {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  observacao: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export const generateDailySummary = async (
  tasks: DailySummaryTask[],
  userName: string
): Promise<string> => {
  try {
    if (tasks.length === 0) {
      return 'Nenhuma atividade foi registrada hoje.';
    }

    // Preparar dados das tarefas para o prompt - MODO DETALHADO
    const tasksInfo = tasks
      .map((task, index) => {
        const createdTime = new Date(task.created_at).toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        );
        const createdDate = new Date(task.created_at).toLocaleDateString(
          'pt-BR'
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
          const completedTime = new Date(task.completed_at).toLocaleTimeString(
            'pt-BR',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          );
          const completedDate = new Date(task.completed_at).toLocaleDateString(
            'pt-BR'
          );
          info += `\n✅ Concluída: ${completedDate} às ${completedTime}`;
        }

        return info;
      })
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
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
   - Iniciar mencionando o gestor ${userName} e a data
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
          content: `Crie um resumo narrativo COMPLETO e DETALHADO das atividades diárias do gestor ${userName}.

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
      ],
      max_tokens: 4000,
      temperature: 0.5,
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      throw new Error('Resposta vazia da API');
    }

    log.debug('Resumo diário gerado com sucesso');
    return summary.trim();
  } catch (error) {
    log.error('Erro ao gerar resumo diário:', error);
    throw new Error('Erro ao gerar resumo do dia. Tente novamente.');
  }
};
