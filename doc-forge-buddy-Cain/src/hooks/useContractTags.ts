/**
 * Hook para gerenciar tags de contratos
 * Usa localStorage inicialmente, pode ser migrado para Supabase depois
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ContractTag } from '@/types/contract';
import { toast } from 'sonner';

const STORAGE_KEY = 'contract_tags';

/**
 * Cores padrão para tags
 */
const DEFAULT_TAG_COLORS = [
  '#3b82f6', // azul
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#f59e0b', // laranja
  '#10b981', // verde
  '#ef4444', // vermelho
  '#06b6d4', // ciano
  '#6366f1', // índigo
];

/**
 * Interface para tag armazenada
 */
interface StoredTag extends ContractTag {}

/**
 * Hook para gerenciar tags de contratos
 */
export function useContractTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Map<string, ContractTag[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tags do localStorage
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const tagsData: StoredTag[] = JSON.parse(stored);
        const userTags = tagsData.filter((t) => t.user_id === user.id);

        // Organizar tags por contract_id
        const tagsMap = new Map<string, ContractTag[]>();
        userTags.forEach((tag) => {
          const existing = tagsMap.get(tag.contract_id) || [];
          tagsMap.set(tag.contract_id, [...existing, tag]);
        });

        setTags(tagsMap);
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Salvar tags no localStorage
  const saveTags = useCallback(
    (newTags: Map<string, ContractTag[]>) => {
      if (!user?.id) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const allTags: StoredTag[] = stored ? JSON.parse(stored) : [];

        // Remover tags do usuário atual
        const otherUsersTags = allTags.filter((t) => t.user_id !== user.id);

        // Adicionar tags atuais do usuário
        const userTags: StoredTag[] = [];
        newTags.forEach((contractTags) => {
          userTags.push(...contractTags);
        });

        const updated = [...otherUsersTags, ...userTags];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar tags:', error);
        toast.error('Erro ao salvar tag');
      }
    },
    [user?.id]
  );

  // Obter tags de um contrato
  const getContractTags = useCallback(
    (contractId: string): ContractTag[] => {
      return tags.get(contractId) || [];
    },
    [tags]
  );

  // Adicionar tag a um contrato
  const addTag = useCallback(
    (contractId: string, tagName: string, color?: string) => {
      if (!user?.id) {
        toast.error('Você precisa estar logado para adicionar tags');
        return;
      }

      if (!tagName.trim()) {
        toast.error('Nome da tag não pode estar vazio');
        return;
      }

      const contractTags = tags.get(contractId) || [];
      
      // Verificar se tag já existe
      if (contractTags.some((t) => t.tag_name.toLowerCase() === tagName.toLowerCase())) {
        toast.error('Esta tag já existe para este contrato');
        return;
      }

      const newTag: ContractTag = {
        id: `${contractId}-${tagName}-${Date.now()}`,
        contract_id: contractId,
        tag_name: tagName.trim(),
        color: color || DEFAULT_TAG_COLORS[contractTags.length % DEFAULT_TAG_COLORS.length],
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const newTags = new Map(tags);
      newTags.set(contractId, [...contractTags, newTag]);
      setTags(newTags);
      saveTags(newTags);
      toast.success('Tag adicionada');
    },
    [tags, user?.id, saveTags]
  );

  // Remover tag de um contrato
  const removeTag = useCallback(
    (contractId: string, tagId: string) => {
      if (!user?.id) return;

      const contractTags = tags.get(contractId) || [];
      const filtered = contractTags.filter((t) => t.id !== tagId);

      const newTags = new Map(tags);
      if (filtered.length === 0) {
        newTags.delete(contractId);
      } else {
        newTags.set(contractId, filtered);
      }

      setTags(newTags);
      saveTags(newTags);
      toast.success('Tag removida');
    },
    [tags, user?.id, saveTags]
  );

  // Obter todas as tags únicas (para filtros)
  const getAllTags = useCallback((): ContractTag[] => {
    const allTagsSet = new Map<string, ContractTag>();
    tags.forEach((contractTags) => {
      contractTags.forEach((tag) => {
        const key = tag.tag_name.toLowerCase();
        if (!allTagsSet.has(key)) {
          allTagsSet.set(key, tag);
        }
      });
    });
    return Array.from(allTagsSet.values());
  }, [tags]);

  // Obter cores disponíveis
  const getAvailableColors = useCallback((): string[] => {
    return DEFAULT_TAG_COLORS;
  }, []);

  return {
    getContractTags,
    addTag,
    removeTag,
    getAllTags,
    getAvailableColors,
    isLoading,
  };
}

