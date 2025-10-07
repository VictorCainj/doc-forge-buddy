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
      max_tokens: 2000,
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
      max_tokens: 2000,
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

export const analyzeImageWithAI = async (imageBase64: string, userPrompt?: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt || 'Analise esta imagem em detalhes. Se for um documento, extraia todas as informações relevantes. Se for uma foto, descreva o que você vê.',
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

export const transcribeAudioWithAI = async (audioFile: File): Promise<string> => {
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
