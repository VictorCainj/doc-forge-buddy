/**
 * Componente para exibir e gerenciar tags de contratos
 */

import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from '@/lib/icons';
import { useContractTags } from '@/hooks/useContractTags';
'@/utils/automaticTags';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContractTagsProps {
  contractId: string;
  contract?: Contract; // Contrato para gerar tags automáticas
  tags?: ContractTag[];
  maxVisible?: number;
  showAddButton?: boolean;
  className?: string;
}

/**
 * Componente para exibir tags de um contrato
 */
export const ContractTags = memo<ContractTagsProps>(
  ({ contractId, contract, tags: externalTags, maxVisible = 3, showAddButton = true, className }) => {
    const { getContractTags, addTag, removeTag, getAvailableColors, isLoading } = useContractTags();
    const { user } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const popoverRef = useRef<HTMLDivElement>(null);

    // Usar tags externas se fornecidas, senão buscar do hook
    const manualTags = externalTags || getContractTags(contractId);
    
    // Gerar tag automática se o contrato for fornecido
    const automaticTag = useMemo(() => {
      if (!contract || !user?.id) return null;
      return generateAutomaticTag(contract, user.id);
    }, [contract, user?.id]);

    // Combinar tags automáticas com tags manuais (automáticas primeiro)
    const tags = useMemo(() => {
      const allTags: ContractTag[] = [];
      
      // Adicionar tag automática primeiro se existir
      if (automaticTag) {
        allTags.push(automaticTag);
      }
      
      // Adicionar tags manuais (filtrar tags automáticas antigas que podem estar no storage)
      const filteredManualTags = manualTags.filter(tag => !tag.id.startsWith('auto-'));
      allTags.push(...filteredManualTags);
      
      return allTags;
    }, [automaticTag, manualTags]);

    const availableColors = getAvailableColors();

    // Fechar popover ao clicar fora
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsAdding(false);
          setNewTagName('');
          setSelectedColor('');
        }
      };

      if (isAdding) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isAdding]);

    const handleAddTag = useCallback(() => {
      if (!newTagName.trim()) {
        toast.error('Digite um nome para a tag');
        return;
      }

      addTag(contractId, newTagName.trim(), selectedColor || undefined);
      setNewTagName('');
      setSelectedColor('');
      setIsAdding(false);
    }, [contractId, newTagName, selectedColor, addTag]);

    const handleRemoveTag = useCallback(
      (tagId: string) => {
        removeTag(contractId, tagId);
      },
      [contractId, removeTag]
    );

    const visibleTags = tags.slice(0, maxVisible);
    const hiddenTagsCount = tags.length - maxVisible;

    // Não mostrar loading se já temos tags externas ou se temos tag automática
    if (isLoading && !externalTags && !automaticTag) {
      return (
        <div className={`flex flex-wrap gap-2 ${className || ''}`}>
          <div className="h-6 w-16 bg-neutral-200 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
        </div>
      );
    }

    return (
      <div 
        className={`flex flex-wrap items-center gap-2 relative ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {visibleTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="text-xs px-2 py-1 flex items-center gap-1 group cursor-default"
            style={{
              backgroundColor: `${tag.color}15`,
              borderColor: tag.color,
              color: tag.color,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span>{tag.tag_name}</span>
            {/* Só mostrar botão de remover para tags manuais */}
            {showAddButton && !tag.id.startsWith('auto-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1 hover:bg-current/20 rounded-full p-0.5"
                aria-label={`Remover tag ${tag.tag_name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {hiddenTagsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{hiddenTagsCount}
          </Badge>
        )}

        {showAddButton && (
          <div className="relative" ref={popoverRef}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-neutral-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsAdding(!isAdding);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>

            {isAdding && (
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-elevation-3 p-3 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      Nome da tag
                    </label>
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Ex: Urgente, Importante..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag();
                        }
                        if (e.key === 'Escape') {
                          setIsAdding(false);
                          setNewTagName('');
                          setSelectedColor('');
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-2 block">
                      Cor
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`
                            w-6 h-6 rounded-full border-2 transition-all
                            ${
                              selectedColor === color
                                ? 'border-neutral-900 scale-110'
                                : 'border-neutral-300 hover:scale-105'
                            }
                          `}
                          style={{ backgroundColor: color }}
                          aria-label={`Selecionar cor ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                        setNewTagName('');
                        setSelectedColor('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleAddTag}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ContractTags.displayName = 'ContractTags';

