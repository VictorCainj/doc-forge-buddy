import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding } from './embeddingService';
import { log } from './logger';

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source_type: 'document' | 'contract' | 'manual' | 'note' | 'other';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RelevantKnowledge {
  entry_id: string;
  title: string;
  content: string;
  similarity: number;
  source_type: string;
}

/**
 * Adiciona uma entrada à base de conhecimento
 */
export async function addKnowledgeEntry(
  title: string,
  content: string,
  sourceType: KnowledgeEntry['source_type'],
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    log.debug('Adicionando entrada à base de conhecimento', { title });

    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Gerar embedding
    const { embedding } = await generateEmbedding(`${title}\n\n${content}`);

    // Inserir na base de dados
    const { data, error } = await supabase
      .from('knowledge_entries')
      .insert({
        user_id: user.id,
        title,
        content,
        embedding: JSON.stringify(embedding),
        source_type: sourceType,
        metadata,
      })
      .select('id')
      .single();

    if (error) throw error;

    log.debug('Entrada adicionada com sucesso', { id: data.id });
    return data.id;
  } catch (error) {
    log.error('Erro ao adicionar entrada', error);
    return null;
  }
}

/**
 * Busca conhecimento relevante para uma query
 */
export async function searchKnowledge(
  query: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    sourceType?: KnowledgeEntry['source_type'];
  } = {}
): Promise<RelevantKnowledge[]> {
  try {
    const { limit = 5, minSimilarity = 0.7, sourceType } = options;

    log.debug('Buscando conhecimento relevante', { query, limit });

    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Gerar embedding da query
    const { embedding } = await generateEmbedding(query);

    // Buscar usando a função RPC
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: JSON.stringify(embedding),
      match_threshold: minSimilarity,
      match_count: limit,
      user_id_filter: user.id,
      source_type_filter: sourceType || null,
    });

    if (error) throw error;

    log.debug('Conhecimento encontrado', { count: data?.length || 0 });

    return data || [];
  } catch (error) {
    log.error('Erro ao buscar conhecimento', error);
    return [];
  }
}

/**
 * Obtém contexto RAG para uma pergunta
 */
export async function getRAGContext(
  query: string,
  maxEntries: number = 3
): Promise<string> {
  const knowledge = await searchKnowledge(query, {
    limit: maxEntries,
    minSimilarity: 0.75,
  });

  if (knowledge.length === 0) {
    return '';
  }

  // Formatar contexto
  const context = knowledge
    .map((entry, idx) => 
      `[Documento ${idx + 1}: ${entry.title}]\n${entry.content.substring(0, 500)}...`
    )
    .join('\n\n');

  return `Conhecimento relevante:\n\n${context}`;
}

/**
 * Lista todas as entradas de conhecimento do usuário
 */
export async function listKnowledgeEntries(
  sourceType?: KnowledgeEntry['source_type']
): Promise<KnowledgeEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    let query = supabase
      .from('knowledge_entries')
      .select('id, title, content, source_type, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    log.error('Erro ao listar entradas', error);
    return [];
  }
}

/**
 * Deleta uma entrada de conhecimento
 */
export async function deleteKnowledgeEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('knowledge_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;

    log.debug('Entrada deletada', { entryId });
    return true;
  } catch (error) {
    log.error('Erro ao deletar entrada', error);
    return false;
  }
}
