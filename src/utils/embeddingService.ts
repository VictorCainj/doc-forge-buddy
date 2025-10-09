import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/utils/logger';

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
});

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface SimilarMessage {
  message_id: string;
  content: string;
  similarity: number;
  created_at: string;
}

/**
 * Gera embedding para um texto usando OpenAI text-embedding-3-small
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    log.debug('Gerando embedding para texto', { length: text.length });
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = response.data[0].embedding;
    const tokens = response.usage.total_tokens;

    log.debug('Embedding gerado com sucesso', { tokens });

    return {
      embedding,
      tokens,
    };
  } catch (error) {
    log.error('Erro ao gerar embedding', error);
    throw new Error('Falha ao gerar embedding do texto');
  }
}

/**
 * Salva embedding de uma mensagem no banco de dados
 */
export async function saveMessageEmbedding(
  messageId: string,
  embedding: number[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_embeddings')
      .insert({
        message_id: messageId,
        embedding: JSON.stringify(embedding),
      });

    if (error) throw error;

    log.debug('Embedding salvo com sucesso', { messageId });
  } catch (error) {
    log.error('Erro ao salvar embedding', error);
    throw new Error('Falha ao salvar embedding no banco de dados');
  }
}

/**
 * Busca mensagens similares usando busca vetorial
 */
export async function searchSimilarMessages(
  queryText: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    userId?: string;
  } = {}
): Promise<SimilarMessage[]> {
  try {
    const { matchThreshold = 0.7, matchCount = 10, userId } = options;

    // Gerar embedding da query
    const { embedding } = await generateEmbedding(queryText);

    // Buscar mensagens similares usando a função RPC
    const { data, error } = await supabase.rpc('search_similar_messages', {
      query_embedding: JSON.stringify(embedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
      user_id_filter: userId || null,
    });

    if (error) throw error;

    log.debug('Mensagens similares encontradas', { count: data?.length || 0 });

    return data || [];
  } catch (error) {
    log.error('Erro ao buscar mensagens similares', error);
    return [];
  }
}

/**
 * Processa uma mensagem: gera e salva embedding
 */
export async function processMessageEmbedding(
  messageId: string,
  content: string
): Promise<void> {
  try {
    // Gerar embedding
    const { embedding } = await generateEmbedding(content);
    
    // Salvar no banco de dados
    await saveMessageEmbedding(messageId, embedding);
    
    log.debug('Mensagem processada com sucesso', { messageId });
  } catch (error) {
    log.error('Erro ao processar embedding da mensagem', error);
    // Não lançar erro para não interromper o fluxo do chat
  }
}

/**
 * Busca contexto relevante de mensagens anteriores
 */
export async function getRelevantContext(
  query: string,
  options: {
    maxMessages?: number;
    minSimilarity?: number;
    userId?: string;
  } = {}
): Promise<string> {
  const { maxMessages = 5, minSimilarity = 0.75, userId } = options;

  const similarMessages = await searchSimilarMessages(query, {
    matchThreshold: minSimilarity,
    matchCount: maxMessages,
    userId,
  });

  if (similarMessages.length === 0) {
    return '';
  }

  // Formatar contexto
  const context = similarMessages
    .map((msg, idx) => 
      `[Contexto ${idx + 1} - Similaridade: ${(msg.similarity * 100).toFixed(0)}%]\n${msg.content}`
    )
    .join('\n\n');

  return context;
}
