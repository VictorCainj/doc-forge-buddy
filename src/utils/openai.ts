// @ts-nocheck
import { Contract } from '@/hooks/useContractAnalysis';
import { CompleteContractData } from '@/hooks/useCompleteContractData';
import { log } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import type { PromptEnhancementRequest, EnhancedPrompt } from '@/features/prompt/types/prompt';

// Helper para chamar a edge function
const callOpenAIProxy = async (action: string, data: any): Promise<any> => {
  try {
    log.debug(`Chamando openai-proxy para ação: ${action}`, {
      action,
      dataSize: JSON.stringify(data).length,
    });

    const { data: result, error } = await supabase.functions.invoke(
      'openai-proxy',
      {
        body: { action, data },
      }
    );

    if (error) {
      log.error(`Erro ao chamar ${action}:`, error);
      
      // Tentar extrair mensagem de erro mais específica
      let errorMessage = 'Edge Function returned a non-2xx status code';
      
      // Verificar se o erro tem uma mensagem específica
      if (error.message) {
        errorMessage = error.message;
      } 
      // Verificar se é um objeto com contexto
      else if (error.context && error.context.body) {
        try {
          const errorBody = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // Ignorar erro de parse
        }
      }
      // Verificar se é string diretamente
      else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      log.error(`Mensagem de erro detalhada para ${action}:`, errorMessage);
      throw new Error(errorMessage);
    }

    if (!result) {
      throw new Error('Resposta vazia da edge function');
    }

    if (!result.success) {
      log.error(`Erro na resposta da edge function para ${action}:`, result);
      throw new Error(result.error || 'Erro desconhecido');
    }

    return result.content;
  } catch (error) {
    log.error(`Erro na chamada callOpenAIProxy para ${action}:`, error);
    
    // Se for um erro conhecido, propagar como está
    if (error instanceof Error) {
      throw error;
    }
    
    // Caso contrário, criar um novo erro com informações
    throw new Error(
      `Erro ao chamar ${action}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

export const correctTextWithAI = async (text: string): Promise<string> => {
  try {
    const content = await callOpenAIProxy('correctText', { text });
    return content;
  } catch (error) {
    log.error('Erro ao corrigir texto:', error);
    throw new Error('Erro ao corrigir o texto. Tente novamente.');
  }
};

export const improveTextWithAI = async (text: string): Promise<string> => {
  try {
    const content = await callOpenAIProxy('improveText', { text });
    return content;
  } catch (error) {
    log.error('Erro ao melhorar texto:', error);
    throw new Error('Erro ao melhorar o texto. Tente novamente.');
  }
};

export const analyzeContractsWithAI = async (
  query: string,
  contracts: Contract[],
  completeContracts?: CompleteContractData[]
): Promise<string> => {
  try {
    const content = await callOpenAIProxy('analyzeContracts', {
      query,
      contracts,
      completeContracts,
    });
    return content;
  } catch (error) {
    log.error('Erro ao analisar contratos:', error);
    throw new Error('Erro ao analisar os contratos. Tente novamente.');
  }
};

export const chatCompletionWithAI = async (prompt: string): Promise<string> => {
  try {
    const content = await callOpenAIProxy('chatCompletion', { prompt });
    return content;
  } catch (error) {
    log.error('Erro ao processar chat:', error);
    throw new Error('Erro ao processar sua mensagem. Tente novamente.');
  }
};

export const analyzeImageWithAI = async (
  imageBase64: string,
  userPrompt?: string
): Promise<string> => {
  try {
    const content = await callOpenAIProxy('analyzeImage', {
      imageBase64,
      userPrompt,
    });
    return content;
  } catch (error) {
    log.error('Erro ao analisar imagem:', error);
    throw new Error('Erro ao analisar a imagem. Tente novamente.');
  }
};

export const generateImageWithAI = async (prompt: string): Promise<string> => {
  try {
    const imageUrl = await callOpenAIProxy('generateImage', { prompt });
    return imageUrl;
  } catch (error) {
    log.error('Erro ao gerar imagem:', error);
    throw new Error('Erro ao gerar imagem. Tente novamente.');
  }
};

export const transcribeAudioWithAI = async (
  audioFile: File
): Promise<string> => {
  try {
    log.info('Iniciando transcrição de áudio:', audioFile.name);

    // Converter File para base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remover o prefixo "data:audio/webm;base64," ou similar
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(audioFile);
    const audioBase64 = await base64Promise;

    const transcription = await callOpenAIProxy('transcribeAudio', {
      audioBase64,
      fileName: audioFile.name,
    });

    log.info('Transcrição concluída com sucesso');
    return transcription;
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

    const response = await callOpenAIProxy('extractApontamentos', { text });

    // A resposta já vem parseada do proxy
    let apontamentos: ExtractedApontamento[] = [];

    if (Array.isArray(response)) {
      apontamentos = response;
    } else if (response.apontamentos && Array.isArray(response.apontamentos)) {
      apontamentos = response.apontamentos;
    } else if (response.items && Array.isArray(response.items)) {
      apontamentos = response.items;
    } else if (response.data && Array.isArray(response.data)) {
      apontamentos = response.data;
    } else {
      // Tentar encontrar qualquer array no objeto
      const keys = Object.keys(response);
      for (const key of keys) {
        if (Array.isArray(response[key])) {
          apontamentos = response[key];
          break;
        }
      }

      if (apontamentos.length === 0) {
        log.error('Formato de resposta inesperado:', response);
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

    const summary = await callOpenAIProxy('generateDailySummary', {
      tasks,
      userName,
    });

    log.debug('Resumo diário gerado com sucesso');
    return summary;
  } catch (error) {
    log.error('Erro ao gerar resumo diário:', error);
    throw new Error('Erro ao gerar resumo do dia. Tente novamente.');
  }
};

export const generateTaskFromSituation = async (
  situation: string
): Promise<{
  title: string;
  subtitle: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
}> => {
  try {
    const taskData = await callOpenAIProxy('generateTask', { situation });

    // Validar campos obrigatórios
    if (!taskData.title || !taskData.description) {
      throw new Error('Tarefa gerada está incompleta');
    }

    // Garantir que status é válido
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(taskData.status)) {
      taskData.status = 'not_started';
    }

    // Garantir que subtitle existe (pode ser vazio)
    if (!taskData.subtitle) {
      taskData.subtitle = '';
    }

    // Se há número de contrato, buscar informações do contrato
    if (taskData.contractNumber) {
      try {
        const { data: contracts } = await supabase
          .from('contracts')
          .select('form_data')
          .ilike('form_data->>numeroContrato', `%${taskData.contractNumber}%`)
          .limit(1);

        if (contracts && contracts.length > 0) {
          const contract = contracts[0];
          const formData = contract.form_data as any;

          // Enriquecer o título com informações do contrato
          const nomeLocatario = formData.nomeLocatario?.split(' ')[0] || '';
          const enderecoResumido = formData.enderecoImovel?.split(',')[0] || '';

          // Atualizar título se não mencionar o contrato explicitamente
          if (!taskData.title.toLowerCase().includes('contrato')) {
            taskData.title = `${taskData.title} - Contrato ${taskData.contractNumber}`;
          }

          // Enriquecer subtítulo com informações relevantes
          if (nomeLocatario || enderecoResumido) {
            const infoExtra = [nomeLocatario, enderecoResumido]
              .filter(Boolean)
              .join(' - ');
            if (infoExtra && !taskData.subtitle.includes(infoExtra)) {
              taskData.subtitle = taskData.subtitle
                ? `${taskData.subtitle} (${infoExtra})`
                : infoExtra;
            }
          }

          log.debug(
            `Tarefa enriquecida com informações do contrato ${taskData.contractNumber}`
          );
        }
      } catch (error) {
        log.warn('Erro ao buscar informações do contrato:', error);
        // Continuar mesmo se falhar ao buscar o contrato
      }
    }

    log.debug('Tarefa gerada com sucesso pela IA');
    return taskData;
  } catch (error) {
    log.error('Erro ao gerar tarefa com IA:', error);
    throw new Error('Erro ao gerar tarefa. Tente novamente.');
  }
};

export const compareVistoriaImagesWithAI = async (
  fotosInicial: string[],
  fotosFinal: string[],
  descricao: string,
  descritivoLaudo?: string,
  contextData?: {
    ambiente?: string;
    subtitulo?: string;
    observacao?: string;
  }
): Promise<string> => {
  try {
    // Validar imagens iniciais
    if (!fotosInicial || fotosInicial.length === 0) {
      throw new Error('Imagens iniciais são obrigatórias para comparação');
    }

    // Validar imagens finais
    if (!fotosFinal || fotosFinal.length === 0) {
      throw new Error('Imagens finais são obrigatórias para comparação');
    }

    // Validar descrição
    if (!descricao || descricao.trim().length === 0) {
      throw new Error('Descrição do apontamento é obrigatória');
    }

    // Verificar se as imagens são válidas e são base64 válidos
    fotosInicial.forEach((foto, index) => {
      if (!foto || foto.trim().length === 0) {
        throw new Error(`Imagem inicial ${index + 1} está vazia`);
      }
      // Verificar se é um base64 válido
      if (!foto.startsWith('data:image/') || !foto.includes(',')) {
        throw new Error(`Imagem inicial ${index + 1} não é um base64 válido`);
      }
    });

    fotosFinal.forEach((foto, index) => {
      if (!foto || foto.trim().length === 0) {
        throw new Error(`Imagem final ${index + 1} está vazia`);
      }
      // Verificar se é um base64 válido
      if (!foto.startsWith('data:image/') || !foto.includes(',')) {
        throw new Error(`Imagem final ${index + 1} não é um base64 válido`);
      }
    });

    log.info('Iniciando análise comparativa de vistoria com IA', {
      fotosInicial: fotosInicial.length,
      fotosFinal: fotosFinal.length,
      descricao: descricao.substring(0, 100) + '...',
      ambiente: contextData?.ambiente,
      subtitulo: contextData?.subtitulo,
    });

    const analysis = await callOpenAIProxy('compareVistoriaImages', {
      fotosInicial,
      fotosFinal,
      descricao,
      descritivoLaudo: descritivoLaudo || '',
      ambiente: contextData?.ambiente || '',
      subtitulo: contextData?.subtitulo || '',
      observacao: contextData?.observacao || '',
    });

    log.info('Análise comparativa concluída com sucesso');
    return analysis;
  } catch (error) {
    log.error('Erro ao comparar imagens de vistoria:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao analisar imagens de vistoria. Tente novamente.');
  }
};

export const calculateAvisoPrevioWithAI = async (
  dataComunicacao: string,
  dataVencimentoBoleto: string,
  valorAluguel: string,
  tipoCobranca: string,
  dataEntregaChaves?: string,
  nomeLocatario?: string,
  enderecoImovel?: string
): Promise<string> => {
  try {
    const content = await callOpenAIProxy('calculateAvisoPrevio', {
      dataComunicacao,
      dataVencimentoBoleto,
      valorAluguel,
      tipoCobranca,
      dataEntregaChaves,
      nomeLocatario,
      enderecoImovel,
    });
    return content;
  } catch (error) {
    log.error('Erro ao calcular aviso prévio:', error);
    throw new Error('Erro ao processar o cálculo. Tente novamente.');
  }
};

export const enhancePromptWithAI = async (
  request: PromptEnhancementRequest
): Promise<EnhancedPrompt> => {
  try {
    if (!request.userInput || request.userInput.trim().length === 0) {
      throw new Error('Entrada do usuário não pode estar vazia');
    }

    log.debug('Iniciando expansão de prompt', {
      inputLength: request.userInput.length,
      hasContext: !!request.context,
      options: request.options,
    });

    const response = await callOpenAIProxy('enhancePrompt', {
      userInput: request.userInput.trim(),
      context: request.context || {},
      options: request.options || {
        detailLevel: 'detailed',
        tone: 'professional',
        language: 'pt-BR',
      },
    });

    // Validar estrutura da resposta
    if (!response || typeof response !== 'object') {
      throw new Error('Resposta inválida da API');
    }

    if (!response.enhancedPrompt) {
      throw new Error('Prompt expandido não encontrado na resposta');
    }

    // Construir objeto EnhancedPrompt
    const enhancedPrompt: EnhancedPrompt = {
      original: request.userInput.trim(),
      enhanced: response.enhancedPrompt,
      context: {
        sections: response.sections || [],
        variables: response.variables || [],
        suggestedImprovements: response.suggestedImprovements || [],
      },
      metadata: {
        tokenCount: response.estimatedTokens || 0,
        complexity: response.complexity || 'medium',
        createdAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
      },
    };

    log.debug('Prompt expandido com sucesso', {
      originalLength: enhancedPrompt.original.length,
      enhancedLength: enhancedPrompt.enhanced.length,
      sectionsCount: enhancedPrompt.context.sections.length,
      variablesCount: enhancedPrompt.context.variables.length,
      complexity: enhancedPrompt.metadata.complexity,
    });

    return enhancedPrompt;
  } catch (error) {
    log.error('Erro ao expandir prompt:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao expandir o prompt. Tente novamente.');
  }
};
